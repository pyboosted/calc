import { EventEmitter } from "node:events";
import { CalculatorEngine } from "./calculator-engine";

// Regular expressions for word navigation
const WORD_BOUNDARY_REGEX = /[^a-zA-Z0-9_]/;
const WHITESPACE_REGEX = /\s/;

export interface CalculatorState {
  lines: ReturnType<CalculatorEngine["getLines"]>;
  currentLineIndex: number;
  cursorPosition: number;
  copyHighlight: "result" | "full" | null;
}

export class CalculatorStateManager extends EventEmitter {
  private engine: CalculatorEngine;
  private currentLineIndex = 0;
  private cursorPosition = 0;
  private copyHighlight: "result" | "full" | null = null;
  private highlightTimer: NodeJS.Timeout | null = null;

  constructor(initialContent?: string) {
    super();
    this.engine = new CalculatorEngine(initialContent);
  }

  getState(): CalculatorState {
    return {
      lines: this.engine.getLines(),
      currentLineIndex: this.currentLineIndex,
      cursorPosition: this.cursorPosition,
      copyHighlight: this.copyHighlight,
    };
  }

  // Input handling methods
  handleCharacterInput(char: string) {
    const lines = this.engine.getLines();
    const line = lines[this.currentLineIndex];
    if (!line) {
      return;
    }

    const newValue =
      line.content.slice(0, this.cursorPosition) +
      char +
      line.content.slice(this.cursorPosition);

    this.engine.updateLine(this.currentLineIndex, newValue);
    this.cursorPosition += char.length;
    this.emit("stateChanged");
  }

  handleBackspace() {
    if (this.cursorPosition === 0) {
      this.handleBackspaceAtLineStart();
    } else {
      const lines = this.engine.getLines();
      const line = lines[this.currentLineIndex];
      if (!line) {
        return;
      }

      const newValue =
        line.content.slice(0, this.cursorPosition - 1) +
        line.content.slice(this.cursorPosition);

      this.engine.updateLine(this.currentLineIndex, newValue);
      this.cursorPosition--;
      this.emit("stateChanged");
    }
  }

  handleBackspaceAtLineStart() {
    if (this.currentLineIndex === 0) {
      return;
    }

    const lines = this.engine.getLines();
    const currentLine = lines[this.currentLineIndex];
    const prevLine = lines[this.currentLineIndex - 1];

    if (!(currentLine && prevLine)) {
      return;
    }

    const mergedContent = prevLine.content + currentLine.content;
    this.cursorPosition = prevLine.content.length;

    this.engine.updateLine(this.currentLineIndex - 1, mergedContent);
    this.engine.deleteLine(this.currentLineIndex);
    this.currentLineIndex--;

    this.emit("stateChanged");
  }

  handleNewLine() {
    const lines = this.engine.getLines();
    const currentLine = lines[this.currentLineIndex];
    if (!currentLine) {
      return;
    }

    const beforeCursor = currentLine.content.slice(0, this.cursorPosition);
    const afterCursor = currentLine.content.slice(this.cursorPosition);

    this.engine.updateLine(this.currentLineIndex, beforeCursor);
    this.engine.insertLine(this.currentLineIndex + 1);
    this.engine.updateLine(this.currentLineIndex + 1, afterCursor);

    this.currentLineIndex++;
    this.cursorPosition = 0;
    this.emit("stateChanged");
  }

  handleArrowLeft() {
    if (this.cursorPosition > 0) {
      this.cursorPosition--;
      this.emit("stateChanged");
    }
  }

  handleArrowRight() {
    const lines = this.engine.getLines();
    const line = lines[this.currentLineIndex];
    if (!line) {
      return;
    }

    if (this.cursorPosition < line.content.length) {
      this.cursorPosition++;
      this.emit("stateChanged");
    }
  }

  // Move cursor to beginning of line (Cmd+Left)
  handleMoveToLineStart() {
    this.cursorPosition = 0;
    this.emit("stateChanged");
  }

  // Move cursor to end of line (Cmd+Right)
  handleMoveToLineEnd() {
    const lines = this.engine.getLines();
    const line = lines[this.currentLineIndex];
    if (!line) {
      return;
    }
    this.cursorPosition = line.content.length;
    this.emit("stateChanged");
  }

  // Helper to check if a character is a word boundary
  private isWordBoundary(char: string | undefined): boolean {
    return char !== undefined && WORD_BOUNDARY_REGEX.test(char);
  }

  // Helper to check if a character is whitespace
  private isWhitespace(char: string | undefined): boolean {
    return char !== undefined && WHITESPACE_REGEX.test(char);
  }

  // Move cursor one word left (Option+Left)
  handleMoveWordLeft() {
    const lines = this.engine.getLines();
    const line = lines[this.currentLineIndex];
    if (!line || this.cursorPosition === 0) {
      return;
    }

    const content = line.content;
    let newPos = this.cursorPosition - 1;

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

    this.cursorPosition = newPos;
    this.emit("stateChanged");
  }

  // Move cursor one word right (Option+Right)
  handleMoveWordRight() {
    const lines = this.engine.getLines();
    const line = lines[this.currentLineIndex];
    if (!line || this.cursorPosition >= line.content.length) {
      return;
    }

    const content = line.content;
    let newPos = this.cursorPosition;

    // First, skip any whitespace we're currently in
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

    this.cursorPosition = newPos;
    this.emit("stateChanged");
  }

  // Delete to beginning of line (Cmd+Backspace)
  handleDeleteToLineStart() {
    if (this.cursorPosition === 0) {
      return;
    }

    const lines = this.engine.getLines();
    const line = lines[this.currentLineIndex];
    if (!line) {
      return;
    }

    const newValue = line.content.slice(this.cursorPosition);
    this.engine.updateLine(this.currentLineIndex, newValue);
    this.cursorPosition = 0;
    this.emit("stateChanged");
  }

  // Delete word or whitespace (Option+Backspace)
  handleDeleteWord() {
    const lines = this.engine.getLines();
    const line = lines[this.currentLineIndex];
    if (!line || this.cursorPosition === 0) {
      return;
    }

    const content = line.content;
    let deleteToPos = this.cursorPosition;

    // First, skip any trailing whitespace to the left of cursor
    while (deleteToPos > 0 && this.isWhitespace(content[deleteToPos - 1])) {
      deleteToPos--;
    }

    // If we've only deleted whitespace, we're done
    if (deleteToPos < this.cursorPosition) {
      // Special case: if there's only one whitespace, also delete the word before it
      if (this.cursorPosition - deleteToPos === 1 && deleteToPos > 0) {
        // Delete the word before the whitespace
        if (
          this.isWordBoundary(content[deleteToPos - 1]) &&
          !this.isWhitespace(content[deleteToPos - 1])
        ) {
          // It's a special character, delete just that one
          deleteToPos--;
        } else {
          // It's a regular word, delete the whole word
          while (
            deleteToPos > 0 &&
            !this.isWordBoundary(content[deleteToPos - 1])
          ) {
            deleteToPos--;
          }
        }
      }
    } else if (deleteToPos > 0) {
      // No whitespace was found, delete the word/character to the left
      if (
        this.isWordBoundary(content[deleteToPos - 1]) &&
        !this.isWhitespace(content[deleteToPos - 1])
      ) {
        // It's a special character, delete just that one
        deleteToPos--;
      } else {
        // It's a regular word, delete the whole word
        while (
          deleteToPos > 0 &&
          !this.isWordBoundary(content[deleteToPos - 1])
        ) {
          deleteToPos--;
        }
      }
    }

    const newValue =
      content.slice(0, deleteToPos) + content.slice(this.cursorPosition);
    this.engine.updateLine(this.currentLineIndex, newValue);
    this.cursorPosition = deleteToPos;
    this.emit("stateChanged");
  }

  // Delete to end of line (Ctrl+K)
  handleDeleteToLineEnd() {
    const lines = this.engine.getLines();
    const line = lines[this.currentLineIndex];
    if (!line) {
      return;
    }

    const newValue = line.content.slice(0, this.cursorPosition);
    this.engine.updateLine(this.currentLineIndex, newValue);
    this.emit("stateChanged");
  }

  handleArrowUp() {
    if (this.currentLineIndex > 0) {
      this.currentLineIndex--;
      const lines = this.engine.getLines();
      const newLine = lines[this.currentLineIndex];
      if (newLine) {
        this.cursorPosition = Math.min(
          this.cursorPosition,
          newLine.content.length
        );
      }
      this.emit("stateChanged");
    }
  }

  handleArrowDown() {
    const lines = this.engine.getLines();
    if (this.currentLineIndex < lines.length - 1) {
      this.currentLineIndex++;
      const newLine = lines[this.currentLineIndex];
      if (newLine) {
        this.cursorPosition = Math.min(
          this.cursorPosition,
          newLine.content.length
        );
      }
      this.emit("stateChanged");
    }
  }

  clearAll() {
    this.engine = new CalculatorEngine();
    this.currentLineIndex = 0;
    this.cursorPosition = 0;
    this.emit("stateChanged");
  }

  getCurrentLine() {
    const lines = this.engine.getLines();
    return lines[this.currentLineIndex];
  }

  setCopyHighlight(type: "result" | "full") {
    // Clear existing timer
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
    }

    this.copyHighlight = type;
    this.emit("stateChanged");

    // Set timer to clear highlight after 300ms
    this.highlightTimer = setTimeout(() => {
      this.copyHighlight = null;
      this.highlightTimer = null;
      this.emit("stateChanged");
    }, 300);
  }
}
