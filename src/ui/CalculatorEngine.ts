import { evaluate } from '../evaluator/evaluate';
import type { CalculatedValue } from '../types';

interface LineState {
  content: string;
  result: CalculatedValue | null;
  error: string | null;
  isComment: boolean;
}

export class CalculatorEngine {
  private lines: LineState[] = [];
  private variables = new Map<string, CalculatedValue>();
  
  constructor(initialContent?: string) {
    if (initialContent) {
      const contentLines = initialContent.split('\n');
      this.lines = contentLines.map(content => ({
        content,
        result: null,
        error: null,
        isComment: false
      }));
      this.evaluateAllLines();
    } else {
      this.lines = [{
        content: '',
        result: null,
        error: null,
        isComment: false
      }];
    }
  }
  
  getLines(): LineState[] {
    return this.lines;
  }
  
  getVariables(): Map<string, CalculatedValue> {
    return new Map(this.variables);
  }
  
  updateLine(index: number, content: string): void {
    if (index < 0 || index >= this.lines.length) return;
    
    const line = this.lines[index];
    if (!line) return;
    
    const oldContent = line.content;
    if (oldContent === content) return; // No change
    
    line.content = content;
    
    // Re-evaluate from this line onwards since variables might have changed
    this.evaluateFromLine(index);
  }
  
  insertLine(index: number): void {
    const newLine: LineState = {
      content: '',
      result: null,
      error: null,
      isComment: false
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
    if (index < 0 || index >= this.lines.length) return;
    if (this.lines.length <= 1) {
      // Don't delete the last line, just clear it
      this.lines[0] = {
        content: '',
        result: null,
        error: null,
        isComment: false
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
      if (!line) continue;
      if (line.result && !line.isComment) {
        // Re-evaluate just to extract variables
        try {
          const lineVariables = new Map(cumulativeVariables);
          evaluate(line.content, lineVariables);
          // Copy back any new variables
          lineVariables.forEach((value, key) => {
            if (key !== 'prev') {
              cumulativeVariables.set(key, value);
            }
          });
        } catch {
          // Ignore errors, we're just extracting variables
        }
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
  
  private evaluateLine(index: number, cumulativeVariables: Map<string, CalculatedValue>): void {
    const line = this.lines[index];
    if (!line) return;
    
    const trimmed = line.content.trim();
    
    // Handle empty lines
    if (!trimmed) {
      line.result = null;
      line.error = null;
      line.isComment = false;
      return;
    }
    
    // Handle pure comments
    if (trimmed.startsWith('#')) {
      line.result = null;
      line.error = null;
      line.isComment = true;
      return;
    }
    
    // Find previous result for 'prev' variable
    let prevValue: CalculatedValue | undefined;
    for (let i = index - 1; i >= 0; i--) {
      const prevLine = this.lines[i];
      if (!prevLine) continue;
      if (prevLine.result && !prevLine.isComment) {
        prevValue = prevLine.result;
        break;
      }
    }
    
    // Create variables for this line
    const lineVariables = new Map(cumulativeVariables);
    if (prevValue) {
      lineVariables.set('prev', prevValue);
    }
    
    try {
      // Collect previous results for aggregate operations
      const previousResults: CalculatedValue[] = [];
      for (let i = index - 1; i >= 0; i--) {
        const prevLine = this.lines[i];
        if (!prevLine) break;
        if (!prevLine.result || prevLine.isComment) {
          break;
        }
        previousResults.unshift(prevLine.result);
      }
      
      const result = evaluate(line.content, lineVariables, { previousResults });
      line.result = result;
      line.error = null;
      line.isComment = false;
      
      // Copy back any new variables
      lineVariables.forEach((value, key) => {
        if (key !== 'prev') {
          cumulativeVariables.set(key, value);
        }
      });
    } catch (error) {
      // Mark as comment on error
      line.result = null;
      line.error = null;
      line.isComment = true;
    }
  }
}