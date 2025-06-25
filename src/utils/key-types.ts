/**
 * Special key names that can be recognized
 */
export type SpecialKey =
  | "up"
  | "down"
  | "left"
  | "right"
  | "pageup"
  | "pagedown"
  | "home"
  | "end"
  | "insert"
  | "delete"
  | "backspace"
  | "tab"
  | "return"
  | "enter"
  | "escape"
  | "space"
  | "f1"
  | "f2"
  | "f3"
  | "f4"
  | "f5"
  | "f6"
  | "f7"
  | "f8"
  | "f9"
  | "f10"
  | "f11"
  | "f12";

/**
 * Map of escape sequences to special key names
 */
export const ESCAPE_SEQUENCES: Record<string, SpecialKey> = {
  // Arrow keys
  "\x1b[A": "up",
  "\x1b[B": "down",
  "\x1b[C": "right",
  "\x1b[D": "left",

  // Function keys
  "\x1b[3~": "delete",
  "\x1b[2~": "insert",
  "\x1b[H": "home",
  "\x1b[1~": "home", // Alternative
  "\x1b[F": "end",
  "\x1b[4~": "end", // Alternative
  "\x1b[5~": "pageup",
  "\x1b[6~": "pagedown",

  // Common control characters
  "\x7f": "backspace", // DEL
  "\x08": "backspace", // BS
  "\r": "return", // CR
  "\n": "return", // LF
  "\t": "tab", // TAB
  "\x1b": "escape", // ESC
  " ": "space",

  // F-keys
  "\x1bOP": "f1",
  "\x1bOQ": "f2",
  "\x1bOR": "f3",
  "\x1bOS": "f4",
  "\x1b[15~": "f5",
  "\x1b[17~": "f6",
  "\x1b[18~": "f7",
  "\x1b[19~": "f8",
  "\x1b[20~": "f9",
  "\x1b[21~": "f10",
  "\x1b[23~": "f11",
  "\x1b[24~": "f12",
};

/**
 * Check if a key name is a special key
 */
export function isSpecialKey(key: string): key is SpecialKey {
  return [
    "up",
    "down",
    "left",
    "right",
    "pageup",
    "pagedown",
    "home",
    "end",
    "insert",
    "delete",
    "backspace",
    "tab",
    "return",
    "enter",
    "escape",
    "space",
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "f6",
    "f7",
    "f8",
    "f9",
    "f10",
    "f11",
    "f12",
  ].includes(key);
}
