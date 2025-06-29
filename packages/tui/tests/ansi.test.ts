import { describe, expect, test } from "bun:test";
import {
  ATTR_LUT,
  attributesToByte,
  buildAnsiSequence,
  colorToAnsi,
  moveDown,
  moveLeft,
  moveRight,
  moveTo,
  moveUp,
} from "../src/ansi";

describe("ANSI utilities", () => {
  test("ATTR_LUT generation", () => {
    // Check array size
    expect(ATTR_LUT.length).toBe(256);

    // Check reset (0)
    expect(ATTR_LUT[0]).toBe("\x1b[0m");

    // Check bold (bit 0)
    expect(ATTR_LUT[1]).toBe("\x1b[0;1m");

    // Check dim (bit 1)
    expect(ATTR_LUT[2]).toBe("\x1b[0;2m");

    // Check bold + italic (bits 0 + 2)
    expect(ATTR_LUT[5]).toBe("\x1b[0;1;3m");
  });

  test("cursor movement", () => {
    expect(moveTo(1, 1)).toBe("\x1b[1;1H");
    expect(moveTo(10, 20)).toBe("\x1b[10;20H");

    expect(moveUp()).toBe("\x1b[1A");
    expect(moveUp(5)).toBe("\x1b[5A");
    expect(moveUp(0)).toBe("");

    expect(moveDown()).toBe("\x1b[1B");
    expect(moveDown(3)).toBe("\x1b[3B");

    expect(moveRight()).toBe("\x1b[1C");
    expect(moveRight(10)).toBe("\x1b[10C");

    expect(moveLeft()).toBe("\x1b[1D");
    expect(moveLeft(7)).toBe("\x1b[7D");
  });

  test("colorToAnsi - 256 colors", () => {
    expect(colorToAnsi(0)).toBe("\x1b[38;5;0m");
    expect(colorToAnsi(15)).toBe("\x1b[38;5;15m");
    expect(colorToAnsi(255)).toBe("\x1b[38;5;255m");

    // Background colors
    expect(colorToAnsi(42, true)).toBe("\x1b[48;5;42m");
  });

  test("colorToAnsi - 24-bit colors", () => {
    expect(colorToAnsi("#000000")).toBe("\x1b[38;2;0;0;0m");
    expect(colorToAnsi("#ffffff")).toBe("\x1b[38;2;255;255;255m");
    expect(colorToAnsi("#ff0080")).toBe("\x1b[38;2;255;0;128m");

    // Background colors
    expect(colorToAnsi("#00ff00", true)).toBe("\x1b[48;2;0;255;0m");

    // Invalid format
    // @ts-expect-error - testing invalid format
    expect(colorToAnsi("#gg0000")).toBe("");
    // @ts-expect-error - testing invalid format
    expect(colorToAnsi("#fff")).toBe("");
  });

  test("attributesToByte", () => {
    expect(attributesToByte({})).toBe(0);
    expect(attributesToByte({ bold: true })).toBe(0x01);
    expect(attributesToByte({ dim: true })).toBe(0x02);
    expect(attributesToByte({ italic: true })).toBe(0x04);
    expect(attributesToByte({ underline: true })).toBe(0x08);
    expect(attributesToByte({ reverse: true })).toBe(0x10);
    expect(attributesToByte({ strikethrough: true })).toBe(0x20);

    // Multiple attributes
    expect(attributesToByte({ bold: true, italic: true })).toBe(0x05);
    expect(
      attributesToByte({
        bold: true,
        dim: true,
        italic: true,
        underline: true,
      })
    ).toBe(0x0f);
  });

  test("buildAnsiSequence", () => {
    // No attributes
    expect(buildAnsiSequence({})).toBe("\x1b[0m");

    // Just text attributes
    expect(buildAnsiSequence({ bold: true })).toBe("\x1b[0;1m");
    expect(buildAnsiSequence({ bold: true, italic: true })).toBe("\x1b[0;1;3m");

    // With foreground color
    expect(buildAnsiSequence({ fg: 42 })).toBe("\x1b[0;38;5;42m");
    expect(buildAnsiSequence({ bold: true, fg: 42 })).toBe("\x1b[0;1;38;5;42m");

    // With background color
    expect(buildAnsiSequence({ bg: "#ff0000" })).toBe("\x1b[0;48;2;255;0;0m");

    // Full combination
    expect(
      buildAnsiSequence({
        bold: true,
        italic: true,
        fg: "#00ff00",
        bg: 4,
      })
    ).toBe("\x1b[0;1;3;38;2;0;255;0;48;5;4m");
  });
});
