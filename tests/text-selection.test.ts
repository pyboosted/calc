import { beforeEach, describe, expect, test } from "bun:test";
import { CalculatorStateManager } from "../src/ui/calculator-state";
import type { KeyEvent } from "../src/utils/key-event";

describe("Text Selection", () => {
  let stateManager: CalculatorStateManager;

  beforeEach(() => {
    // Set up a multi-line calculator state for testing
    stateManager = new CalculatorStateManager(
      "first line\nsecond line\nthird line with more text",
      false
    );
  });

  // Helper to create key events
  function createKeyEvent(
    key: string,
    shift = false,
    ctrl = false,
    alt = false,
    meta = false
  ): KeyEvent {
    return {
      key,
      input: "",
      sequence: "",
      shift,
      ctrl,
      alt,
      meta,
    };
  }

  describe("Basic Selection Operations", () => {
    test("should start selection with Shift+Arrow", () => {
      // Position cursor at line 1, char 3
      stateManager.handleKeyInput(createKeyEvent("down"), "");
      stateManager.handleKeyInput(createKeyEvent("right"), "");
      stateManager.handleKeyInput(createKeyEvent("right"), "");
      stateManager.handleKeyInput(createKeyEvent("right"), "");

      expect(stateManager.hasSelection()).toBe(false);

      // Start selection with Shift+Right
      stateManager.handleKeyInput(createKeyEvent("right", true), "");

      expect(stateManager.hasSelection()).toBe(true);
      const state = stateManager.getState();
      expect(state.selection).toEqual({
        from: { line: 1, char: 3 },
        to: { line: 1, char: 4 },
      });
    });

    test("should clear selection with ESC", () => {
      // Create selection
      stateManager.handleKeyInput(createKeyEvent("right", true), "");
      expect(stateManager.hasSelection()).toBe(true);

      // Clear with ESC
      stateManager.handleSelectionEscape();
      expect(stateManager.hasSelection()).toBe(false);
      expect(stateManager.getState().selection).toBe(null);
    });

    test("should extend selection with multiple Shift+Arrow", () => {
      // Start selection with Shift+Right
      stateManager.handleKeyInput(createKeyEvent("right", true), "");

      // Extend selection
      for (let i = 0; i < 4; i++) {
        stateManager.handleKeyInput(createKeyEvent("right", true), "");
      }

      const state = stateManager.getState();
      expect(state.selection).toEqual({
        from: { line: 0, char: 0 },
        to: { line: 0, char: 5 },
      });
    });
  });

  describe("Single Line Selection", () => {
    test("should start selection on first Shift+Right keypress", () => {
      // Position at beginning of first line
      expect(stateManager.hasSelection()).toBe(false);
      expect(stateManager.getState().cursorPosition).toBe(0);

      // Press Shift+Right once
      stateManager.handleKeyInput(createKeyEvent("right", true), "");

      // Should have selection after just one keypress
      expect(stateManager.hasSelection()).toBe(true);
      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection?.from).toEqual({ line: 0, char: 0 });
      expect(state.selection?.to).toEqual({ line: 0, char: 1 });

      // Should have selected one character
      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("f"); // First character of "first line"
      expect(selectedText.length).toBe(1);
    });

    test("should start selection on first Shift+Left keypress", () => {
      // Position at char 5 (after "first")
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right"), "");
      }

      expect(stateManager.hasSelection()).toBe(false);
      expect(stateManager.getState().cursorPosition).toBe(5);

      // Press Shift+Left once
      stateManager.handleKeyInput(createKeyEvent("left", true), "");

      // Should have selection after just one keypress
      expect(stateManager.hasSelection()).toBe(true);
      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      // Selection maintains direction: from where we started to where we moved
      expect(state.selection?.from).toEqual({ line: 0, char: 5 });
      expect(state.selection?.to).toEqual({ line: 0, char: 4 });

      // Should have selected one character: 't'
      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("t"); // 't' character
      expect(selectedText.length).toBe(1);
    });

    test("should select one character when pressing Shift+Left on non-whitespace", () => {
      // Position at char 4 (on 't')
      for (let i = 0; i < 4; i++) {
        stateManager.handleKeyInput(createKeyEvent("right"), "");
      }

      expect(stateManager.hasSelection()).toBe(false);
      expect(stateManager.getState().cursorPosition).toBe(4);

      // Press Shift+Left once - should select 's'
      stateManager.handleKeyInput(createKeyEvent("left", true), "");

      // Should have selection after just one keypress
      expect(stateManager.hasSelection()).toBe(true);
      const state = stateManager.getState();
      expect(state.cursorPosition).toBe(3); // Cursor moved left to 's'

      // Should have selected one character: 's'
      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("s");
      expect(selectedText.length).toBe(1);
    });

    test("should select only one character when pressing Shift+Left on whitespace", () => {
      // Position at char 6 (on space after "first")
      for (let i = 0; i < 6; i++) {
        stateManager.handleKeyInput(createKeyEvent("right"), "");
      }

      expect(stateManager.hasSelection()).toBe(false);
      expect(stateManager.getState().cursorPosition).toBe(6);

      // Press Shift+Left once on whitespace
      stateManager.handleKeyInput(createKeyEvent("left", true), "");

      // Should have selection after just one keypress
      expect(stateManager.hasSelection()).toBe(true);
      const state = stateManager.getState();
      expect(state.cursorPosition).toBe(5); // Cursor moved left

      // Should have selected one character: space
      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe(" ");
      expect(selectedText.length).toBe(1);
    });

    test("should select text from left to right", () => {
      // Select "first" by pressing Shift+Right 5 times
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right", true), "");
      }

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection).toEqual({
        from: { line: 0, char: 0 },
        to: { line: 0, char: 5 },
      });
    });

    test("should select text from right to left", () => {
      // Position at char 5 of first line
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right"), "");
      }

      // Select "first" backwards by pressing Shift+Left 5 times
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("left", true), "");
      }

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      // Selection maintains direction: from where we started to where we moved
      expect(state.selection).toEqual({
        from: { line: 0, char: 5 },
        to: { line: 0, char: 0 },
      });
    });

    test("should handle word boundary selection", () => {
      // Position at end of "first" (char 5)
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right"), "");
      }

      // Select " line" by pressing Shift+Right 5 times
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right", true), "");
      }

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe(" line");

      const state = stateManager.getState();
      expect(state.selection).toEqual({
        from: { line: 0, char: 5 },
        to: { line: 0, char: 10 },
      });
    });
  });

  describe("Multi-line Selection", () => {
    test("should select text wrapping to next line", () => {
      // Position at end of first line
      stateManager.handleKeyInput(createKeyEvent("end"), "");
      const endPos = stateManager.getState().cursorPosition;

      // Select to beginning of second line
      stateManager.handleKeyInput(createKeyEvent("right", true), "");
      stateManager.handleKeyInput(createKeyEvent("right", true), "");

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("\ns");

      const state = stateManager.getState();
      expect(state.selection).toEqual({
        from: { line: 0, char: endPos },
        to: { line: 1, char: 1 },
      });
    });

    test("should select text wrapping to previous line", () => {
      // Position at beginning of second line
      stateManager.handleKeyInput(createKeyEvent("down"), "");
      expect(stateManager.getState().currentLineIndex).toBe(1);
      expect(stateManager.getState().cursorPosition).toBe(0);

      // Select to end of first line
      stateManager.handleKeyInput(createKeyEvent("left", true), "");

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("\n");

      const state = stateManager.getState();
      // Selection maintains direction: from where we started to where we moved
      expect(state.selection).toEqual({
        from: { line: 1, char: 0 },
        to: { line: 0, char: 10 },
      });
    });

    test("should select multiple complete lines", () => {
      // Select entire first line and part of second
      stateManager.handleKeyInput(createKeyEvent("a", true, true), ""); // Ctrl+Shift+A to select to line start
      stateManager.handleKeyInput(createKeyEvent("down", true), "");
      stateManager.handleKeyInput(createKeyEvent("down", true), "");

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first line\nsecond line\n");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.currentLineIndex).toBe(2);
    });
  });

  describe("Selection Mode Commands", () => {
    beforeEach(() => {
      // Create a selection of "first"
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right", true), "");
      }
      // Note: The selection should be "first" at this point
    });

    test("should copy selected text", () => {
      const result = stateManager.handleSelectionCopy();
      expect(result).toBe(true);

      // Selection should still exist after copy
      expect(stateManager.hasSelection()).toBe(true);
      expect(stateManager.getSelectedText()).toBe("first");
    });

    test("should cut selected text", () => {
      const result = stateManager.handleSelectionCut();
      expect(result).toBe(true);

      // Selection should be cleared and text deleted
      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe(" line");
    });

    test("should delete selected text", () => {
      const result = stateManager.handleSelectionDelete();
      expect(result).toBe(true);

      // Selection should be cleared and text deleted
      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe(" line");
    });

    test("should expand selection to full lines", () => {
      const result = stateManager.handleSelectionExpand();
      expect(result).toBe(true);

      // Should have selected the entire first line
      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first line");

      const state = stateManager.getState();
      expect(state.selection).toEqual({
        from: { line: 0, char: 0 },
        to: { line: 0, char: 10 },
      });
    });

    test("should handle escape to cancel selection", () => {
      const result = stateManager.handleSelectionEscape();
      expect(result).toBe(true);

      // Selection should be cleared
      expect(stateManager.hasSelection()).toBe(false);
      expect(stateManager.getState().selection).toBe(null);
    });
  });

  describe("Selection with Text Operations", () => {
    test("should replace selected text with character input", () => {
      // Select "first"
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right", true), "");
      }
      expect(stateManager.getSelectedText()).toBe("first");

      // Type 'x' to replace selection
      stateManager.handleKeyInput(createKeyEvent("x"), "x");

      // Selection should be cleared and text replaced
      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe("x line");
      expect(state.cursorPosition).toBe(1);
    });

    test("should delete selected text with backspace", () => {
      // Select "first"
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right", true), "");
      }

      // Press backspace
      stateManager.handleKeyInput(createKeyEvent("backspace"), "");

      // Selection should be cleared and text deleted
      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe(" line");
    });

    test("should handle multi-line selection deletion", () => {
      // Select from end of first line through the newline and "se" of second line
      stateManager.handleKeyInput(createKeyEvent("end"), "");
      // Move to start of second line
      stateManager.handleKeyInput(createKeyEvent("right", true), "");
      // Select "se" from "second"
      stateManager.handleKeyInput(createKeyEvent("right", true), "");
      stateManager.handleKeyInput(createKeyEvent("right", true), "");

      // Delete selection
      stateManager.handleKeyInput(createKeyEvent("delete"), "");

      // Should have deleted across lines
      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe("first linecond line");
    });
  });

  describe("Navigation with Selection", () => {
    beforeEach(() => {
      // Create a selection of "first"
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right", true), "");
      }
    });

    test("should clear selection and move to start when navigating left", () => {
      // Press left without shift
      stateManager.handleKeyInput(createKeyEvent("left"), "");

      // Selection should be cleared, cursor at start of selection
      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.cursorPosition).toBe(0);
    });

    test("should clear selection and move to end when navigating right", () => {
      // Press right without shift
      stateManager.handleKeyInput(createKeyEvent("right"), "");

      // Selection should be cleared, cursor at end of selection
      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.cursorPosition).toBe(5);
    });
  });

  describe("Word Navigation with Selection", () => {
    test("should extend selection with word left navigation", () => {
      // Position at end of "first"
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right"), "");
      }

      // Alt+Shift+Left to select word "first"
      stateManager.handleKeyInput(
        createKeyEvent("left", true, false, true),
        ""
      );

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");
    });

    test("should extend selection with word right navigation", () => {
      // Alt+Shift+Right to select word "first"
      stateManager.handleKeyInput(
        createKeyEvent("right", true, false, true),
        ""
      );

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");
    });

    test("should extend selection to line start", () => {
      // Position at char 5
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right"), "");
      }

      // Ctrl+Shift+A to select to line start
      stateManager.handleKeyInput(createKeyEvent("a", true, true), "");

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");
    });

    test("should extend selection to line end", () => {
      // Ctrl+Shift+E to select to line end
      stateManager.handleKeyInput(createKeyEvent("e", true, true), "");

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first line");
    });

    test("should clear selection with word navigation without shift", () => {
      // Create selection
      stateManager.handleKeyInput(createKeyEvent("right", true), "");
      expect(stateManager.hasSelection()).toBe(true);

      // Alt+Right without shift
      stateManager.handleKeyInput(
        createKeyEvent("right", false, false, true),
        ""
      );

      // Selection should be cleared
      expect(stateManager.hasSelection()).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle selection at line boundaries", () => {
      // Position at end of first line
      stateManager.handleKeyInput(createKeyEvent("end"), "");

      // Select across line boundary
      stateManager.handleKeyInput(createKeyEvent("right", true), "");

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("\n");
    });

    test("should normalize reversed selection", () => {
      // Position at char 5
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("right"), "");
      }

      // Select backwards
      for (let i = 0; i < 5; i++) {
        stateManager.handleKeyInput(createKeyEvent("left", true), "");
      }

      // Selection maintains direction (not normalized)
      const state = stateManager.getState();
      expect(state.selection).toEqual({
        from: { line: 0, char: 5 },
        to: { line: 0, char: 0 },
      });

      // But selected text should still be "first"
      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");
    });
  });
});
