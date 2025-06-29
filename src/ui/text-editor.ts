import { EventEmitter } from "node:events";
import { debugLog } from "../utils/debug";
import { HotkeyManager } from "../utils/hotkey-manager";
import type { KeyEvent } from "../utils/key-event";

// Regular expressions for word navigation
const WORD_BOUNDARY_REGEX = /[^\p{L}\p{N}_]/u;
const WHITESPACE_REGEX = /\s/;

export interface TextPosition {
  line: number;
  char: number;
}

export interface TextSelection {
  from: TextPosition;
  to: TextPosition;
}

export interface TextEditorOptions {
  multiline?: boolean;
  initialContent?: string;
  initialCursorLine?: number;
  initialCursorChar?: number;
}

export interface TextEditorState {
  lines: string[];
  cursorPosition: TextPosition;
  selection: TextSelection | null;
  focused: boolean;
}

export class TextEditor extends EventEmitter {
  private lines: string[];
  private cursorLine: number;
  private cursorChar: number;
  private selection: TextSelection | null = null;
  private multiline: boolean;
  private focused = true;
  readonly hotkeys: HotkeyManager;

  constructor(options: TextEditorOptions = {}) {
    super();
    this.multiline = options.multiline ?? true;
    this.hotkeys = new HotkeyManager();
    this.setupStandardHotkeys();

    // Initialize content
    if (options.initialContent) {
      this.lines = this.multiline
        ? options.initialContent.split("\n")
        : [options.initialContent];
    } else {
      this.lines = [""];
    }

    // Initialize cursor
    this.cursorLine = options.initialCursorLine ?? 0;
    this.cursorChar = options.initialCursorChar ?? 0;

    // Ensure cursor is within bounds
    this.constrainCursor();
  }

  // State accessors
  getState(): TextEditorState {
    return {
      lines: [...this.lines],
      cursorPosition: { line: this.cursorLine, char: this.cursorChar },
      selection: this.selection
        ? {
            from: { ...this.selection.from },
            to: { ...this.selection.to },
          }
        : null,
      focused: this.focused,
    };
  }

  getContent(): string {
    return this.lines.join("\n");
  }

  getLines(): string[] {
    return [...this.lines];
  }

  getCursorPosition(): TextPosition {
    return { line: this.cursorLine, char: this.cursorChar };
  }

  getSelection(): TextSelection | null {
    return this.selection
      ? {
          from: { ...this.selection.from },
          to: { ...this.selection.to },
        }
      : null;
  }

  isEmpty(): boolean {
    return this.lines.length === 1 && this.lines[0] === "";
  }

  setFocused(focused: boolean): void {
    this.focused = focused;
  }

  isFocused(): boolean {
    return this.focused;
  }

  // Core operations
  insertChar(char: string): void {
    if (this.selection) {
      this.deleteSelection();
    }

    const line = this.lines[this.cursorLine];

    // Debug character insertion
    if (char === "`" || line?.includes("`")) {
      debugLog("EDITOR", "Inserting character", { char, line });
    }
    if (line !== undefined) {
      this.lines[this.cursorLine] =
        line.slice(0, this.cursorChar) + char + line.slice(this.cursorChar);
      this.cursorChar += char.length;

      // Debug result
      const currentLine = this.lines[this.cursorLine];
      if (char === "`" || currentLine?.includes("`")) {
        debugLog("EDITOR", "Result line", { line: currentLine });
      }
    }
    this.emitChange();
  }

  deleteChar(): void {
    // backspace
    if (this.selection) {
      this.deleteSelection();
      return;
    }

    if (this.cursorChar > 0) {
      const line = this.lines[this.cursorLine];
      if (line !== undefined) {
        this.lines[this.cursorLine] =
          line.slice(0, this.cursorChar - 1) + line.slice(this.cursorChar);
        this.cursorChar--;
      }
    } else if (this.multiline && this.cursorLine > 0) {
      // Join with previous line
      this.joinWithPreviousLine();
      return;
    }
    this.emitChange();
  }

  deleteCharForward(): void {
    // delete key
    if (this.selection) {
      this.deleteSelection();
      return;
    }

    const line = this.lines[this.cursorLine];
    if (line !== undefined) {
      if (this.cursorChar < line.length) {
        this.lines[this.cursorLine] =
          line.slice(0, this.cursorChar) + line.slice(this.cursorChar + 1);
      } else if (this.multiline && this.cursorLine < this.lines.length - 1) {
        // Join with next line
        const nextLine = this.lines[this.cursorLine + 1];
        if (nextLine !== undefined) {
          this.lines[this.cursorLine] = line + nextLine;
          this.lines.splice(this.cursorLine + 1, 1);
        }
      }
    }
    this.emitChange();
  }

  // Navigation
  moveCursorLeft(preserveSelection = false): void {
    if (!preserveSelection && this.selection) {
      // When clearing selection with left arrow, move to start of selection
      const { from } = this.normalizeSelection();
      this.cursorLine = from.line;
      this.cursorChar = from.char;
      this.clearSelection();
      return;
    }

    if (!preserveSelection) {
      this.clearSelection();
    }

    if (this.cursorChar > 0) {
      this.cursorChar--;
    } else if (this.multiline && this.cursorLine > 0) {
      this.cursorLine--;
      const line = this.lines[this.cursorLine];
      if (line !== undefined) {
        this.cursorChar = line.length;
      }
    }
  }

  moveCursorRight(preserveSelection = false): void {
    if (!preserveSelection && this.selection) {
      // When clearing selection with right arrow, move to end of selection
      const { to } = this.normalizeSelection();
      this.cursorLine = to.line;
      this.cursorChar = to.char;
      this.clearSelection();
      return;
    }

    if (!preserveSelection) {
      this.clearSelection();
    }

    const currentLine = this.lines[this.cursorLine];
    if (currentLine !== undefined) {
      if (this.cursorChar < currentLine.length) {
        this.cursorChar++;
      } else if (this.multiline && this.cursorLine < this.lines.length - 1) {
        this.cursorLine++;
        this.cursorChar = 0;
      }
    }
  }

  moveCursorUp(preserveSelection = false): void {
    if (!this.multiline) {
      return;
    }

    if (!preserveSelection) {
      this.clearSelection();
    }

    if (this.cursorLine > 0) {
      this.cursorLine--;
      this.constrainCursorToLine();
    }
  }

  moveCursorDown(preserveSelection = false): void {
    if (!this.multiline) {
      return;
    }

    if (!preserveSelection) {
      this.clearSelection();
    }

    if (this.cursorLine < this.lines.length - 1) {
      this.cursorLine++;
      this.constrainCursorToLine();
    }
  }

  private findWordStart(content: string, pos: number): number {
    let newPos = pos;

    // Skip trailing whitespace
    while (newPos > 0 && this.isWhitespace(content[newPos - 1])) {
      newPos--;
    }

    // Find beginning of word
    while (newPos > 0 && !this.isWordBoundary(content[newPos - 1])) {
      newPos--;
    }

    return newPos;
  }

  moveCursorWordLeft(preserveSelection = false): void {
    if (!preserveSelection) {
      this.clearSelection();
    }

    if (this.cursorChar === 0) {
      if (this.multiline && this.cursorLine > 0) {
        this.cursorLine--;
        const line = this.lines[this.cursorLine];
        if (line !== undefined) {
          this.cursorChar = this.findWordStart(line, line.length);
        }
      }
      return;
    }

    const content = this.lines[this.cursorLine];
    if (content !== undefined) {
      let newPos = this.cursorChar - 1;

      // Skip any whitespace
      while (newPos > 0 && this.isWhitespace(content[newPos])) {
        newPos--;
      }

      // If we're at a word boundary, skip to the previous word
      if (
        newPos > 0 &&
        this.isWordBoundary(content[newPos]) &&
        !this.isWordBoundary(content[newPos - 1])
      ) {
        newPos--;
      }

      // Move to the beginning of the current word
      while (newPos > 0 && !this.isWordBoundary(content[newPos - 1])) {
        newPos--;
      }

      this.cursorChar = newPos;
    }
  }

  moveCursorWordRight(preserveSelection = false): void {
    if (!preserveSelection) {
      this.clearSelection();
    }

    const content = this.lines[this.cursorLine];
    if (content !== undefined) {
      if (this.cursorChar >= content.length) {
        if (this.multiline && this.cursorLine < this.lines.length - 1) {
          this.cursorLine++;
          const nextLine = this.lines[this.cursorLine];
          if (nextLine !== undefined) {
            this.cursorChar = this.findNextWordPosition(nextLine, 0);
          }
        }
        return;
      }

      this.cursorChar = this.findNextWordPosition(content, this.cursorChar);
    }
  }

  moveCursorToLineStart(preserveSelection = false): void {
    if (!preserveSelection) {
      this.clearSelection();
    }
    this.cursorChar = 0;
  }

  moveCursorToLineEnd(preserveSelection = false): void {
    if (!preserveSelection) {
      this.clearSelection();
    }
    const line = this.lines[this.cursorLine];
    if (line !== undefined) {
      this.cursorChar = line.length;
    }
  }

  // Deletion operations
  deleteWord(): void {
    if (this.selection) {
      this.deleteSelection();
      return;
    }

    if (this.cursorChar === 0) {
      if (this.multiline && this.cursorLine > 0) {
        this.joinWithPreviousLine();
      }
      return;
    }

    const content = this.lines[this.cursorLine];
    if (content !== undefined) {
      let deleteToPos = this.cursorChar - 1;

      // Skip any whitespace
      while (deleteToPos > 0 && this.isWhitespace(content[deleteToPos])) {
        deleteToPos--;
      }

      // Delete the word
      if (deleteToPos >= 0) {
        if (
          this.isWordBoundary(content[deleteToPos]) &&
          !this.isWhitespace(content[deleteToPos])
        ) {
          // Single special character - deleteToPos is already correct
        } else {
          // Regular word
          while (
            deleteToPos > 0 &&
            !this.isWordBoundary(content[deleteToPos - 1])
          ) {
            deleteToPos--;
          }
        }
      }

      this.lines[this.cursorLine] =
        content.slice(0, deleteToPos) + content.slice(this.cursorChar);
      this.cursorChar = deleteToPos;
    }
    this.emitChange();
  }

  deleteWordForward(): void {
    if (this.selection) {
      this.deleteSelection();
      return;
    }

    const content = this.lines[this.cursorLine];
    if (content !== undefined) {
      let deleteToPos = this.cursorChar;

      // Skip any whitespace
      while (
        deleteToPos < content.length &&
        this.isWhitespace(content[deleteToPos])
      ) {
        deleteToPos++;
      }

      // Delete the word
      if (deleteToPos < content.length) {
        if (
          this.isWordBoundary(content[deleteToPos]) &&
          !this.isWhitespace(content[deleteToPos])
        ) {
          // Single special character
          deleteToPos++;
        } else {
          // Regular word
          while (
            deleteToPos < content.length &&
            !this.isWordBoundary(content[deleteToPos])
          ) {
            deleteToPos++;
          }
        }
      }

      // If at end of line and multiline, delete the line break
      if (
        deleteToPos === content.length &&
        this.multiline &&
        this.cursorLine < this.lines.length - 1
      ) {
        const nextLine = this.lines[this.cursorLine + 1];
        if (nextLine !== undefined) {
          this.lines[this.cursorLine] = content + nextLine;
          this.lines.splice(this.cursorLine + 1, 1);
        }
      } else {
        this.lines[this.cursorLine] =
          content.slice(0, this.cursorChar) + content.slice(deleteToPos);
      }
    }
    this.emitChange();
  }

  deleteToLineStart(): void {
    if (this.selection) {
      this.deleteSelection();
      return;
    }

    const content = this.lines[this.cursorLine];
    if (content !== undefined) {
      this.lines[this.cursorLine] = content.slice(this.cursorChar);
      this.cursorChar = 0;
    }
    this.emitChange();
  }

  deleteToLineEnd(): void {
    if (this.selection) {
      this.deleteSelection();
      return;
    }

    const content = this.lines[this.cursorLine];
    if (content !== undefined) {
      this.lines[this.cursorLine] = content.slice(0, this.cursorChar);
    }
    this.emitChange();
  }

  // Selection operations
  startSelection(): void {
    if (!this.selection) {
      this.selection = {
        from: { line: this.cursorLine, char: this.cursorChar },
        to: { line: this.cursorLine, char: this.cursorChar },
      };
    }
  }

  extendSelection(position: TextPosition): void {
    if (!this.selection) {
      this.startSelection();
    }

    if (this.selection) {
      this.selection.to = { ...position };

      // Check if selection became empty (backtracked to start)
      if (
        this.selection.from.line === this.selection.to.line &&
        this.selection.from.char === this.selection.to.char
      ) {
        this.selection = null;
      }
    }
  }

  clearSelection(): void {
    this.selection = null;
  }

  getSelectedText(): string {
    if (!this.selection) {
      return "";
    }

    const { from, to } = this.normalizeSelection();

    if (from.line === to.line) {
      // Single line selection
      const line = this.lines[from.line];
      return line ? line.slice(from.char, to.char) : "";
    }
    // Multi-line selection
    let result = "";
    const firstLine = this.lines[from.line];
    if (firstLine) {
      result = `${firstLine.slice(from.char)}\n`;
    }

    for (let i = from.line + 1; i < to.line; i++) {
      const middleLine = this.lines[i];
      if (middleLine !== undefined) {
        result += `${middleLine}\n`;
      }
    }

    const lastLine = this.lines[to.line];
    if (lastLine) {
      result += lastLine.slice(0, to.char);
    }
    return result;
  }

  deleteSelection(): void {
    if (!this.selection) {
      return;
    }

    const { from, to } = this.normalizeSelection();

    if (from.line === to.line) {
      // Single line deletion
      const line = this.lines[from.line];
      if (line !== undefined) {
        this.lines[from.line] = line.slice(0, from.char) + line.slice(to.char);
      }
    } else {
      // Multi-line deletion
      const fromLine = this.lines[from.line];
      const toLine = this.lines[to.line];
      if (fromLine !== undefined && toLine !== undefined) {
        const beforeSelection = fromLine.slice(0, from.char);
        const afterSelection = toLine.slice(to.char);

        this.lines[from.line] = beforeSelection + afterSelection;
        this.lines.splice(from.line + 1, to.line - from.line);
      }
    }

    this.cursorLine = from.line;
    this.cursorChar = from.char;
    this.selection = null;
    this.emitChange();
  }

  replaceSelection(text: string): void {
    if (!this.selection) {
      // No selection, just insert
      this.insertChar(text);
      return;
    }

    this.deleteSelection();

    if (this.multiline && text.includes("\n")) {
      // Handle multi-line insertion
      const newLines = text.split("\n");
      const currentLine = this.lines[this.cursorLine];
      if (currentLine !== undefined) {
        const beforeCursor = currentLine.slice(0, this.cursorChar);
        const afterCursor = currentLine.slice(this.cursorChar);

        this.lines[this.cursorLine] = beforeCursor + newLines[0];

        for (let i = 1; i < newLines.length - 1; i++) {
          const line = newLines[i];
          if (line !== undefined) {
            this.lines.splice(this.cursorLine + i, 0, line);
          }
        }

        if (newLines.length > 1) {
          const lastLineIndex = this.cursorLine + newLines.length - 1;
          const lastNewLine = newLines.at(-1);
          if (lastNewLine !== undefined) {
            this.lines.splice(lastLineIndex, 0, lastNewLine + afterCursor);
            this.cursorLine = lastLineIndex;
            this.cursorChar = lastNewLine.length;
          }
        } else {
          const line = this.lines[this.cursorLine];
          if (line !== undefined) {
            this.cursorChar = line.length - afterCursor.length;
          }
        }
        this.emitChange();
      }
    } else {
      // Single line insertion
      this.insertChar(text);
    }
  }

  // Line operations (multi-line only)
  insertNewLine(): void {
    if (!this.multiline) {
      return;
    }

    if (this.selection) {
      this.deleteSelection();
    }

    const currentLine = this.lines[this.cursorLine];
    if (currentLine !== undefined) {
      const beforeCursor = currentLine.slice(0, this.cursorChar);
      const afterCursor = currentLine.slice(this.cursorChar);

      this.lines[this.cursorLine] = beforeCursor;
      this.lines.splice(this.cursorLine + 1, 0, afterCursor);

      this.cursorLine++;
      this.cursorChar = 0;
    }
    this.emitChange();
  }

  joinWithPreviousLine(): void {
    if (!this.multiline || this.cursorLine === 0) {
      return;
    }

    const previousLine = this.lines[this.cursorLine - 1];
    const currentLine = this.lines[this.cursorLine];

    if (previousLine !== undefined && currentLine !== undefined) {
      this.lines[this.cursorLine - 1] = previousLine + currentLine;
      this.lines.splice(this.cursorLine, 1);

      this.cursorLine--;
      this.cursorChar = previousLine.length;
    }
    this.emitChange();
  }

  swapLineUp(): void {
    if (!this.multiline || this.cursorLine === 0) {
      return;
    }

    const currentLine = this.lines[this.cursorLine];
    const previousLine = this.lines[this.cursorLine - 1];

    if (currentLine !== undefined && previousLine !== undefined) {
      this.lines[this.cursorLine] = previousLine;
      this.lines[this.cursorLine - 1] = currentLine;

      this.cursorLine--;
    }
    this.emitChange();
  }

  swapLineDown(): void {
    if (!this.multiline || this.cursorLine >= this.lines.length - 1) {
      return;
    }

    const currentLine = this.lines[this.cursorLine];
    const nextLine = this.lines[this.cursorLine + 1];

    if (currentLine !== undefined && nextLine !== undefined) {
      this.lines[this.cursorLine] = nextLine;
      this.lines[this.cursorLine + 1] = currentLine;

      this.cursorLine++;
    }
    this.emitChange();
  }

  // Navigation with selection
  navigateWithSelection(action: () => void): void {
    if (!this.selection) {
      this.startSelection();
    }

    // Call the action with preserveSelection = true
    action();

    if (this.selection) {
      this.extendSelection({ line: this.cursorLine, char: this.cursorChar });
    }
  }

  // Helper methods
  private constrainCursor(): void {
    this.cursorLine = Math.max(
      0,
      Math.min(this.cursorLine, this.lines.length - 1)
    );
    this.constrainCursorToLine();
  }

  private constrainCursorToLine(): void {
    const line = this.lines[this.cursorLine];
    if (line !== undefined) {
      const lineLength = line.length;
      this.cursorChar = Math.max(0, Math.min(this.cursorChar, lineLength));
    }
  }

  private isWordBoundary(char: string | undefined): boolean {
    return char !== undefined && WORD_BOUNDARY_REGEX.test(char);
  }

  private isWhitespace(char: string | undefined): boolean {
    return char !== undefined && WHITESPACE_REGEX.test(char);
  }

  private findNextWordPosition(content: string, startPos: number): number {
    let newPos = startPos;

    // Skip any whitespace we're currently in
    while (newPos < content.length && this.isWhitespace(content[newPos])) {
      newPos++;
    }

    // If we're at a non-whitespace word boundary (special char), move past just this one character
    if (
      newPos < content.length &&
      this.isWordBoundary(content[newPos]) &&
      !this.isWhitespace(content[newPos])
    ) {
      newPos++;
    } else {
      // We're in a word, skip to the end of it
      while (newPos < content.length && !this.isWordBoundary(content[newPos])) {
        newPos++;
      }
    }

    return newPos;
  }

  private normalizeSelection(): { from: TextPosition; to: TextPosition } {
    if (!this.selection) {
      throw new Error("No selection to normalize");
    }

    const { from, to } = this.selection;

    if (from.line > to.line || (from.line === to.line && from.char > to.char)) {
      return { from: to, to: from };
    }

    return { from, to };
  }

  // Helper methods to avoid recreation
  setCursorPosition(line: number, char: number): void {
    this.cursorLine = line;
    this.cursorChar = char;
    this.constrainCursor();
    this.clearSelection();
    this.emitChange();
  }

  setContent(content: string, cursorLine?: number, cursorChar?: number): void {
    this.lines = this.multiline ? content.split("\n") : [content];
    if (cursorLine !== undefined) {
      this.cursorLine = cursorLine;
    }
    if (cursorChar !== undefined) {
      this.cursorChar = cursorChar;
    }
    this.constrainCursor();
    this.clearSelection();
    this.emitChange();
  }

  insertLine(index: number, content: string): void {
    if (!this.multiline) {
      return;
    }
    this.lines.splice(index, 0, content);
    this.emitChange();
  }

  reset(): void {
    this.lines = [""];
    this.cursorLine = 0;
    this.cursorChar = 0;
    this.selection = null;
    this.emitChange();
  }

  // Event emission
  private emitChange(): void {
    this.emit("change");
  }

  // Setup standard hotkeys
  private setupStandardHotkeys(): void {
    // IMPORTANT: Order matters! More specific combinations must be defined first

    // Selection word navigation (Shift+Option+Arrow) - MOST SPECIFIC
    this.hotkeys.bind("Shift+Alt+left,Shift+Option+left", () => {
      this.navigateWithSelection(() => this.moveCursorWordLeft(true));
      this.emitChange();
      return true;
    });
    this.hotkeys.bind("Shift+Alt+right,Shift+Option+right", () => {
      this.navigateWithSelection(() => this.moveCursorWordRight(true));
      this.emitChange();
      return true;
    });

    // Selection to line boundaries (Shift+Ctrl+Arrow)
    this.hotkeys.bind(
      "Shift+Meta+Left,Shift+Ctrl+Left,Shift+Home,Shift+Ctrl+A",
      () => {
        this.navigateWithSelection(() => this.moveCursorToLineStart(true));
        this.emitChange();
        return true;
      }
    );
    this.hotkeys.bind(
      "Shift+Meta+Right,Shift+Ctrl+Right,Shift+End,Shift+Ctrl+E",
      () => {
        this.navigateWithSelection(() => this.moveCursorToLineEnd(true));
        this.emitChange();
        return true;
      }
    );

    // Selection with Shift+Arrow
    this.hotkeys.bind("Shift+Left", () => {
      this.navigateWithSelection(() => this.moveCursorLeft(true));
      this.emitChange();
      return true;
    });
    this.hotkeys.bind("Shift+Right", () => {
      this.navigateWithSelection(() => this.moveCursorRight(true));
      this.emitChange();
      return true;
    });

    if (this.multiline) {
      this.hotkeys.bind("Shift+Up", () => {
        this.navigateWithSelection(() => this.moveCursorUp(true));
        this.emitChange();
        return true;
      });
      this.hotkeys.bind("Shift+Down", () => {
        this.navigateWithSelection(() => this.moveCursorDown(true));
        this.emitChange();
        return true;
      });
    }

    // Word navigation (Option+Arrow)
    this.hotkeys.bind(
      "Alt+Left,Meta+Left,Option+Left,\\x1bb,Esc b,Meta+B",
      () => {
        this.moveCursorWordLeft();
        this.emitChange();
        return true;
      }
    );
    this.hotkeys.bind(
      "Alt+Right,Meta+Right,Option+Right,\\x1bf,Esc f,Meta+F",
      () => {
        this.moveCursorWordRight();
        this.emitChange();
        return true;
      }
    );

    // Line navigation (Ctrl+Arrow)
    this.hotkeys.bind("Ctrl+Left,Home,\\x1b[H,\\x1b[1~,Ctrl+A", () => {
      this.moveCursorToLineStart();
      this.emitChange();
      return true;
    });
    this.hotkeys.bind("Ctrl+Right,End,\\x1b[F,\\x1b[4~,Ctrl+E", () => {
      this.moveCursorToLineEnd();
      this.emitChange();
      return true;
    });

    // Plain navigation (Arrow keys) - LEAST SPECIFIC
    this.hotkeys.bind("Left", () => {
      this.moveCursorLeft();
      this.emitChange();
      return true;
    });
    this.hotkeys.bind("Right", () => {
      this.moveCursorRight();
      this.emitChange();
      return true;
    });

    if (this.multiline) {
      this.hotkeys.bind("Up", () => {
        this.moveCursorUp();
        this.emitChange();
        return true;
      });
      this.hotkeys.bind("Down", () => {
        this.moveCursorDown();
        this.emitChange();
        return true;
      });
    }

    // Deletion
    this.hotkeys.bind("Backspace", () => {
      this.deleteChar();
      this.emitChange();
      return true;
    });
    // Forward delete (Fn+Delete on Mac, Delete on PC)
    // \x1b[3~ is the common escape sequence for forward delete
    this.hotkeys.bind("Delete,\\x1b[3~", () => {
      this.deleteCharForward();
      this.emitChange();
      return true;
    });

    // Word deletion (backward)
    this.hotkeys.bind(
      "Alt+Backspace,Meta+Backspace,Option+Backspace,\\x17,\\x1b\\x7f,\\x1b\\x08,Ctrl+W",
      () => {
        this.deleteWord();
        this.emitChange();
        return true;
      }
    );

    // Word deletion (forward) - Option+Delete should delete word forward
    this.hotkeys.bind(
      "Alt+Delete,Meta+Delete,Option+Delete,Alt+\\x1b[3~,Meta+\\x1b[3~,Option+\\x1b[3~",
      () => {
        this.deleteWordForward();
        this.emitChange();
        return true;
      }
    );

    // Delete to line boundaries
    this.hotkeys.bind("Ctrl+K", () => {
      this.deleteToLineEnd();
      this.emitChange();
      return true;
    });
    this.hotkeys.bind("Ctrl+U", () => {
      this.deleteToLineStart();
      this.emitChange();
      return true;
    });

    // Multiline operations
    if (this.multiline) {
      // Enter key
      this.hotkeys.bind("return", () => {
        this.insertNewLine();
        this.emitChange();
        return true;
      });

      // Line swapping
      this.hotkeys.bind("Alt+Up,Meta+Up,Option+Up", () => {
        this.swapLineUp();
        this.emitChange();
        return true;
      });
      this.hotkeys.bind("Alt+Down,Meta+Down,Option+Down", () => {
        this.swapLineDown();
        this.emitChange();
        return true;
      });
    }
  }

  // Handle key input
  handleKeyInput(key: KeyEvent, input: string): boolean {
    // First try hotkeys
    if (this.hotkeys.handle(key, input)) {
      return true;
    }

    // Then handle character input
    if (input && !key.ctrl && !key.meta) {
      // Explicitly handle space character to ensure it's always processed
      if (input === " " || (input.length === 1 && input.charCodeAt(0) === 32)) {
        if (this.selection) {
          this.replaceSelection(" ");
        } else {
          this.insertChar(" ");
        }
        this.emitChange();
        return true;
      }

      // If there's a selection, replace it
      if (this.selection) {
        this.replaceSelection(input);
      } else {
        this.insertChar(input);
      }
      this.emitChange();
      return true;
    }

    return false;
  }
}
