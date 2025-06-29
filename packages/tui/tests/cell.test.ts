import { describe, expect, test } from "bun:test";
import {
  cellEquals,
  clearCells,
  emptyCell,
  packCell,
  unpackAttr,
  unpackChar,
} from "../src/cell";
import type { Cell } from "../src/types";

describe("Cell operations", () => {
  test("packCell and unpack operations", () => {
    // Test basic ASCII character
    const cell1 = packCell("A", 0);
    expect(unpackChar(cell1)).toBe("A");
    expect(unpackAttr(cell1)).toBe(0);

    // Test with attributes
    const cell2 = packCell("B", 0xff);
    expect(unpackChar(cell2)).toBe("B");
    expect(unpackAttr(cell2)).toBe(0xff);

    // Test Unicode character
    const cell3 = packCell("🎨", 42);
    expect(unpackChar(cell3)).toBe("🎨");
    expect(unpackAttr(cell3)).toBe(42);

    // Test empty string defaults to space
    const cell4 = packCell("", 0);
    expect(unpackChar(cell4)).toBe(" ");
  });

  test("cellEquals", () => {
    const cell1 = packCell("A", 1);
    const cell2 = packCell("A", 1);
    const cell3 = packCell("A", 2);
    const cell4 = packCell("B", 1);

    expect(cellEquals(cell1, cell2)).toBe(true);
    expect(cellEquals(cell1, cell3)).toBe(false);
    expect(cellEquals(cell1, cell4)).toBe(false);
  });

  test("emptyCell", () => {
    const empty = emptyCell();
    expect(unpackChar(empty)).toBe(" ");
    expect(unpackAttr(empty)).toBe(0);
  });

  test("clearCells", () => {
    const buffer: Cell[] = new Array(10);
    const testCell = packCell("X", 5);

    // Fill buffer with test cells
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = testCell;
    }

    // Clear entire buffer
    clearCells(buffer);
    const empty = emptyCell();
    for (const cell of buffer) {
      expect(cell).toEqual(empty);
    }

    // Clear partial buffer
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = testCell;
    }
    clearCells(buffer, 2, 5);

    // Check first 2 are unchanged
    expect(buffer[0]).toEqual(testCell);
    expect(buffer[1]).toEqual(testCell);

    // Check cleared range
    for (let i = 2; i < 5; i++) {
      expect(buffer[i]).toEqual(empty);
    }

    // Check rest are unchanged
    for (let i = 5; i < buffer.length; i++) {
      expect(buffer[i]).toEqual(testCell);
    }
  });

  test("Unicode codepoint limits", () => {
    // Test maximum valid Unicode codepoint (21 bits)
    const maxChar = String.fromCodePoint(0x10_ff_ff); // Maximum valid Unicode
    const cellMax = packCell(maxChar, 255);
    expect(unpackChar(cellMax)).toBe(maxChar);
    expect(unpackAttr(cellMax)).toBe(255);
  });
});
