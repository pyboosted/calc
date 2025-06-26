import { evaluate } from "../evaluator/evaluate";
import type { CalculatedValue } from "../types";
import { deepCloneCalculatedValue } from "../utils/deep-clone";

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
  private stdinData?: string;
  private cliArg?: string;

  private generateId(): string {
    return `line-${this.nextId++}`;
  }

  constructor(
    initialContent?: string,
    debugMode = false,
    stdinData?: string,
    cliArg?: string
  ) {
    this.debugMode = debugMode;
    this.stdinData = stdinData;
    this.cliArg = cliArg;
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

  // Update multiple lines without triggering recalculation until all are updated
  updateLines(updates: Array<{ index: number; content: string }>): void {
    let minChangedIndex = this.lines.length;

    // Apply all updates first
    for (const { index, content } of updates) {
      if (index < 0 || index >= this.lines.length) {
        continue;
      }

      const line = this.lines[index];
      if (!line) {
        continue;
      }

      const oldContent = line.content;
      if (oldContent !== content) {
        line.content = content;
        minChangedIndex = Math.min(minChangedIndex, index);
      }
    }

    // Recalculate once from the first changed line
    if (minChangedIndex < this.lines.length) {
      this.evaluateFromLine(minChangedIndex);
    }
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
          // Deep clone the value to prevent mutation issues
          cumulativeVariables.set(key, deepCloneCalculatedValue(value));
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
        stdinData: this.stdinData,
        cliArg: this.cliArg,
      });
      line.result = result;
      line.error = null;
      line.isComment = false;

      // Track variables assigned in this line
      const assignedInThisLine = new Map<string, CalculatedValue>();

      // Copy back any new or updated variables
      lineVariables.forEach((value, key) => {
        if (key !== "prev") {
          const oldValue = cumulativeVariables.get(key);
          const hasChanged = !(
            oldValue && this.areValuesEqual(oldValue, value)
          );

          if (hasChanged) {
            cumulativeVariables.set(key, value);
            assignedInThisLine.set(key, value);
          }
        }
      });

      // Store assigned variables with the line
      if (assignedInThisLine.size > 0) {
        line.assignedVariables = assignedInThisLine;
      } else {
        line.assignedVariables = undefined;
      }
    } catch (error) {
      // Both modes now treat invalid expressions as comments for consistent rendering
      line.result = null;
      line.isComment = true;

      // In debug mode, also store the error for display
      if (this.debugMode) {
        line.error = (error as Error).message;
      } else {
        line.error = null;
      }
    }
  }

  private areValuesEqual(a: CalculatedValue, b: CalculatedValue): boolean {
    if (a.type !== b.type) {
      return false;
    }

    switch (a.type) {
      case "number":
        return a.value === b.value && a.unit === (b as typeof a).unit;
      case "string":
        return a.value === (b as typeof a).value;
      case "date":
        return (
          a.value.getTime() === (b as typeof a).value.getTime() &&
          a.timezone === (b as typeof a).timezone
        );
      case "boolean":
        return a.value === (b as typeof a).value;
      case "null":
        return true; // Both are null
      case "array": {
        const bArray = b as typeof a;
        if (a.value.length !== bArray.value.length) {
          return false;
        }
        for (let i = 0; i < a.value.length; i++) {
          const aVal = a.value[i];
          const bVal = bArray.value[i];
          if (!(aVal && bVal && this.areValuesEqual(aVal, bVal))) {
            return false;
          }
        }
        return true;
      }
      case "object": {
        const bObject = b as typeof a;
        if (a.value.size !== bObject.value.size) {
          return false;
        }
        for (const [key, value] of a.value) {
          const bValue = bObject.value.get(key);
          if (!(bValue && this.areValuesEqual(value, bValue))) {
            return false;
          }
        }
        return true;
      }
      default: {
        // Exhaustive check
        const _exhaustiveCheck: never = a;
        return _exhaustiveCheck;
      }
    }
  }
}
