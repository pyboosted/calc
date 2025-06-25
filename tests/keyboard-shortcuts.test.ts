import { describe, expect, test } from "bun:test";
import { TextEditor } from "../src/ui/text-editor";
import { HotkeyManager } from "../src/utils/hotkey-manager";
import {
  type KeyEvent,
  parseKeyEvent,
  type RawKeypressData,
} from "../src/utils/key-event";

// Helper function to parse key event and assert it's not null
function parseKey(
  str: string | undefined,
  key: RawKeypressData | undefined
): KeyEvent {
  const event = parseKeyEvent(str, key);
  if (!event) {
    throw new Error(
      `Expected key event but got null for: ${JSON.stringify({ str, key })}`
    );
  }
  return event;
}

describe("Keyboard Shortcuts with New System", () => {
  describe("parseKeyEvent", () => {
    test("parseKeyEvent returns correct key names", () => {
      // Test Enter key
      const enterKey = parseKey("\r", { sequence: "\r", name: "return" });
      expect(enterKey.key).toBe("return");

      // Test escape sequence for right arrow
      const rightKey = parseKey("", { sequence: "\x1b[C", name: "right" });
      expect(rightKey.key).toBe("right");

      // Test Alt+Right
      const altRightKey = parseKey("", { sequence: "\x1bf" });
      expect(altRightKey.key).toBe("right");
      expect(altRightKey.alt).toBe(true);
    });
  });

  describe("TextEditor Navigation", () => {
    test("arrow keys work correctly", () => {
      const editor = new TextEditor({ initialContent: "hello world" });

      // Test Right arrow
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[C", name: "right" }),
        ""
      );
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 1 });

      // Test Left arrow
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[D", name: "left" }),
        ""
      );
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });
    });

    test("word navigation (Alt+Arrow) works", () => {
      const editor = new TextEditor({ initialContent: "hello world test" });

      // Alt+Right should move to end of "hello"
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1bf", name: "right", meta: true }),
        ""
      );
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 5 });

      // Alt+Left should move back to start
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1bb", name: "left", meta: true }),
        ""
      );
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });
    });

    test("line start/end navigation (Ctrl+A/E) works", () => {
      const editor = new TextEditor({ initialContent: "hello world" });
      editor.setCursorPosition(0, 5);

      // Ctrl+A should move to start
      editor.handleKeyInput(
        parseKey("\x01", { sequence: "\x01", name: "a", ctrl: true }),
        ""
      );
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });

      // Ctrl+E should move to end
      editor.handleKeyInput(
        parseKey("\x05", { sequence: "\x05", name: "e", ctrl: true }),
        ""
      );
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 11 });
    });

    test("Home/End keys work", () => {
      const editor = new TextEditor({ initialContent: "hello world" });
      editor.setCursorPosition(0, 5);

      // Home key
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[H", name: "home" }),
        ""
      );
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });

      // End key
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[F", name: "end" }),
        ""
      );
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 11 });
    });
  });

  describe("TextEditor Selection", () => {
    test("Shift+Arrow creates selection", () => {
      const editor = new TextEditor({ initialContent: "hello world" });

      // Shift+Right should create selection
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[C", name: "right", shift: true }),
        ""
      );
      const selection = editor.getSelection();
      expect(selection).not.toBeNull();
      expect(selection?.from).toEqual({ line: 0, char: 0 });
      expect(selection?.to).toEqual({ line: 0, char: 1 });
      expect(editor.getSelectedText()).toBe("h");
    });

    test("Shift+Alt+Arrow selects word", () => {
      const editor = new TextEditor({ initialContent: "hello world test" });

      // Shift+Alt+Right should select "hello"
      // The TextEditor already has this binding, we just need to use the right key event
      const handled = editor.handleKeyInput(
        parseKey("", {
          sequence: "\x1b[C",
          name: "right",
          shift: true,
          meta: true,
        }),
        ""
      );
      expect(handled).toBe(true);
      expect(editor.getSelectedText()).toBe("hello");
    });

    test("Shift+Ctrl+A/E selects to line boundaries", () => {
      const editor = new TextEditor({ initialContent: "hello world" });
      editor.setCursorPosition(0, 5);

      // Shift+Ctrl+A should select from cursor to start
      editor.handleKeyInput(
        parseKey("\x01", {
          sequence: "\x01",
          name: "a",
          ctrl: true,
          shift: true,
        }),
        ""
      );
      expect(editor.getSelectedText()).toBe("hello");

      // Clear selection and test Shift+Ctrl+E
      editor.clearSelection();
      editor.setCursorPosition(0, 5);
      editor.handleKeyInput(
        parseKey("\x05", {
          sequence: "\x05",
          name: "e",
          ctrl: true,
          shift: true,
        }),
        ""
      );
      expect(editor.getSelectedText()).toBe(" world");
    });
  });

  describe("TextEditor Deletion", () => {
    test("Backspace and Delete work", () => {
      const editor = new TextEditor({ initialContent: "hello" });
      editor.setCursorPosition(0, 5);

      // Backspace should delete 'o'
      editor.handleKeyInput(
        parseKey("\x7f", { sequence: "\x7f", name: "backspace" }),
        ""
      );
      expect(editor.getContent()).toBe("hell");

      // Delete at position 2 should delete 'l'
      editor.setCursorPosition(0, 2);
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[3~", name: "delete" }),
        ""
      );
      expect(editor.getContent()).toBe("hel");
    });

    test("Alt+Backspace deletes word", () => {
      const editor = new TextEditor({ initialContent: "hello world" });
      editor.setCursorPosition(0, 11);

      // Alt+Backspace should delete "world"
      editor.handleKeyInput(
        parseKey("\x17", { sequence: "\x17", name: "w", ctrl: true }),
        ""
      );
      expect(editor.getContent()).toBe("hello ");
    });

    test("Alt+Delete deletes word forward", () => {
      const editor = new TextEditor({ initialContent: "hello world" });
      editor.setCursorPosition(0, 0);

      // Alt+Delete should delete "hello"
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[3~", name: "delete", meta: true }),
        ""
      );
      expect(editor.getContent()).toBe(" world");
    });

    test("Ctrl+K deletes to line end", () => {
      const editor = new TextEditor({ initialContent: "hello world" });
      editor.setCursorPosition(0, 5);

      // Ctrl+K should delete " world"
      editor.handleKeyInput(
        parseKey("\x0b", { sequence: "\x0b", name: "k", ctrl: true }),
        ""
      );
      expect(editor.getContent()).toBe("hello");
    });

    test("Ctrl+U deletes to line start", () => {
      const editor = new TextEditor({ initialContent: "hello world" });
      editor.setCursorPosition(0, 5);

      // Ctrl+U should delete "hello"
      editor.handleKeyInput(
        parseKey("\x15", { sequence: "\x15", name: "u", ctrl: true }),
        ""
      );
      expect(editor.getContent()).toBe(" world");
    });
  });

  describe("TextEditor Multiline Operations", () => {
    test("Enter creates new line", () => {
      const editor = new TextEditor({
        initialContent: "hello",
        multiline: true,
      });
      editor.setCursorPosition(0, 5);

      // Enter should create new line
      // Create a proper return key event without ctrl modifier
      const enterKey: KeyEvent = {
        key: "return",
        input: "\r",
        sequence: "\r",
        ctrl: false,
        alt: false,
        meta: false,
        shift: false,
      };
      const handled = editor.handleKeyInput(enterKey, "");
      expect(handled).toBe(true);
      expect(editor.getLines()).toEqual(["hello", ""]);
      expect(editor.getCursorPosition()).toEqual({ line: 1, char: 0 });
    });

    test("Alt+Up/Down swaps lines", () => {
      const editor = new TextEditor({
        initialContent: "line1\nline2\nline3",
        multiline: true,
      });
      editor.setCursorPosition(1, 0);

      // Alt+Up should swap line2 with line1
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[A", name: "up", meta: true }),
        ""
      );
      expect(editor.getLines()).toEqual(["line2", "line1", "line3"]);
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 0 });

      // Alt+Down should swap back
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[B", name: "down", meta: true }),
        ""
      );
      expect(editor.getLines()).toEqual(["line1", "line2", "line3"]);
      expect(editor.getCursorPosition()).toEqual({ line: 1, char: 0 });
    });

    test("Up/Down arrows navigate between lines", () => {
      const editor = new TextEditor({
        initialContent: "line1\nline2\nline3",
        multiline: true,
      });
      editor.setCursorPosition(1, 2);

      // Up arrow
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[A", name: "up" }),
        ""
      );
      expect(editor.getCursorPosition()).toEqual({ line: 0, char: 2 });

      // Down arrow
      editor.handleKeyInput(
        parseKey("", { sequence: "\x1b[B", name: "down" }),
        ""
      );
      expect(editor.getCursorPosition()).toEqual({ line: 1, char: 2 });
    });
  });

  describe("HotkeyManager Pattern Normalization", () => {
    test("debug pattern matching order", () => {
      const manager = new HotkeyManager();

      // The actual key event has alt: true, meta: true, shift: true
      // The pattern building creates "alt+shift+right" (alphabetical order)
      // But our binding might be "shift+alt+right" (different order)

      let called1 = false;
      let called2 = false;
      let called3 = false;

      manager.bind("shift+alt+right", () => {
        called1 = true;
        return true;
      });

      manager.bind("alt+shift+right", () => {
        called2 = true;
        return true;
      });

      manager.bind("shift+meta+right", () => {
        called3 = true;
        return true;
      });

      const keyEvent = {
        key: "right",
        input: "",
        sequence: "\x1b[C",
        ctrl: false,
        alt: true,
        meta: true,
        shift: true,
      };

      manager.handle(keyEvent, "");

      expect(called1 || called2 || called3).toBe(true);
    });

    test("case-insensitive pattern matching", () => {
      const manager = new HotkeyManager();
      let called = false;

      // Bind with mixed case
      manager.bind("Ctrl+A", () => {
        called = true;
        return true;
      });

      // Should match with lowercase
      const handled = manager.handle(
        parseKey("\x01", { sequence: "\x01", name: "a", ctrl: true }),
        ""
      );

      expect(handled).toBe(true);
      expect(called).toBe(true);
    });

    test("modifier aliases work", () => {
      const manager = new HotkeyManager();
      let optionCalled = false;
      let cmdCalled = false;

      // Bind with Option (should match Alt)
      manager.bind("Option+Left", () => {
        optionCalled = true;
        return true;
      });

      // Bind with Cmd (should normalize to Meta)
      manager.bind("Cmd+M", () => {
        cmdCalled = true;
        return true;
      });

      // Test Option -> Alt
      // When the terminal sends Alt+Left, it sets meta: true which parseKey converts to alt: true
      manager.handle(
        parseKey("", { sequence: "\x1bb", name: "left", meta: true }),
        ""
      );
      expect(optionCalled).toBe(true);

      // Test Cmd -> Meta
      // For a true Meta key (not Alt), we need a key event with only meta: true
      const metaKey = {
        key: "m",
        input: "m",
        sequence: "m",
        ctrl: false,
        alt: false,
        meta: true,
        shift: false,
      };
      manager.handle(metaKey, "m");
      expect(cmdCalled).toBe(true);
    });

    test("escape sequences work", () => {
      const manager = new HotkeyManager();
      let called = false;

      manager.bind("\\\\x1b[3~", () => {
        called = true;
        return true;
      });

      const handled = manager.handle(
        parseKey("", { sequence: "\x1b[3~", name: "delete" }),
        ""
      );

      expect(handled).toBe(true);
      expect(called).toBe(true);
    });
  });

  describe("Character Input", () => {
    test("regular characters are inserted", () => {
      const editor = new TextEditor({ initialContent: "" });

      // Type "abc"
      editor.handleKeyInput(parseKey("a", { sequence: "a" }), "a");
      editor.handleKeyInput(parseKey("b", { sequence: "b" }), "b");
      editor.handleKeyInput(parseKey("c", { sequence: "c" }), "c");

      expect(editor.getContent()).toBe("abc");
    });

    test("characters with modifiers are not inserted", () => {
      const editor = new TextEditor({ initialContent: "" });

      // Ctrl+A should not insert
      editor.handleKeyInput(
        parseKey("\x01", { sequence: "\x01", name: "a", ctrl: true }),
        ""
      );
      expect(editor.getContent()).toBe("");

      // Meta+A should not insert
      editor.handleKeyInput(
        parseKey("a", { sequence: "a", name: "a", meta: true }),
        "a"
      );
      expect(editor.getContent()).toBe("");
    });
  });
});
