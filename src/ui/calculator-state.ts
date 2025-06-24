import { EventEmitter } from "node:events";
import { CalculatorEngine } from "./calculator-engine";

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

  setContent(content: string) {
    this.engine = new CalculatorEngine(content);
    this.currentLineIndex = 0;
    this.cursorPosition = 0;
    this.emit("stateChanged");
  }

  getContent(): string {
    const lines = this.engine.getLines();
    return lines.map((l) => l.content).join("\n");
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
