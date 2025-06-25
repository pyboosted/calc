import { CSI_ARROW_SEQUENCES, isIncompleteCSISequence } from "./csi-sequences";
import { ESCAPE_SEQUENCES } from "./hotkey-types";

/**
 * Our own key event type that provides full control over keyboard input
 */
export interface KeyEvent {
  // The key that was pressed (single character or special key name)
  key: string;

  // The raw input string (may be empty for special keys)
  input: string;

  // The full escape sequence
  sequence: string;

  // Modifier flags
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
  shift: boolean;
}

// Raw keypress data from readline
export interface RawKeypressData {
  sequence: string;
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  code?: string;
}

/**
 * Extract key name from Ctrl sequence
 */
function getCtrlKeyName(sequence: string): string | null {
  if (sequence.length !== 1) {
    return null;
  }
  const code = sequence.charCodeAt(0);
  if (code >= 1 && code <= 26) {
    return String.fromCharCode(code + 96); // Convert to letter
  }
  return null;
}

/**
 * Determine modifiers based on sequence
 */
function getSequenceModifiers(
  sequence: string
): Partial<{ ctrl: boolean; alt: boolean }> {
  const modifiers: Partial<{ ctrl: boolean; alt: boolean }> = {};

  // Alt+Arrow sequences
  if (sequence === "\x1bb" || sequence === "\x1bf") {
    modifiers.alt = true;
  }

  // Ctrl combinations
  // Note: \r (13) is Enter/Return, not Ctrl+M, so we exclude it
  if (sequence.length === 1) {
    const code = sequence.charCodeAt(0);
    if (code >= 1 && code <= 26 && code !== 13) {
      modifiers.ctrl = true;
    }
  }

  return modifiers;
}

/**
 * Parse raw keypress data into our KeyEvent format
 */
export function parseKeyEvent(
  str: string | undefined,
  key: RawKeypressData | undefined
): KeyEvent | null {
  const input = str || "";
  const sequence = key?.sequence || input;

  // Check if this is an incomplete CSI sequence
  if (isIncompleteCSISequence(sequence)) {
    if (process.env.DEBUG) {
      console.log("[KEYEVENT] Buffering incomplete CSI sequence:", sequence);
    }
    return null;
  }

  // Start with the key name from readline if available
  let keyName = key?.name || "";

  // Check for CSI sequences with modifiers
  const csiMatch = CSI_ARROW_SEQUENCES[sequence];
  if (csiMatch) {
    if (process.env.DEBUG) {
      console.log(
        "[KEYEVENT] Parsed CSI sequence:",
        sequence,
        "->",
        csiMatch.key,
        csiMatch.modifiers
      );
    }
    return {
      key: csiMatch.key,
      input,
      sequence,
      ctrl: csiMatch.modifiers.ctrl,
      alt: csiMatch.modifiers.alt,
      meta: csiMatch.modifiers.meta,
      shift: csiMatch.modifiers.shift,
    };
  }

  // Check if the sequence maps to a special key
  const specialKey = ESCAPE_SEQUENCES[sequence];
  if (specialKey) {
    keyName = specialKey;

    // Special case: ESC key should not have modifiers
    if (specialKey === "escape" && sequence === "\x1b") {
      return {
        key: keyName,
        input,
        sequence,
        ctrl: false,
        alt: false,
        meta: false,
        shift: false,
      };
    }
  }

  // Handle Alt+Arrow sequences that include modifier in sequence
  if (sequence === "\x1bb") {
    keyName = "left";
  } else if (sequence === "\x1bf") {
    keyName = "right";
  }

  // If we still don't have a key name, check for Ctrl combinations
  if (!keyName) {
    const ctrlKey = getCtrlKeyName(sequence);
    if (ctrlKey) {
      keyName = ctrlKey;
    }
  }

  // If we still don't have a key name, use the input
  if (!keyName && input) {
    keyName = input;
  }

  // Determine modifiers
  const sequenceModifiers = getSequenceModifiers(sequence);
  const ctrl = sequenceModifiers.ctrl ?? key?.ctrl ?? false;
  const alt = sequenceModifiers.alt ?? key?.meta ?? false;
  const meta = key?.meta ?? false;
  const shift = key?.shift ?? false;

  return {
    key: keyName,
    input,
    sequence,
    ctrl,
    alt,
    meta,
    shift,
  };
}

/**
 * Convert a KeyEvent to a debug string
 */
export function keyEventToString(event: KeyEvent): string {
  const parts: string[] = [];

  if (event.ctrl) {
    parts.push("Ctrl");
  }
  if (event.alt) {
    parts.push("Alt");
  }
  if (event.shift) {
    parts.push("Shift");
  }
  if (event.meta && !event.alt) {
    parts.push("Meta");
  }

  if (event.key) {
    parts.push(event.key);
  }

  return parts.join("+") || "Unknown";
}
