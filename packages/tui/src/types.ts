// 64-bit packed cell representation (two 32-bit values)
export type Cell = [number, number];

// Terminal dimensions
export interface Dimensions {
  rows: number;
  cols: number;
}

// Color representation - hex string or 256-color palette index
export type Color = `#${string}` | number;

// Style attributes for text rendering
export interface Attributes {
  bold?: boolean;
  italic?: boolean;
  dim?: boolean;
  underline?: boolean;
  reverse?: boolean;
  strikethrough?: boolean;
  fg?: Color;
  bg?: Color;
}

// Terminal options
export interface TerminalOptions {
  highWaterMark?: number; // Output buffer size (default: 64KB)
  syncUpdate?: boolean; // Enable synchronized update mode
}

// Event types
export interface ResizeEvent {
  rows: number;
  cols: number;
}

// Base event emitter interface (minimal)
export interface EventEmitter {
  on(event: string, listener: (...args: unknown[]) => void): this;
  off(event: string, listener: (...args: unknown[]) => void): this;
  emit(event: string, ...args: unknown[]): boolean;
}
