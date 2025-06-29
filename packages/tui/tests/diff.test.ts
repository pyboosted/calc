import { describe, expect, test } from "bun:test";
import { attributesToByte } from "../src/ansi";
import { emptyCell, packCell, unpackChar } from "../src/cell";
import { DiffEngine } from "../src/diff";

describe("DiffEngine", () => {
  test("initialization", () => {
    const diff = new DiffEngine(10, 20);

    // Check all cells are initially empty
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 20; col++) {
        const cell = diff.getCell(row, col);
        expect(unpackChar(cell)).toBe(" ");
      }
    }
  });

  test("setCell and getCell", () => {
    const diff = new DiffEngine(10, 10);

    // Set a cell
    const testCell = packCell("A", 5);
    diff.setCell(2, 3, testCell);

    // Get it back
    expect(diff.getCell(2, 3)).toBe(testCell);

    // Check row is marked dirty
    expect(diff.isDirty(2)).toBe(true);
    // Other rows should not be dirty
    expect(diff.isDirty(1)).toBe(false);
    expect(diff.isDirty(3)).toBe(false);

    // Out of bounds should return empty cell
    expect(diff.getCell(-1, 0)).toEqual(emptyCell());
    expect(diff.getCell(0, -1)).toEqual(emptyCell());
    expect(diff.getCell(10, 0)).toEqual(emptyCell());
    expect(diff.getCell(0, 10)).toEqual(emptyCell());
  });

  test("markDirty and isDirty", () => {
    const diff = new DiffEngine(5, 5);

    // Initially all clean
    for (let i = 0; i < 5; i++) {
      expect(diff.isDirty(i)).toBe(false);
    }

    // Mark specific rows
    diff.markDirty(1);
    diff.markDirty(3);

    expect(diff.isDirty(0)).toBe(false);
    expect(diff.isDirty(1)).toBe(true);
    expect(diff.isDirty(2)).toBe(false);
    expect(diff.isDirty(3)).toBe(true);
    expect(diff.isDirty(4)).toBe(false);

    // Out of bounds should be safe
    diff.markDirty(-1);
    diff.markDirty(10);
  });

  test("markAllDirty", () => {
    const diff = new DiffEngine(5, 5);

    diff.markAllDirty();

    for (let i = 0; i < 5; i++) {
      expect(diff.isDirty(i)).toBe(true);
    }
  });

  test("clear", () => {
    const diff = new DiffEngine(5, 5);

    // Set some cells
    diff.setCell(1, 1, packCell("X", 0));
    diff.setCell(2, 2, packCell("Y", 0));
    diff.setCell(3, 3, packCell("Z", 0));

    // Clear
    diff.clear();

    // Check all cells are empty
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        expect(diff.getCell(row, col)).toEqual(emptyCell());
      }
      // And all rows should be dirty
      expect(diff.isDirty(row)).toBe(true);
    }
  });

  test("computeDiff basic", () => {
    const diff = new DiffEngine(3, 3);

    // Set some cells
    diff.setCell(0, 0, packCell("A", 0));
    diff.setCell(1, 1, packCell("B", 1)); // bold
    diff.setCell(2, 2, packCell("C", 0));

    // Compute diff
    const output = diff.computeDiff();

    // Should contain the characters
    expect(output).toContain("A"); // Character A
    expect(output).toContain("B"); // Character B with bold
    expect(output).toContain("C"); // Character C
    // Check move commands exist
    expect(output).toContain("\x1b["); // Some move commands

    // After diff, no rows should be dirty
    for (let i = 0; i < 3; i++) {
      expect(diff.isDirty(i)).toBe(false);
    }

    // Second diff should return empty (no changes)
    const output2 = diff.computeDiff();
    expect(output2).toBe("");
  });

  test("resize", () => {
    const diff = new DiffEngine(3, 3);

    // Set some content
    diff.setCell(1, 1, packCell("X", 0));
    diff.setCell(2, 2, packCell("Y", 0));

    // Resize larger
    diff.resize(5, 5);

    // After resize, content is cleared (new behavior for clean resize)
    expect(unpackChar(diff.getCell(1, 1))).toBe(" ");
    expect(unpackChar(diff.getCell(2, 2))).toBe(" ");

    // New areas should be empty
    expect(diff.getCell(4, 4)).toEqual(emptyCell());

    // All rows should be dirty after resize
    for (let i = 0; i < 5; i++) {
      expect(diff.isDirty(i)).toBe(true);
    }

    // Resize smaller
    diff.resize(2, 2);

    // Content should still be empty after resize
    expect(unpackChar(diff.getCell(1, 1))).toBe(" ");

    // Out of bounds returns empty
    expect(diff.getCell(2, 2)).toEqual(emptyCell());
  });

  test("only changed cells are included in diff", () => {
    const diff = new DiffEngine(3, 5);

    // Set initial state with different attributes to prevent batching
    diff.setCell(0, 0, packCell("A", 0));
    diff.setCell(0, 1, packCell("B", attributesToByte({ bold: true })));
    diff.setCell(0, 2, packCell("C", 0));

    // Compute initial diff to establish baseline
    diff.computeDiff();

    // Change only one cell (keep same bold attribute)
    diff.setCell(0, 1, packCell("X", attributesToByte({ bold: true })));

    // Diff should only include the changed cell
    const output = diff.computeDiff();
    expect(output).toContain("X");
    expect(output).not.toContain("A");
    expect(output).not.toContain("C");
  });
});
