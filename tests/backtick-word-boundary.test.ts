import { describe, expect, test } from "bun:test";
import { TextEditor } from "../src/ui/text-editor";

describe("Backtick and Word Boundaries", () => {
  test("word navigation should handle backticks correctly", () => {
    const editor = new TextEditor({ multiline: false });

    // Check word boundary detection for backticks
    const line = "`hello world`";
    const boundaries: number[] = [];
    for (let i = 0; i <= line.length; i++) {
      // @ts-expect-error - accessing private method for testing
      if (editor.isWordBoundary(line, i)) {
        boundaries.push(i);
      }
    }

    // Expected boundaries: 0, 1, 6, 12, 13
    expect(boundaries).toContain(0); // Start of line
    expect(boundaries).toContain(1); // After opening backtick
    expect(boundaries).toContain(6); // After "hello"
    expect(boundaries).toContain(12); // After "world"
    expect(boundaries).toContain(13); // End of line
  });

  test("should handle cursor constraints at end of line with backticks", () => {
    const editor = new TextEditor({
      multiline: false,
      initialContent: "`test`",
    });

    // Move to end
    editor.moveCursorToLineEnd();
    const endPos = editor.getCursorPosition();
    expect(endPos.char).toBe(6);

    // Try to move past end - should stay at end
    editor.moveCursorRight();
    const stillAtEnd = editor.getCursorPosition();
    expect(stillAtEnd.char).toBe(6);

    // Move left and back right
    editor.moveCursorLeft();
    expect(editor.getCursorPosition().char).toBe(5);
    editor.moveCursorRight();
    expect(editor.getCursorPosition().char).toBe(6);
  });

  test("should handle spaces correctly inside backtick strings", () => {
    const editor = new TextEditor({ multiline: false });

    // Simulate typing `hello world`
    const chars = Array.from("`hello world`");
    for (const char of chars) {
      editor.insertChar(char);
    }

    expect(editor.getContent()).toBe("`hello world`");
    expect(editor.getCursorPosition().char).toBe(13);
  });

  test("should handle multi-line backtick strings", () => {
    const editor = new TextEditor({ multiline: true });

    // Type backtick on first line
    editor.insertChar("`");
    editor.insertChar("h");
    editor.insertChar("e");
    editor.insertChar("l");
    editor.insertChar("l");
    editor.insertChar("o");

    // Insert newline
    editor.insertNewLine();

    // Type on second line
    editor.insertChar("w");
    editor.insertChar("o");
    editor.insertChar("r");
    editor.insertChar("l");
    editor.insertChar("d");
    editor.insertChar("`");

    expect(editor.getContent()).toBe("`hello\nworld`");
  });

  test("word boundary regex should treat backtick as boundary", () => {
    const editor = new TextEditor({ multiline: false });

    // Test the word boundary function directly
    const testCases = [
      { text: "`test`", pos: 0, expected: true }, // Start is boundary
      { text: "`test`", pos: 1, expected: true }, // After backtick
      { text: "`test`", pos: 5, expected: true }, // Before backtick
      { text: "`test`", pos: 6, expected: true }, // End is boundary
      { text: "hello world", pos: 5, expected: true }, // Space
      { text: "hello world", pos: 6, expected: true }, // After space
    ];

    for (const { text, pos, expected } of testCases) {
      // @ts-expect-error - accessing private method
      const isBoundary = editor.isWordBoundary(text, pos);
      expect(isBoundary).toBe(expected);
    }
  });
});
