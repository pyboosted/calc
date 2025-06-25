/**
 * Special key names that can be recognized, in their canonical lowercase form.
 */
const specialKeys = [
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
] as const;

/**
 * Type for special key names, derived from the `specialKeys` constant.
 */
export type SpecialKey = (typeof specialKeys)[number];

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
 * Check if a key name is a special key.
 */
export function isSpecialKey(key: string): key is SpecialKey {
  return (specialKeys as readonly string[]).includes(key);
}

/**
 * Modifier keys that can be used in hotkey combinations
 */
export type ModifierKey =
  | "Ctrl"
  | "ctrl"
  | "CTRL"
  | "Alt"
  | "alt"
  | "ALT"
  | "Shift"
  | "shift"
  | "SHIFT"
  | "Meta"
  | "meta"
  | "META"
  | "Option"
  | "option"
  | "OPTION"
  | "Cmd"
  | "cmd"
  | "CMD"
  | "Command"
  | "command"
  | "COMMAND";

/**
 * A helper type to generate capitalized versions of special keys,
 * with special handling for "pageup" and "pagedown".
 */
type CapitalizeWithSpecialCases<S extends string> = S extends "pageup"
  ? "PageUp"
  : S extends "pagedown"
    ? "PageDown"
    : Capitalize<S>;

/**
 * All possible keys (single characters or special keys), including case variations.
 * This is used for hotkey pattern autocompletion.
 */
export type KeyName =
  | Lowercase<string>
  | Uppercase<string>
  | SpecialKey // lowercase: "up", "pageup", "f1"
  | CapitalizeWithSpecialCases<SpecialKey> // capitalized: "Up", "PageUp", "F1"
  | Uppercase<SpecialKey> // uppercase: "UP", "PAGEUP", "F1"
  | "Esc"
  | "esc"
  | "ESC"; // Aliases for "escape"

/**
 * We use string type but provide autocomplete through overloads
 * The actual validation happens at runtime
 */
export type HotkeyPatterns = string;

/**
 * Normalize a modifier key to lowercase
 */
export function normalizeModifier(modifier: string): string {
  const lower = modifier.toLowerCase();
  // Normalize aliases
  if (lower === "option" || lower === "opt") {
    return "alt";
  }
  if (lower === "cmd" || lower === "command") {
    return "meta";
  }
  return lower;
}

/**
 * Normalize a key name to lowercase
 */
export function normalizeKey(key: string): string {
  const lower = key.toLowerCase();
  // Normalize aliases
  if (lower === "esc") {
    return "escape";
  }
  if (lower === "enter") {
    return "return";
  }
  if (lower === "del") {
    return "delete";
  }
  return lower;
}
