import { evaluate } from "../evaluator/evaluate";
import type { CalculatedValue } from "../types";

interface LineState {
  id: string;
  content: string;
  result: CalculatedValue | null;
  error: string | null;
  isComment: boolean;
  assignedVariables?: Map<string, CalculatedValue>;
}

export class CalculatorEngine {
  private lines: LineState[] = [];
  private variables = new Map<string, CalculatedValue>();
  private nextId = 1;
  private debugMode: boolean;

  private generateId(): string {
    return `line-${this.nextId++}`;
  }

  constructor(initialContent?: string, debugMode = false) {
    this.debugMode = debugMode;
    if (initialContent) {
      const contentLines = initialContent.split("\n");
      this.lines = contentLines.map((content) => ({
        id: this.generateId(),
        content,
        result: null,
        error: null,
        isComment: false,
      }));
      this.evaluateAllLines();
    } else {
      this.lines = [
        {
          id: this.generateId(),
          content: "",
          result: null,
          error: null,
          isComment: false,
        },
      ];
    }
  }

  getLines(): LineState[] {
    return this.lines;
  }

  getVariables(): Map<string, CalculatedValue> {
    return new Map(this.variables);
  }

  updateLine(index: number, content: string): void {
    if (index < 0 || index >= this.lines.length) {
      return;
    }

    const line = this.lines[index];
    if (!line) {
      return;
    }

    const oldContent = line.content;
    if (oldContent === content) {
      return; // No change
    }

    line.content = content;

    // Re-evaluate from this line onwards since variables might have changed
    this.evaluateFromLine(index);
  }

  insertLine(index: number): void {
    const newLine: LineState = {
      id: this.generateId(),
      content: "",
      result: null,
      error: null,
      isComment: false,
    };

    if (index < 0) {
      this.lines.unshift(newLine);
    } else if (index >= this.lines.length) {
      this.lines.push(newLine);
    } else {
      this.lines.splice(index, 0, newLine);
    }

    // Re-evaluate from this line onwards
    this.evaluateFromLine(Math.max(0, index));
  }

  deleteLine(index: number): void {
    if (index < 0 || index >= this.lines.length) {
      return;
    }
    if (this.lines.length <= 1) {
      // Don't delete the last line, just clear it
      const existingId = this.lines[0]?.id || this.generateId();
      this.lines[0] = {
        id: existingId,
        content: "",
        result: null,
        error: null,
        isComment: false,
      };
      return;
    }

    this.lines.splice(index, 1);

    // Re-evaluate from this line onwards
    this.evaluateFromLine(Math.max(0, index));
  }

  private evaluateFromLine(startIndex: number): void {
    // Build up variables from lines before startIndex
    const cumulativeVariables = new Map<string, CalculatedValue>();

    for (let i = 0; i < startIndex; i++) {
      const line = this.lines[i];
      if (!line) {
        continue;
      }

      // Use stored assigned variables if available
      if (line.assignedVariables) {
        line.assignedVariables.forEach((value, key) => {
          cumulativeVariables.set(key, value);
        });
      }
    }

    // Now evaluate from startIndex onwards
    for (let i = startIndex; i < this.lines.length; i++) {
      this.evaluateLine(i, cumulativeVariables);
    }

    // Update global variables
    this.variables = cumulativeVariables;
  }

  private evaluateAllLines(): void {
    const cumulativeVariables = new Map<string, CalculatedValue>();

    for (let i = 0; i < this.lines.length; i++) {
      this.evaluateLine(i, cumulativeVariables);
    }

    // Update global variables
    this.variables = cumulativeVariables;
  }

  private evaluateLine(
    index: number,
    cumulativeVariables: Map<string, CalculatedValue>
  ): void {
    const line = this.lines[index];
    if (!line) {
      return;
    }

    const trimmed = line.content.trim();

    // Handle empty lines
    if (!trimmed) {
      line.result = null;
      line.error = null;
      line.isComment = false;
      return;
    }

    // Handle pure comments
    if (trimmed.startsWith("#")) {
      line.result = null;
      line.error = null;
      line.isComment = true;
      return;
    }

    // Find previous result for 'prev' variable
    let prevValue: CalculatedValue | undefined;
    for (let i = index - 1; i >= 0; i--) {
      const prevLine = this.lines[i];
      if (!prevLine) {
        continue;
      }
      if (prevLine.result && !prevLine.isComment) {
        prevValue = prevLine.result;
        break;
      }
    }

    // Create variables for this line
    const lineVariables = new Map(cumulativeVariables);
    if (prevValue) {
      lineVariables.set("prev", prevValue);
    }

    try {
      // Collect previous results for aggregate operations
      const previousResults: CalculatedValue[] = [];
      for (let i = index - 1; i >= 0; i--) {
        const prevLine = this.lines[i];
        if (!prevLine) {
          break;
        }
        if (!prevLine.result || prevLine.isComment) {
          break;
        }
        previousResults.unshift(prevLine.result);
      }

      const result = evaluate(line.content, lineVariables, {
        previousResults,
        debugMode: this.debugMode,
      });
      line.result = result;
      line.error = null;
      line.isComment = false;

      // Track variables assigned in this line
      const assignedInThisLine = new Map<string, CalculatedValue>();

      // Copy back any new variables
      lineVariables.forEach((value, key) => {
        if (key !== "prev" && !cumulativeVariables.has(key)) {
          cumulativeVariables.set(key, value);
          assignedInThisLine.set(key, value);
        }
      });

      // Store assigned variables with the line
      if (assignedInThisLine.size > 0) {
        line.assignedVariables = assignedInThisLine;
      }
    } catch (error) {
      // In debug mode, store the error instead of treating as comment
      if (this.debugMode) {
        line.result = null;
        line.error = (error as Error).message;
        line.isComment = false;
      } else {
        // Mark as comment on error in normal mode
        line.result = null;
        line.error = null;
        line.isComment = true;
      }
    }
  }
}
