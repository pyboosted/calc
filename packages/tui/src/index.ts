// Main exports for @boosted/tui

// ANSI utilities
export {
  ATTR_LUT,
  attributesToByte,
  buildAnsiSequence,
  clearLine,
  clearToEndOfLine,
  colorToAnsi,
  ESC,
  ESC_BEGIN_SYNC,
  ESC_CLEAR_SCREEN,
  ESC_CLEAR_TO_EOL,
  ESC_END_SYNC,
  ESC_HIDE_CURSOR,
  ESC_HOME,
  ESC_RESET,
  ESC_RESTORE_CURSOR,
  ESC_SAVE_CURSOR,
  ESC_SHOW_CURSOR,
  moveDown,
  moveLeft,
  moveRight,
  moveTo,
  moveUp,
} from "./ansi.ts";

// Buffer utilities
export { OutputBuffer } from "./buffer.ts";

// Cell utilities
export {
  cellEquals,
  clearCells,
  emptyCell,
  packCell,
  unpackAttr,
  unpackBgColor,
  unpackChar,
  unpackFgColor,
} from "./cell.ts";

// Diff engine
export { DiffEngine } from "./diff.ts";

// Core terminal class
export { Terminal } from "./terminal.ts";

// Types
export type {
  Attributes,
  Cell,
  Color,
  Dimensions,
  EventEmitter,
  ResizeEvent,
  TerminalOptions,
} from "./types.ts";
