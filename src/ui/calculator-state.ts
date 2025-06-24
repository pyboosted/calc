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

  constructor(initialContent?: string, debugMode = false) {
    super();
    this.engine = new CalculatorEngine(initialContent, debugMode);
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
    } else if (this.currentLineIndex > 0) {
      // At beginning of line, move to end of previous line
      this.currentLineIndex--;
      const lines = this.engine.getLines();
      const prevLine = lines[this.currentLineIndex];
      if (prevLine) {
        this.cursorPosition = prevLine.content.length;
      }
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
    } else if (this.currentLineIndex < lines.length - 1) {
      // At end of line, move to beginning of next line
      this.currentLineIndex++;
      this.cursorPosition = 0;
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

    if (!line) {
      return;
    }

    // If at beginning of line
    if (this.cursorPosition === 0) {
      if (this.currentLineIndex > 0) {
        // Move to previous line
        this.currentLineIndex--;
        const prevLine = lines[this.currentLineIndex];
        if (prevLine) {
          // Move to the last word of previous line
          const content = prevLine.content;
          let newPos = content.length;

          // Skip trailing whitespace
          while (newPos > 0 && this.isWhitespace(content[newPos - 1])) {
            newPos--;
          }

          // Find beginning of last word
          while (newPos > 0 && !this.isWordBoundary(content[newPos - 1])) {
            newPos--;
          }

          this.cursorPosition = newPos;
        }
        this.emit("stateChanged");
      }
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

  // Helper to find position after next word in content
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

  // Move cursor one word right (Option+Right)
  handleMoveWordRight() {
    const lines = this.engine.getLines();
    const line = lines[this.currentLineIndex];

    if (!line) {
      return;
    }

    // If at end of line
    if (this.cursorPosition >= line.content.length) {
      if (this.currentLineIndex < lines.length - 1) {
        // Move to next line
        this.currentLineIndex++;
        const nextLine = lines[this.currentLineIndex];
        if (nextLine) {
          this.cursorPosition = this.findNextWordPosition(nextLine.content, 0);
        }
        this.emit("stateChanged");
      }
      return;
    }

    this.cursorPosition = this.findNextWordPosition(
      line.content,
      this.cursorPosition
    );
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

  // Helper to find position to delete last word from end of content
  private findLastWordDeletePos(content: string): number {
    let deleteFromPos = content.length;

    // Skip trailing whitespace
    while (deleteFromPos > 0 && this.isWhitespace(content[deleteFromPos - 1])) {
      deleteFromPos--;
    }

    // Delete the last word
    if (deleteFromPos > 0) {
      if (
        this.isWordBoundary(content[deleteFromPos - 1]) &&
        !this.isWhitespace(content[deleteFromPos - 1])
      ) {
        // It's a special character, delete just that one
        deleteFromPos--;
      } else {
        // It's a regular word, delete the whole word
        while (
          deleteFromPos > 0 &&
          !this.isWordBoundary(content[deleteFromPos - 1])
        ) {
          deleteFromPos--;
        }
      }
    }

    return deleteFromPos;
  }

  // Helper to delete last word from previous line
  private deleteWordFromPrevLine() {
    const lines = this.engine.getLines();
    if (this.currentLineIndex > 0) {
      const prevLine = lines[this.currentLineIndex - 1];
      const currentLine = lines[this.currentLineIndex];
      if (prevLine && currentLine) {
        const deleteFromPos = this.findLastWordDeletePos(prevLine.content);
        const newPrevContent = prevLine.content.slice(0, deleteFromPos);

        // Check if current line is empty (no content after cursor)
        const remainingContent = currentLine.content.slice(this.cursorPosition);

        if (remainingContent.trim() === "") {
          // Current line is empty, delete it and move to previous line
          this.engine.updateLine(this.currentLineIndex - 1, newPrevContent);
          this.engine.deleteLine(this.currentLineIndex);
          this.currentLineIndex--;
          this.cursorPosition = deleteFromPos;
        } else {
          // Current line has content, merge it with previous line
          const mergedContent = newPrevContent + remainingContent;
          this.engine.updateLine(this.currentLineIndex - 1, mergedContent);
          this.engine.deleteLine(this.currentLineIndex);
          this.currentLineIndex--;
          this.cursorPosition = deleteFromPos;
        }

        this.emit("stateChanged");
      }
    }
  }

  // Helper to find position to delete word from current position
  private findWordDeletePos(content: string, fromPos: number): number {
    let deleteToPos = fromPos;

    // First, skip any trailing whitespace to the left of cursor
    while (deleteToPos > 0 && this.isWhitespace(content[deleteToPos - 1])) {
      deleteToPos--;
    }

    // If we've only deleted whitespace, check special case
    if (deleteToPos < fromPos) {
      // Special case: if there's only one whitespace, also delete the word before it
      if (fromPos - deleteToPos === 1 && deleteToPos > 0) {
        deleteToPos = this.deleteWordAtPosition(content, deleteToPos);
      }
    } else if (deleteToPos > 0) {
      // No whitespace was found, delete the word/character to the left
      deleteToPos = this.deleteWordAtPosition(content, deleteToPos);
    }

    return deleteToPos;
  }

  // Helper to delete word at specific position
  private deleteWordAtPosition(content: string, pos: number): number {
    if (
      this.isWordBoundary(content[pos - 1]) &&
      !this.isWhitespace(content[pos - 1])
    ) {
      // It's a special character, delete just that one
      return pos - 1;
    }
    // It's a regular word, delete the whole word
    let newPos = pos;
    while (newPos > 0 && !this.isWordBoundary(content[newPos - 1])) {
      newPos--;
    }
    return newPos;
  }

  // Delete word or whitespace (Option+Backspace)
  handleDeleteWord() {
    const lines = this.engine.getLines();
    const line = lines[this.currentLineIndex];

    if (!line) {
      return;
    }

    // If at beginning of line, delete last word from previous line
    if (this.cursorPosition === 0) {
      this.deleteWordFromPrevLine();
      return;
    }

    // Delete word from current line
    const deleteToPos = this.findWordDeletePos(
      line.content,
      this.cursorPosition
    );
    const newValue =
      line.content.slice(0, deleteToPos) +
      line.content.slice(this.cursorPosition);
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
