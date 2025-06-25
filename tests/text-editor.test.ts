import { describe, expect, test } from "bun:test";
import { TextEditor } from "../src/ui/text-editor";

describe("TextEditor", () => {
  describe("initialization", () => {
    test("creates empty single-line editor by default", () => {
      const editor = new TextEditor({ multiline: false });
      expect(editor.getContent()).toBe("");
      expect(editor.getLines()).toEqual([""]);
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });
    });

    test("creates empty multi-line editor", () => {
      const editor = new TextEditor({ multiline: true });
      expect(editor.getContent()).toBe("");
      expect(editor.getLines()).toEqual([""]);
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });
    });

    test("initializes with content", () => {
      const editor = new TextEditor({
        multiline: true,
        initialContent: "line1\nline2\nline3",
      });
      expect(editor.getContent()).toBe("line1\nline2\nline3");
      expect(editor.getLines()).toEqual(["line1", "line2", "line3"]);
    });

    test("single-line editor ignores newlines in initial content", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "line1\nline2",
      });
      expect(editor.getLines()).toEqual(["line1\nline2"]);
    });
  });

  describe("basic text operations", () => {
    test("insert character", () => {
      const editor = new TextEditor({ multiline: false });
      editor.insertChar("H");
      editor.insertChar("i");
      expect(editor.getContent()).toBe("Hi");
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 2 });
    });

    test("insert character in middle of text", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "Hlo",
      });
      editor.moveCursorToLineEnd(); // Move to end first
      editor.moveCursorLeft();
      editor.moveCursorLeft();
      editor.insertChar("el");
      expect(editor.getContent()).toBe("Hello");
    });

    test("delete character (backspace)", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "Hello",
      });
      editor.moveCursorToLineEnd();
      editor.deleteChar();
      expect(editor.getContent()).toBe("Hell");
      editor.deleteChar();
      expect(editor.getContent()).toBe("Hel");
    });

    test("delete character forward (delete key)", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "Hello",
      });
      editor.moveCursorToLineStart();
      editor.deleteCharForward();
      expect(editor.getContent()).toBe("ello");
    });
  });

  describe("cursor navigation", () => {
    test("move cursor left and right", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "Hello",
      });
      editor.moveCursorToLineEnd();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 5 });

      editor.moveCursorLeft();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 4 });

      editor.moveCursorLeft();
      editor.moveCursorLeft();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 2 });

      editor.moveCursorRight();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 3 });
    });

    test("cursor stops at boundaries in single-line mode", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "Hi",
      });

      // Try to move left past beginning
      editor.moveCursorToLineStart();
      editor.moveCursorLeft();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });

      // Try to move right past end
      editor.moveCursorToLineEnd();
      editor.moveCursorRight();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 2 });
    });

    test("move cursor up and down in multi-line mode", () => {
      const editor = new TextEditor({
        multiline: true,
        initialContent: "line1\nline2\nline3",
      });

      editor.moveCursorDown();
      expect(editor.getCursorPosition()).toEqual({ line: 1, char: 0 });

      editor.moveCursorDown();
      expect(editor.getCursorPosition()).toEqual({ line: 2, char: 0 });

      editor.moveCursorUp();
      expect(editor.getCursorPosition()).toEqual({ line: 1, char: 0 });
    });

    test("cursor wraps between lines in multi-line mode", () => {
      const editor = new TextEditor({
        multiline: true,
        initialContent: "line1\nline2",
      });

      editor.moveCursorToLineEnd();
      editor.moveCursorRight();
      expect(editor.getCursorPosition()).toEqual({ line: 1, char: 0 });

      editor.moveCursorLeft();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 5 });
    });
  });

  describe("word navigation", () => {
    test("move cursor word right", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello world test",
      });

      editor.moveCursorWordRight();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 5 });

      editor.moveCursorWordRight();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 11 });

      editor.moveCursorWordRight();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 16 });
    });

    test("move cursor word left", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello world test",
      });

      editor.moveCursorToLineEnd();
      editor.moveCursorWordLeft();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 12 });

      editor.moveCursorWordLeft();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 6 });

      editor.moveCursorWordLeft();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });
    });

    test("word navigation with special characters", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "file.name.txt",
      });

      editor.moveCursorWordRight();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 4 });

      editor.moveCursorWordRight();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 5 });

      editor.moveCursorWordRight();
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 9 });
    });
  });

  describe("delete operations", () => {
    test("delete word", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello world",
      });

      editor.moveCursorToLineEnd();
      editor.deleteWord();
      expect(editor.getContent()).toBe("hello ");

      editor.deleteWord();
      expect(editor.getContent()).toBe("");
    });

    test("delete to line start", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello world",
      });

      editor.moveCursorWordRight(); // cursor at 5
      editor.moveCursorRight(); // cursor at 6 (start of "world")
      editor.deleteToLineStart();
      expect(editor.getContent()).toBe("world");
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });
    });

    test("delete to line end", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello world",
      });

      editor.moveCursorWordRight();
      editor.deleteToLineEnd();
      expect(editor.getContent()).toBe("hello");
    });
  });

  describe("selection operations", () => {
    test("create and extend selection", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello world",
      });

      editor.startSelection();
      editor.moveCursorWordRight(true); // preserve selection
      editor.extendSelection(editor.getCursorPosition());

      expect(editor.getSelectedText()).toBe("hello");
    });

    test("selection across multiple lines", () => {
      const editor = new TextEditor({
        multiline: true,
        initialContent: "line1\nline2\nline3",
      });

      editor.startSelection();
      editor.moveCursorDown(true); // preserve selection
      editor.moveCursorDown(true); // preserve selection
      editor.moveCursorToLineEnd(true); // preserve selection
      editor.extendSelection(editor.getCursorPosition());

      expect(editor.getSelectedText()).toBe("line1\nline2\nline3");
    });

    test("delete selection", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello world",
      });

      editor.startSelection();
      editor.moveCursorWordRight(true); // preserve selection
      editor.extendSelection(editor.getCursorPosition());
      editor.deleteSelection();

      expect(editor.getContent()).toBe(" world");
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });
    });

    test("replace selection", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello world",
      });

      editor.startSelection();
      editor.moveCursorWordRight(true); // preserve selection
      editor.extendSelection(editor.getCursorPosition());
      editor.replaceSelection("goodbye");

      expect(editor.getContent()).toBe("goodbye world");
    });

    test("navigation with selection", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello world",
      });

      editor.navigateWithSelection(() => editor.moveCursorWordRight(true));
      expect(editor.getSelection()).not.toBeNull();
      expect(editor.getSelectedText()).toBe("hello");

      editor.navigateWithSelection(() => editor.moveCursorWordRight(true));
      expect(editor.getSelectedText()).toBe("hello world");
    });
  });

  describe("multi-line operations", () => {
    test("insert new line", () => {
      const editor = new TextEditor({
        multiline: true,
        initialContent: "hello world",
      });

      editor.moveCursorWordRight();
      editor.insertNewLine();

      expect(editor.getContent()).toBe("hello\n world");
      expect(editor.getCursorPosition()).toEqual({ line: 1, char: 0 });
    });

    test("join with previous line", () => {
      const editor = new TextEditor({
        multiline: true,
        initialContent: "hello\nworld",
      });

      editor.moveCursorDown();
      editor.moveCursorToLineStart();
      editor.deleteChar(); // Should join lines

      expect(editor.getContent()).toBe("helloworld");
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 5 });
    });

    test("swap lines up and down", () => {
      const editor = new TextEditor({
        multiline: true,
        initialContent: "line1\nline2\nline3",
      });

      editor.moveCursorDown();
      editor.swapLineUp();
      expect(editor.getLines()).toEqual(["line2", "line1", "line3"]);
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });

      editor.swapLineDown();
      expect(editor.getLines()).toEqual(["line1", "line2", "line3"]);
      expect(editor.getCursorPosition()).toEqual({ line: 1, char: 0 });
    });
  });

  describe("focus state", () => {
    test("toggle focus state", () => {
      const editor = new TextEditor();
      expect(editor.isFocused()).toBe(true);

      editor.setFocused(false);
      expect(editor.isFocused()).toBe(false);

      editor.setFocused(true);
      expect(editor.isFocused()).toBe(true);
    });
  });

  describe("edge cases", () => {
    test("handle empty editor", () => {
      const editor = new TextEditor();
      expect(editor.isEmpty()).toBe(true);

      editor.deleteChar();
      expect(editor.getContent()).toBe("");

      editor.deleteWord();
      expect(editor.getContent()).toBe("");
    });

    test("selection clears on navigation", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello",
      });

      editor.startSelection();
      editor.moveCursorWordRight(true); // preserve selection
      editor.extendSelection(editor.getCursorPosition());
      expect(editor.getSelection()).not.toBeNull();

      editor.moveCursorLeft(); // This should clear selection
      expect(editor.getSelection()).toBeNull();
    });

    test("typing replaces selection", () => {
      const editor = new TextEditor({
        multiline: false,
        initialContent: "hello world",
      });

      editor.startSelection();
      editor.moveCursorWordRight(true); // preserve selection
      editor.extendSelection(editor.getCursorPosition());
      editor.insertChar("hi");

      expect(editor.getContent()).toBe("hi world");
      expect(editor.getSelection()).toBeNull();
    });
  });
});
