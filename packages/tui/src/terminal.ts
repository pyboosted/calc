import {
  ESC_BEGIN_SYNC,
  ESC_CLEAR_SCREEN,
  ESC_END_SYNC,
  ESC_HIDE_CURSOR,
  ESC_HOME,
  ESC_SHOW_CURSOR,
  moveTo,
} from "./ansi.ts";
import { OutputBuffer } from "./buffer.ts";
import { DiffEngine } from "./diff.ts";
import type {
  Attributes,
  EventEmitter,
  ResizeEvent,
  TerminalOptions,
} from "./types.ts";

/**
 * Simple event emitter implementation
 */
class SimpleEventEmitter implements EventEmitter {
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  on(event: string, listener: (...args: unknown[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event);
    if (set) {
      set.add(listener);
    }
    return this;
  }

  off(event: string, listener: (...args: unknown[]) => void): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const listeners = this.listeners.get(event);
    if (!listeners || listeners.size === 0) {
      return false;
    }

    for (const listener of listeners) {
      listener(...args);
    }
    return true;
  }
}

/**
 * Terminal class for raw mode control and cell-based rendering
 */
export class Terminal extends SimpleEventEmitter {
  private buffer: OutputBuffer;
  private diffEngine: DiffEngine;
  private _rows = 24;
  private _cols = 80;
  private readonly options: Required<TerminalOptions>;
  private isRawMode = false;
  private resizeHandler?: () => void;
  private cleanupHandler?: () => void;

  private constructor(options: TerminalOptions = {}) {
    super();

    // Set default options
    this.options = {
      highWaterMark: options.highWaterMark ?? 64 * 1024,
      syncUpdate: options.syncUpdate ?? true, // Default to true for better performance
    };

    // Initialize components
    this.buffer = new OutputBuffer(this.options.highWaterMark);

    // Get initial terminal size
    this.updateDimensions();

    // Initialize optimized diff engine
    this.diffEngine = new DiffEngine(this._rows, this._cols);
  }

  /**
   * Open a new terminal instance
   */
  static open(options?: TerminalOptions): Terminal {
    const term = new Terminal(options);
    term.enableRawMode();
    term.setupSignalHandlers();
    // Clear screen on open
    term.write(ESC_CLEAR_SCREEN + ESC_HOME);
    term.flush();
    return term;
  }

  /**
   * Get terminal rows
   */
  get rows(): number {
    return this._rows;
  }

  /**
   * Get terminal columns
   */
  get cols(): number {
    return this._cols;
  }

  /**
   * Write raw data to terminal
   */
  write(data: string): void {
    this.buffer.write(data);
  }

  /**
   * Flush buffered output
   */
  flush(): void {
    this.buffer.flush();
  }

  /**
   * Hide cursor
   */
  hideCursor(): void {
    this.write(ESC_HIDE_CURSOR);
  }

  /**
   * Show cursor
   */
  showCursor(): void {
    this.write(ESC_SHOW_CURSOR);
  }

  /**
   * Move cursor to position (0-based)
   */
  moveTo(row: number, col: number): void {
    this.write(moveTo(row + 1, col + 1)); // Convert to 1-based
  }

  /**
   * Put a single character at position with attributes
   */
  putChar(row: number, col: number, char: string, attrs?: Attributes): void {
    this.diffEngine.setCellWithAttrs(row, col, char, attrs);
  }

  /**
   * Put text at position with attributes
   */
  putText(row: number, col: number, text: string, attrs?: Attributes): void {
    let currentCol = col;
    for (const char of text) {
      // Only write characters that fit within the terminal bounds
      if (
        currentCol < 0 ||
        currentCol >= this._cols ||
        row < 0 ||
        row >= this._rows
      ) {
        currentCol++;
        continue;
      }
      this.diffEngine.setCellWithAttrs(row, currentCol, char, attrs);
      currentCol++;
    }
  }

  /**
   * Clear the screen
   */
  clear(): void {
    // Clear the diff engine's buffers
    this.diffEngine.clear();
    // Mark everything as needing redraw
    this.diffEngine.markAllDirty();
  }

  /**
   * Force clear the physical terminal screen
   */
  clearScreen(): void {
    this.write(ESC_CLEAR_SCREEN + ESC_HOME);
    this.flush();
  }

  /**
   * Render all changes
   */
  render(): void {
    let output = "";

    // Add synchronized update wrapper if enabled
    if (this.options.syncUpdate) {
      output += ESC_BEGIN_SYNC;
    }

    // Compute diff
    output += this.diffEngine.computeDiff();

    if (this.options.syncUpdate) {
      output += ESC_END_SYNC;
    }

    // Write and flush if there's content
    if (output) {
      this.write(output);
      this.flush();
    }
  }

  /**
   * Close terminal and restore state
   */
  close(): void {
    // Show cursor
    this.showCursor();

    // Flush any remaining output
    this.flush();

    // Disable raw mode
    this.disableRawMode();

    // Remove signal handlers
    if (this.resizeHandler) {
      process.off("SIGWINCH", this.resizeHandler);
    }
    if (this.cleanupHandler) {
      process.off("SIGINT", this.cleanupHandler);
      process.off("SIGTERM", this.cleanupHandler);
    }
  }

  /**
   * Enable raw mode
   */
  private enableRawMode(): void {
    if (this.isRawMode) {
      return;
    }

    // @ts-expect-error - Bun-specific API
    if (globalThis.Bun?.stdin?.setRawMode) {
      // @ts-expect-error - Bun-specific API
      globalThis.Bun.stdin.setRawMode(true);
      this.isRawMode = true;
    }
  }

  /**
   * Disable raw mode
   */
  private disableRawMode(): void {
    if (!this.isRawMode) {
      return;
    }

    // @ts-expect-error - Bun-specific API
    if (globalThis.Bun?.stdin?.setRawMode) {
      // @ts-expect-error - Bun-specific API
      globalThis.Bun.stdin.setRawMode(false);
      this.isRawMode = false;
    }
  }

  /**
   * Update terminal dimensions
   */
  private updateDimensions(): void {
    // @ts-expect-error - Bun-specific API
    if (globalThis.Bun?.stdout?.columns && globalThis.Bun?.stdout?.rows) {
      // @ts-expect-error - Bun-specific API
      this._cols = globalThis.Bun.stdout.columns || 80;
      // @ts-expect-error - Bun-specific API
      this._rows = globalThis.Bun.stdout.rows || 24;
    } else {
      // Fallback to process.stdout
      this._cols = process.stdout.columns || 80;
      this._rows = process.stdout.rows || 24;
    }
  }

  /**
   * Handle terminal resize
   */
  private handleResize(): void {
    const oldRows = this._rows;
    const oldCols = this._cols;

    this.updateDimensions();

    if (oldRows !== this._rows || oldCols !== this._cols) {
      // Multiple clear approaches to ensure ALL content is removed
      // 1. Clear screen
      this.write(ESC_CLEAR_SCREEN);
      // 2. Move home
      this.write(ESC_HOME);
      // 3. Clear from cursor to end of screen (belt and suspenders)
      this.write("\x1b[J");
      this.flush();

      // Now resize the diff engine with clean state
      this.diffEngine.resize(this._rows, this._cols);

      // Emit resize event - the app should redraw everything
      this.emit("resize", {
        rows: this._rows,
        cols: this._cols,
      } as ResizeEvent);
    }
  }

  /**
   * Setup signal handlers
   */
  private setupSignalHandlers(): void {
    // Handle resize
    this.resizeHandler = () => this.handleResize();
    process.on("SIGWINCH", this.resizeHandler);

    // Handle cleanup
    this.cleanupHandler = () => {
      this.close();
      process.exit(0);
    };
    process.on("SIGINT", this.cleanupHandler);
    process.on("SIGTERM", this.cleanupHandler);
  }
}
