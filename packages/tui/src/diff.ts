import {
  ATTR_LUT,
  attributesToByte,
  buildAnsiSequence,
  colorToAnsi,
  ESC,
  ESC_RESET,
  moveTo,
} from "./ansi.ts";
import {
  cellEquals,
  emptyCell,
  packCell,
  unpackAttr,
  unpackBgColor,
  unpackChar,
  unpackFgColor,
} from "./cell.ts";
import type { Attributes, Cell, Color } from "./types.ts";

// ANSI state tracker
interface AnsiState {
  attr: number; // Current attribute byte
  fg?: Color; // Current foreground color
  bg?: Color; // Current background color
}

// Color sequence cache
const colorCache = new Map<string, string>();
const MAX_CACHE_SIZE = 1000;

function getCachedColorSequence(fg?: Color, bg?: Color): string {
  const key = `${fg || ""}_${bg || ""}`;

  const cached = colorCache.get(key);
  if (cached) {
    return cached;
  }

  // Build new sequence
  const parts: string[] = [];
  if (fg) {
    const fgSeq = colorToAnsi(fg, false);
    if (fgSeq) {
      parts.push(fgSeq.slice(2, -1));
    }
  }
  if (bg) {
    const bgSeq = colorToAnsi(bg, true);
    if (bgSeq) {
      parts.push(bgSeq.slice(2, -1));
    }
  }

  const sequence = parts.length > 0 ? `${ESC}${parts.join(";")}m` : "";

  // Cache it (with LRU-like behavior)
  if (colorCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = colorCache.keys().next().value;
    if (firstKey) {
      colorCache.delete(firstKey);
    }
  }
  colorCache.set(key, sequence);

  return sequence;
}

/**
 * Optimized diff engine with inline colors and state tracking
 */
export class DiffEngine {
  private rows: number;
  private cols: number;
  private size: number;

  // Double buffers using Cell
  private prev: Cell[];
  private curr: Cell[];
  private dirty: Uint8Array;

  // ANSI state tracking
  private ansiState: AnsiState = { attr: 0 };

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.size = rows * cols;

    // Allocate buffers
    this.prev = new Array(this.size);
    this.curr = new Array(this.size);
    this.dirty = new Uint8Array(rows);

    // Initialize with empty cells
    const empty = emptyCell();
    for (let i = 0; i < this.size; i++) {
      this.prev[i] = empty;
      this.curr[i] = empty;
    }
  }

  /**
   * Mark a row as dirty
   */
  markDirty(row: number): void {
    if (row >= 0 && row < this.rows) {
      this.dirty[row] = 1;
    }
  }

  /**
   * Mark all rows as dirty
   */
  markAllDirty(): void {
    this.dirty.fill(1);
  }

  /**
   * Set a cell with attributes and colors
   */
  setCellWithAttrs(
    row: number,
    col: number,
    char: string,
    attrs?: Attributes
  ): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return;
    }

    const index = row * this.cols + col;
    const attrByte = attrs ? attributesToByte(attrs) : 0;
    const newCell = packCell(char, attrByte, attrs?.fg, attrs?.bg);

    const currentCell = this.curr[index];
    if (!(currentCell && cellEquals(currentCell, newCell))) {
      this.curr[index] = newCell;
      this.markDirty(row);
    }
  }

  /**
   * Set a cell
   */
  setCell(row: number, col: number, cell: Cell): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return;
    }

    const index = row * this.cols + col;
    if (!(this.curr[index] && cellEquals(this.curr[index], cell))) {
      this.curr[index] = cell;
      this.markDirty(row);
    }
  }

  /**
   * Get a cell
   */
  getCell(row: number, col: number): Cell {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return emptyCell();
    }
    return this.curr[row * this.cols + col] || emptyCell();
  }

  /**
   * Clear the current buffer
   */
  clear(): void {
    const empty = emptyCell();
    for (let i = 0; i < this.size; i++) {
      this.curr[i] = empty;
    }
    this.markAllDirty();
  }

  /**
   * Generate optimized ANSI sequence for state change
   */
  private generateStateChange(
    newAttr: number,
    newFg?: Color,
    newBg?: Color
  ): string {
    let output = "";

    // Check what changed
    const attrChanged = this.ansiState.attr !== newAttr;
    const fgChanged = this.ansiState.fg !== newFg;
    const bgChanged = this.ansiState.bg !== newBg;

    if (!(attrChanged || fgChanged || bgChanged)) {
      return ""; // No change needed
    }

    // Optimize common cases
    if (attrChanged && !fgChanged && !bgChanged) {
      // Only attributes changed
      output = ATTR_LUT[newAttr] || "";
    } else if (!attrChanged && (fgChanged || bgChanged)) {
      // Only colors changed - use cached sequences
      const colorSeq = getCachedColorSequence(
        fgChanged ? newFg : this.ansiState.fg,
        bgChanged ? newBg : this.ansiState.bg
      );
      output = colorSeq;
    } else {
      // Full change - build complete sequence
      const attrs: Attributes = {};
      // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operations for attribute checking
      if (newAttr & 0x01) {
        attrs.bold = true;
      }
      // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operations for attribute checking
      if (newAttr & 0x02) {
        attrs.dim = true;
      }
      // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operations for attribute checking
      if (newAttr & 0x04) {
        attrs.italic = true;
      }
      // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operations for attribute checking
      if (newAttr & 0x08) {
        attrs.underline = true;
      }
      // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operations for attribute checking
      if (newAttr & 0x10) {
        attrs.reverse = true;
      }
      // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operations for attribute checking
      if (newAttr & 0x20) {
        attrs.strikethrough = true;
      }
      if (newFg) {
        attrs.fg = newFg;
      }
      if (newBg) {
        attrs.bg = newBg;
      }

      output = buildAnsiSequence(attrs);
    }

    // Update state
    this.ansiState.attr = newAttr;
    this.ansiState.fg = newFg;
    this.ansiState.bg = newBg;

    return output;
  }

  /**
   * Find the end of a run of cells with the same styling
   */
  private findRunEnd(
    row: number,
    startCol: number,
    runAttr: number,
    runFg: Color | undefined,
    runBg: Color | undefined
  ): number {
    const offset = row * this.cols;
    let runEnd = startCol;

    while (runEnd < this.cols) {
      const idx = offset + runEnd;
      const currCell = this.curr[idx];
      if (!currCell) {
        break;
      }

      // Check if attributes/colors match
      if (
        unpackAttr(currCell) !== runAttr ||
        unpackFgColor(currCell) !== runFg ||
        unpackBgColor(currCell) !== runBg
      ) {
        break;
      }

      runEnd++;
    }

    return runEnd;
  }

  /**
   * Check if a run of cells has changes
   */
  private runHasChanges(
    row: number,
    startCol: number,
    endCol: number
  ): boolean {
    const offset = row * this.cols;

    for (let col = startCol; col < endCol; col++) {
      const idx = offset + col;
      const currCell = this.curr[idx];
      const prevCell = this.prev[idx];

      if (!(prevCell && currCell && cellEquals(prevCell, currCell))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Output a run of cells
   */
  private outputRun(
    row: number,
    startCol: number,
    endCol: number,
    runAttr: number,
    runFg: Color | undefined,
    runBg: Color | undefined
  ): string {
    let output = "";
    const offset = row * this.cols;

    // Apply state change if needed
    const stateChange = this.generateStateChange(runAttr, runFg, runBg);
    if (stateChange) {
      output += stateChange;
    }

    // Output characters
    for (let i = startCol; i < endCol; i++) {
      const idx = offset + i;
      const cell = this.curr[idx];
      if (cell) {
        output += unpackChar(cell);
      }
    }

    // Update previous buffer
    for (let i = startCol; i < endCol; i++) {
      const idx = offset + i;
      const currCell = this.curr[idx];
      if (currCell) {
        this.prev[idx] = currCell;
      }
    }

    return output;
  }

  /**
   * Compute diff with optimized color handling
   */
  computeDiff(): string {
    let output = "";
    let lastRow = -1;
    let lastCol = -1;

    // Reset ANSI state for new frame
    this.ansiState = { attr: 0 };

    for (let row = 0; row < this.rows; row++) {
      if (!this.isDirty(row)) {
        continue;
      }

      const offset = row * this.cols;

      // Process cells in this row
      let col = 0;
      while (col < this.cols) {
        const index = offset + col;

        // Find run of cells with same styling
        const startCol = col;
        const startCell = this.curr[index];
        if (!startCell) {
          continue;
        }

        const runAttr = unpackAttr(startCell);
        const runFg = unpackFgColor(startCell);
        const runBg = unpackBgColor(startCell);

        // Find run of cells with same styling
        const runEnd = this.findRunEnd(row, startCol, runAttr, runFg, runBg);

        // Check if this run has changes
        const hasChanges = this.runHasChanges(row, startCol, runEnd);

        // Output run if it has changes
        if (hasChanges) {
          // Move cursor if needed
          if (lastRow !== row || lastCol !== startCol) {
            output += moveTo(row + 1, startCol + 1);
            lastRow = row;
            lastCol = startCol;
          }

          // Output the run
          output += this.outputRun(
            row,
            startCol,
            runEnd,
            runAttr,
            runFg,
            runBg
          );

          lastCol = runEnd;
        }

        col = runEnd;
      }

      // Clear dirty flag
      this.dirty[row] = 0;
    }

    // Reset at end if needed
    if (
      output &&
      (this.ansiState.attr !== 0 || this.ansiState.fg || this.ansiState.bg)
    ) {
      output += ESC_RESET;
    }

    return output;
  }

  /**
   * Check if row is dirty
   */
  private isDirty(row: number): boolean {
    return this.dirty[row] === 1;
  }

  /**
   * Swap buffers (no-op in our implementation)
   */
  swap(): void {
    // In our implementation, we update prev during diff computation
    // So this is a no-op
  }

  /**
   * Resize buffers
   */
  resize(rows: number, cols: number): void {
    if (rows === this.rows && cols === this.cols) {
      return;
    }

    // Create new buffers
    const newSize = rows * cols;
    const newPrev = new Array<Cell>(newSize);
    const newCurr = new Array<Cell>(newSize);
    const newDirty = new Uint8Array(rows);

    // Fill with empty cells
    const empty = emptyCell();
    for (let i = 0; i < newSize; i++) {
      newPrev[i] = empty;
      newCurr[i] = empty;
    }

    // Mark all as dirty
    newDirty.fill(1);

    // Update instance
    this.rows = rows;
    this.cols = cols;
    this.size = newSize;
    this.prev = newPrev;
    this.curr = newCurr;
    this.dirty = newDirty;
  }
}
