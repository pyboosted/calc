import type { Attributes, Color } from "./types.ts";

// ANSI escape sequences
export const ESC = "\x1b[";
export const ESC_RESET = "\x1b[0m";
export const ESC_HIDE_CURSOR = "\x1b[?25l";
export const ESC_SHOW_CURSOR = "\x1b[?25h";
export const ESC_CLEAR_SCREEN = "\x1b[2J";
export const ESC_HOME = "\x1b[H";
export const ESC_SAVE_CURSOR = "\x1b[s";
export const ESC_RESTORE_CURSOR = "\x1b[u";
export const ESC_CLEAR_TO_EOL = "\x1b[K";

// Synchronized update sequences
export const ESC_BEGIN_SYNC = "\x1b[?2026h";
export const ESC_END_SYNC = "\x1b[?2026l";

// Attribute bits for lookup table
const ATTR_BOLD = 0x01;
const ATTR_DIM = 0x02;
const ATTR_ITALIC = 0x04;
const ATTR_UNDERLINE = 0x08;
const ATTR_REVERSE = 0x10;
const ATTR_STRIKETHROUGH = 0x20;

/**
 * Pre-computed attribute lookup table
 * Maps attribute byte to ANSI escape sequence
 */
export const ATTR_LUT: string[] = generateAttrLUT();

function generateAttrLUT(): string[] {
  const lut = new Array(256);

  for (let i = 0; i < 256; i++) {
    const parts: string[] = [];

    // Reset first
    parts.push("0");

    // Add attributes based on bits
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    if (i & ATTR_BOLD) {
      parts.push("1");
    }
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    if (i & ATTR_DIM) {
      parts.push("2");
    }
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    if (i & ATTR_ITALIC) {
      parts.push("3");
    }
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    if (i & ATTR_UNDERLINE) {
      parts.push("4");
    }
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    if (i & ATTR_REVERSE) {
      parts.push("7");
    }
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    if (i & ATTR_STRIKETHROUGH) {
      parts.push("9");
    }

    lut[i] = `${ESC}${parts.join(";")}m`;
  }

  return lut;
}

/**
 * Move cursor to specific position (1-based)
 */
export function moveTo(row: number, col: number): string {
  return `${ESC}${row};${col}H`;
}

/**
 * Move cursor up by n lines
 */
export function moveUp(n = 1): string {
  return n > 0 ? `${ESC}${n}A` : "";
}

/**
 * Move cursor down by n lines
 */
export function moveDown(n = 1): string {
  return n > 0 ? `${ESC}${n}B` : "";
}

/**
 * Move cursor right by n columns
 */
export function moveRight(n = 1): string {
  return n > 0 ? `${ESC}${n}C` : "";
}

/**
 * Move cursor left by n columns
 */
export function moveLeft(n = 1): string {
  return n > 0 ? `${ESC}${n}D` : "";
}

/**
 * Clear line from cursor to end
 */
export function clearToEndOfLine(): string {
  return `${ESC}K`;
}

/**
 * Clear entire line
 */
export function clearLine(): string {
  return `${ESC}2K`;
}

// Regex for hex color matching
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;

/**
 * Convert color to ANSI escape sequence
 */
export function colorToAnsi(color: Color, isBg = false): string {
  if (typeof color === "number") {
    // 256-color palette
    return `${ESC}${isBg ? "48" : "38"};5;${color}m`;
  }
  // 24-bit RGB color
  const match = color.match(HEX_COLOR_REGEX);
  if (!match) {
    return "";
  }

  const rgb = Number.parseInt(match[1], 16);
  // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operations for RGB extraction
  const r = (rgb >> 16) & 0xff;
  // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operations for RGB extraction
  const g = (rgb >> 8) & 0xff;
  // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operations for RGB extraction
  const b = rgb & 0xff;

  return `${ESC}${isBg ? "48" : "38"};2;${r};${g};${b}m`;
}

/**
 * Convert attributes to attribute byte for lookup table
 */
export function attributesToByte(attrs: Attributes): number {
  let byte = 0;

  if (attrs.bold) {
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    byte |= ATTR_BOLD;
  }
  if (attrs.dim) {
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    byte |= ATTR_DIM;
  }
  if (attrs.italic) {
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    byte |= ATTR_ITALIC;
  }
  if (attrs.underline) {
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    byte |= ATTR_UNDERLINE;
  }
  if (attrs.reverse) {
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    byte |= ATTR_REVERSE;
  }
  if (attrs.strikethrough) {
    // biome-ignore lint/nursery/noBitwiseOperators: Intentional bitwise operation for attribute flags
    byte |= ATTR_STRIKETHROUGH;
  }

  return byte;
}

/**
 * Build complete ANSI sequence for attributes including colors
 */
export function buildAnsiSequence(attrs: Attributes): string {
  const parts: string[] = [];

  // Get base attributes from lookup table
  const attrByte = attributesToByte(attrs);
  if (attrByte > 0) {
    // Extract just the attribute codes without ESC and 'm'
    const baseAttrs = ATTR_LUT[attrByte]?.slice(2, -1);
    parts.push(baseAttrs);
  } else {
    parts.push("0"); // Reset
  }

  // Add colors
  if (attrs.fg) {
    const fgSeq = colorToAnsi(attrs.fg, false);
    if (fgSeq) {
      // Extract color code without ESC and 'm'
      parts.push(fgSeq.slice(2, -1));
    }
  }

  if (attrs.bg) {
    const bgSeq = colorToAnsi(attrs.bg, true);
    if (bgSeq) {
      // Extract color code without ESC and 'm'
      parts.push(bgSeq.slice(2, -1));
    }
  }

  return parts.length > 0 ? `${ESC}${parts.join(";")}m` : "";
}
