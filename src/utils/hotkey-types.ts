import type { SpecialKey } from "./key-types";

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
 * All possible keys (single characters or special keys)
 */
export type KeyName =
  | Lowercase<string>
  | Uppercase<string>
  | SpecialKey
  | "Up"
  | "up"
  | "UP"
  | "Down"
  | "down"
  | "DOWN"
  | "Left"
  | "left"
  | "LEFT"
  | "Right"
  | "right"
  | "RIGHT"
  | "PageUp"
  | "pageup"
  | "PAGEUP"
  | "PageDown"
  | "pagedown"
  | "PAGEDOWN"
  | "Home"
  | "home"
  | "HOME"
  | "End"
  | "end"
  | "END"
  | "Insert"
  | "insert"
  | "INSERT"
  | "Delete"
  | "delete"
  | "DELETE"
  | "Backspace"
  | "backspace"
  | "BACKSPACE"
  | "Tab"
  | "tab"
  | "TAB"
  | "Return"
  | "return"
  | "RETURN"
  | "Enter"
  | "enter"
  | "ENTER"
  | "Escape"
  | "escape"
  | "ESCAPE"
  | "Esc"
  | "esc"
  | "ESC"
  | "Space"
  | "space"
  | "SPACE"
  | "F1"
  | "f1"
  | "F2"
  | "f2"
  | "F3"
  | "f3"
  | "F4"
  | "f4"
  | "F5"
  | "f5"
  | "F6"
  | "f6"
  | "F7"
  | "f7"
  | "F8"
  | "f8"
  | "F9"
  | "f9"
  | "F10"
  | "f10"
  | "F11"
  | "f11"
  | "F12"
  | "f12";

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
