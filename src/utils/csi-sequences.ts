/**
 * CSI (Control Sequence Introducer) sequences for modified keys
 * Format: \x1b[1;{modifier}{key}
 */

// Top-level regex constants for performance
const DIGIT_REGEX = /\d/;
const CSI_END_REGEX = /[A-Za-z~]/;

export interface CSIModifiers {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
}

/**
 * Parse CSI modifier code to individual modifier flags
 * Modifier codes:
 * 2 = Shift
 * 3 = Alt
 * 4 = Shift+Alt
 * 5 = Ctrl
 * 6 = Shift+Ctrl
 * 7 = Alt+Ctrl (or Ctrl+Alt)
 * 8 = Shift+Alt+Ctrl
 * 9 = Meta
 * 10 = Shift+Meta
 * 11 = Alt+Meta
 * 12 = Shift+Alt+Meta
 * 13 = Ctrl+Meta
 * 14 = Shift+Ctrl+Meta
 * 15 = Alt+Ctrl+Meta
 * 16 = Shift+Alt+Ctrl+Meta
 */

export function parseCSIModifier(code: number): CSIModifiers {
  // Subtract 1 because modifier codes start at 2 for just Shift
  const modifierBits = code - 1;

  return {
    // biome-ignore lint/nursery/noBitwiseOperators: Bitwise operations are required for CSI modifier parsing
    shift: (modifierBits & 1) !== 0,
    // biome-ignore lint/nursery/noBitwiseOperators: Bitwise operations are required for CSI modifier parsing
    alt: (modifierBits & 2) !== 0,
    // biome-ignore lint/nursery/noBitwiseOperators: Bitwise operations are required for CSI modifier parsing
    ctrl: (modifierBits & 4) !== 0,
    // biome-ignore lint/nursery/noBitwiseOperators: Bitwise operations are required for CSI modifier parsing
    meta: (modifierBits & 8) !== 0,
  };
}

/**
 * CSI sequences for arrow keys with modifiers
 * Format: \x1b[1;{modifier}A/B/C/D
 */
export const CSI_ARROW_SEQUENCES: Record<
  string,
  { key: string; modifiers: CSIModifiers }
> = {};

// Generate all combinations
for (let modifier = 2; modifier <= 16; modifier++) {
  const modifiers = parseCSIModifier(modifier);

  // Up arrow
  CSI_ARROW_SEQUENCES[`\x1b[1;${modifier}A`] = { key: "up", modifiers };
  // Down arrow
  CSI_ARROW_SEQUENCES[`\x1b[1;${modifier}B`] = { key: "down", modifiers };
  // Right arrow
  CSI_ARROW_SEQUENCES[`\x1b[1;${modifier}C`] = { key: "right", modifiers };
  // Left arrow
  CSI_ARROW_SEQUENCES[`\x1b[1;${modifier}D`] = { key: "left", modifiers };
}

/**
 * Check if a sequence is an incomplete CSI sequence
 * This helps handle cases where terminal input is split
 */
export function isIncompleteCSISequence(sequence: string): boolean {
  // A lone ESC is NOT an incomplete sequence - it's the ESC key
  if (sequence === "\x1b") {
    return false;
  }

  // Check if it starts with ESC[ and contains semicolon but no final character
  if (sequence.startsWith("\x1b[") && sequence.includes(";")) {
    // Check if it ends with a digit (incomplete) rather than a letter
    const lastChar = sequence.at(-1);
    return DIGIT_REGEX.test(lastChar || "");
  }

  // Also check for incomplete CSI sequences that don't have semicolons yet
  // e.g., "\x1b[" or "\x1b[1"
  if (sequence.startsWith("\x1b[") && sequence.length >= 2) {
    const lastChar = sequence.at(-1);
    // If it doesn't end with a letter, it's incomplete
    return !CSI_END_REGEX.test(lastChar || "");
  }

  return false;
}
