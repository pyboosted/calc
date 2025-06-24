import { beforeEach, describe, expect, test } from "bun:test";
import { CalculatorStateManager } from "../src/ui/calculator-state";

describe("Text Selection", () => {
  let stateManager: CalculatorStateManager;

  beforeEach(() => {
    // Set up a multi-line calculator state for testing
    stateManager = new CalculatorStateManager(
      "first line\nsecond line\nthird line with more text",
      false
    );
  });

  describe("Basic Selection Operations", () => {
    test("should start selection at current cursor position", () => {
      // Position cursor at line 1, char 3
      stateManager.handleArrowDown(); // Move to line 1
      stateManager.handleArrowRight(); // Move to char 1
      stateManager.handleArrowRight(); // Move to char 2
      stateManager.handleArrowRight(); // Move to char 3

      expect(stateManager.hasSelection()).toBe(false);

      // Start selection
      stateManager.startSelection();

      expect(stateManager.hasSelection()).toBe(true);
      const state = stateManager.getState();
      expect(state.selection).toEqual({
        from: { line: 1, char: 3 },
        to: { line: 1, char: 3 },
      });
    });

    test("should clear selection", () => {
      stateManager.startSelection();
      expect(stateManager.hasSelection()).toBe(true);

      stateManager.clearSelection();
      expect(stateManager.hasSelection()).toBe(false);
      expect(stateManager.getState().selection).toBe(null);
    });

    test("should update selection end position", () => {
      // Start selection at line 0, char 0
      stateManager.startSelection();

      // Move cursor to line 0, char 5
      for (let i = 0; i < 5; i++) {
        stateManager.handleArrowRight();
      }
      stateManager.updateSelection();

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
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowRight(),
        true,
        "right"
      );

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
        stateManager.handleArrowRight();
      }

      expect(stateManager.hasSelection()).toBe(false);
      expect(stateManager.getState().cursorPosition).toBe(5);

      // Press Shift+Left once
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowLeft(),
        true,
        "left"
      );

      // Should have selection after just one keypress
      expect(stateManager.hasSelection()).toBe(true);
      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection?.from).toEqual({ line: 0, char: 5 });
      expect(state.selection?.to).toEqual({ line: 0, char: 4 });

      // Should have selected one character: 't'
      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("t"); // 't' character
      expect(selectedText.length).toBe(1);
    });

    test("should select one character when pressing Shift+Left on non-whitespace", () => {
      // Position at char 5 (on 't' in "first")
      for (let i = 0; i < 5; i++) {
        stateManager.handleArrowRight();
      }

      expect(stateManager.hasSelection()).toBe(false);
      expect(stateManager.getState().cursorPosition).toBe(5);

      // The character at position 5 is ' ' (space after "first")
      // But let's position at 4 (on 't')
      stateManager.handleArrowLeft();
      expect(stateManager.getState().cursorPosition).toBe(4);

      // Press Shift+Left once - should select 's'
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowLeft(),
        true,
        "left"
      );

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
      // Position at char 5 (space after "first")
      for (let i = 0; i < 5; i++) {
        stateManager.handleArrowRight();
      }

      expect(stateManager.hasSelection()).toBe(false);
      expect(stateManager.getState().cursorPosition).toBe(5);

      // Press Shift+Left once on whitespace
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowLeft(),
        true,
        "left"
      );

      // Should have selection after just one keypress
      expect(stateManager.hasSelection()).toBe(true);
      const state = stateManager.getState();
      expect(state.cursorPosition).toBe(4); // Cursor moved left

      // Should have selected one character: 't'
      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("t");
      expect(selectedText.length).toBe(1);
    });

    test("should select text from left to right", () => {
      // Position at beginning of first line
      // Start selection and move right to select "first"
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection

      for (let i = 0; i < 5; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowRight(),
          true
        );
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
        stateManager.handleArrowRight();
      }

      // Start selection and move left to select "first"
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection

      for (let i = 0; i < 5; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowLeft(),
          true
        );
      }

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection).toEqual({
        from: { line: 0, char: 5 },
        to: { line: 0, char: 0 },
      });
    });

    test("should handle word boundary selection", () => {
      // Position at beginning of first line
      // Select word "first" using word navigation
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      stateManager.handleNavigationKey(
        () => stateManager.handleMoveWordRight(),
        true
      );

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");
    });
  });

  describe("Multi-line Selection", () => {
    test("should select text wrapping to next line", () => {
      // Position at char 6 of first line (after "first ")
      for (let i = 0; i < 6; i++) {
        stateManager.handleArrowRight();
      }

      // Start selection and extend to second line
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection

      // Select rest of first line
      for (let i = 0; i < 4; i++) {
        // "line"
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowRight(),
          true
        );
      }

      // Move to second line - cursor will be at char 10 (preserves horizontal position)
      // but line is only 11 chars long: "second line"
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowDown(),
        true
      );

      // Move to char 6 on second line (after "second")
      // We're currently at char 10, so we need to move left 4 positions
      for (let i = 0; i < 4; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowLeft(),
          true
        );
      }

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("line\nsecond");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection?.from).toEqual({ line: 0, char: 6 });
      expect(state.selection?.to).toEqual({ line: 1, char: 6 });
    });

    test("should select text wrapping to previous line", () => {
      // Position at char 6 of second line
      stateManager.handleArrowDown(); // Move to line 1
      for (let i = 0; i < 6; i++) {
        stateManager.handleArrowRight(); // Move to char 6 ("second")
      }

      // Start selection and extend up to previous line
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowUp(),
        true
      ); // Up to line 0, char 6

      // Move left to beginning of first line
      for (let i = 0; i < 6; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowLeft(),
          true
        );
      }

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first line\nsecond");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection?.from).toEqual({ line: 1, char: 6 });
      expect(state.selection?.to).toEqual({ line: 0, char: 0 });
    });

    test("should select multiple complete lines", () => {
      // Start selection at beginning of first line
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection

      // Move to end of second line
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowDown(),
        true
      ); // line 1
      stateManager.handleNavigationKey(
        () => stateManager.handleMoveToLineEnd(),
        true
      ); // end of line 1

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first line\nsecond line");
    });
  });

  describe("Selection Mode Commands", () => {
    beforeEach(() => {
      // Set up a selection for testing: select "first" on line 0
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      for (let i = 0; i < 5; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowRight(),
          true
        );
      }
    });

    test("should copy selected text", () => {
      const result = stateManager.handleSelectionCopy();
      expect(result).toBe(true);
      expect(stateManager.hasSelection()).toBe(true); // Selection should remain

      // Note: We can't easily test clipboard content in this environment
      // but we verify the operation succeeds
    });

    test("should cut selected text", () => {
      const originalText = stateManager.getSelectedText();
      expect(originalText).toBe("first");

      const result = stateManager.handleSelectionCut();
      expect(result).toBe(true);
      expect(stateManager.hasSelection()).toBe(false); // Selection should be cleared

      // Verify text was deleted
      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe(" line");
      expect(state.cursorPosition).toBe(0); // Cursor at selection start
    });

    test("should delete selected text", () => {
      const result = stateManager.handleSelectionDelete();
      expect(result).toBe(true);
      expect(stateManager.hasSelection()).toBe(false); // Selection should be cleared

      // Verify text was deleted
      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe(" line");
      expect(state.cursorPosition).toBe(0); // Cursor at selection start
    });

    test("should expand selection to full lines", () => {
      const result = stateManager.handleSelectionExpand();
      expect(result).toBe(true);
      expect(stateManager.hasSelection()).toBe(true);

      // Check that selection now covers full line
      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection).toEqual({
        from: { line: 0, char: 0 },
        to: { line: 0, char: 10 }, // "first line".length
      });

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first line");
    });

    test("should handle escape to cancel selection", () => {
      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      
      // Type guard to ensure selection is not null
      if (!state.selection) {
        throw new Error("Selection should be defined");
      }
      
      const originalTo = state.selection.to;

      const result = stateManager.handleSelectionEscape();
      expect(result).toBe(true);
      expect(stateManager.hasSelection()).toBe(false);

      // Cursor should move to selection end
      const newState = stateManager.getState();
      expect(newState.currentLineIndex).toBe(originalTo.line);
      expect(newState.cursorPosition).toBe(originalTo.char);
    });

    test("should return false for selection commands when no selection", () => {
      stateManager.clearSelection();

      expect(stateManager.handleSelectionCopy()).toBe(false);
      expect(stateManager.handleSelectionCut()).toBe(false);
      expect(stateManager.handleSelectionDelete()).toBe(false);
      expect(stateManager.handleSelectionExpand()).toBe(false);
      expect(stateManager.handleSelectionEscape()).toBe(false);
    });
  });

  describe("Selection with Text Operations", () => {
    test("should replace selected text with character input", () => {
      // Select "first" on line 0
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      for (let i = 0; i < 5; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowRight(),
          true
        );
      }

      // Type replacement text
      stateManager.handleCharacterInput("hello");

      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe("hello line");
      expect(state.cursorPosition).toBe(5); // After "hello"
    });

    test("should delete selected text with backspace", () => {
      // Select "first" on line 0
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      for (let i = 0; i < 5; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowRight(),
          true
        );
      }

      stateManager.handleBackspace();

      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe(" line");
      expect(state.cursorPosition).toBe(0);
    });

    test("should handle multi-line selection deletion", () => {
      // Select from middle of first line to middle of second line
      // Move to char 6 of first line (after "first ")
      for (let i = 0; i < 6; i++) {
        stateManager.handleArrowRight();
      }

      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection

      // Select rest of first line
      for (let i = 0; i < 4; i++) {
        // "line"
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowRight(),
          true
        );
      }

      // Move to second line and select "second"
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowDown(),
        true
      ); // Move to line 1, char 10
      for (let i = 0; i < 4; i++) {
        // Move left to char 6
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowLeft(),
          true
        );
      }

      stateManager.handleSelectionDelete();

      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe("first  line");
      expect(state.lines.length).toBe(2); // One line was merged
      expect(state.currentLineIndex).toBe(0);
      expect(state.cursorPosition).toBe(6);
    });
  });

  describe("Navigation with Selection", () => {
    test("should clear selection and move to start when navigating left", () => {
      // Create selection from char 0 to char 5
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      for (let i = 0; i < 5; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowRight(),
          true
        );
      }

      // Navigate left without extending selection - this should move to selection start
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowLeft(),
        false,
        "left"
      );

      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.cursorPosition).toBe(0); // Should be at selection start
    });

    test("should clear selection and move to end when navigating right", () => {
      // Create selection from char 0 to char 5
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      for (let i = 0; i < 5; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowRight(),
          true
        );
      }

      // Navigate right without extending selection
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowRight(),
        false,
        "right"
      );

      expect(stateManager.hasSelection()).toBe(false);
      const state = stateManager.getState();
      expect(state.cursorPosition).toBe(5); // Should be at selection end
    });

    test("should clear selection on normal navigation", () => {
      // Create selection
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowRight(),
        true
      );

      // Navigate up without extending selection
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowUp(),
        false
      );

      expect(stateManager.hasSelection()).toBe(false);
    });
  });

  describe("Word Navigation with Selection", () => {
    test("should extend selection with word left navigation", () => {
      // Position at end of first word
      for (let i = 0; i < 5; i++) {
        stateManager.handleArrowRight(); // Move to char 5 (end of "first")
      }

      // Start selection and extend one word left
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      stateManager.handleNavigationKey(
        () => stateManager.handleMoveWordLeft(),
        true
      );

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection?.from).toEqual({ line: 0, char: 5 });
      expect(state.selection?.to).toEqual({ line: 0, char: 0 });
    });

    test("should extend selection with word right navigation", () => {
      // Start selection at beginning of line
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      stateManager.handleNavigationKey(
        () => stateManager.handleMoveWordRight(),
        true
      );

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection?.from).toEqual({ line: 0, char: 0 });
      expect(state.selection?.to).toEqual({ line: 0, char: 5 });
    });

    test("should extend selection to line start", () => {
      // Position at middle of first line
      for (let i = 0; i < 6; i++) {
        stateManager.handleArrowRight(); // Move to char 6 (after "first ")
      }

      // Start selection and extend to line start
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      stateManager.handleNavigationKey(
        () => stateManager.handleMoveToLineStart(),
        true
      );

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first ");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection?.from).toEqual({ line: 0, char: 6 });
      expect(state.selection?.to).toEqual({ line: 0, char: 0 });
    });

    test("should extend selection to line end", () => {
      // Position at middle of first line
      for (let i = 0; i < 6; i++) {
        stateManager.handleArrowRight(); // Move to char 6 (after "first ")
      }

      // Start selection and extend to line end
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      stateManager.handleNavigationKey(
        () => stateManager.handleMoveToLineEnd(),
        true
      );

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("line");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection?.from).toEqual({ line: 0, char: 6 });
      expect(state.selection?.to).toEqual({ line: 0, char: 10 });
    });

    test("should clear selection with word navigation without shift", () => {
      // Create a selection
      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      for (let i = 0; i < 5; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowRight(),
          true
        );
      }
      expect(stateManager.hasSelection()).toBe(true);

      // Navigate by word without extending selection
      stateManager.handleNavigationKey(
        () => stateManager.handleMoveWordRight(),
        false
      );

      expect(stateManager.hasSelection()).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty selection", () => {
      stateManager.startSelection();
      // Don't move cursor, so selection is empty

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("");
    });

    test("should handle selection at line boundaries", () => {
      // Move to end of first line
      stateManager.handleMoveToLineEnd();

      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection
      stateManager.handleNavigationKey(
        () => stateManager.handleArrowRight(),
        true
      ); // Move to next line

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("\n");

      const state = stateManager.getState();
      expect(state.selection).toBeDefined();
      expect(state.selection?.from).toEqual({ line: 0, char: 10 });
      expect(state.selection?.to).toEqual({ line: 1, char: 0 });
    });

    test("should normalize reversed selection", () => {
      // Create selection from right to left
      for (let i = 0; i < 5; i++) {
        stateManager.handleArrowRight();
      }

      stateManager.handleNavigationKey(() => {
        /* noop */
      }, true); // Start selection at char 5
      for (let i = 0; i < 5; i++) {
        stateManager.handleNavigationKey(
          () => stateManager.handleArrowLeft(),
          true
        );
      }

      const selectedText = stateManager.getSelectedText();
      expect(selectedText).toBe("first");

      // Test that normalization works in operations
      stateManager.handleSelectionDelete();
      const state = stateManager.getState();
      expect(state.lines[0]?.content).toBe(" line");
    });
  });
});
