import { describe, expect, test } from "bun:test";
import { existsSync, unlinkSync } from "node:fs";
import { CalculatorStateManager } from "../src/ui/calculator-state";
import type { KeyEvent } from "../src/utils/key-event";

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

describe("Modified Status Tracking", () => {
  describe("Existing File Behavior", () => {
    test("should not be modified initially for existing file", () => {
      const manager = new CalculatorStateManager("initial content", false);
      const state = manager.getState();
      expect(state.isModified).toBe(false);
    });

    test("should be modified after content change", () => {
      const manager = new CalculatorStateManager("initial content", false);

      // Add a character
      manager.handleCharacterInput("x");

      const state = manager.getState();
      expect(state.isModified).toBe(true);
    });

    test("should not be modified after reverting changes", () => {
      const manager = new CalculatorStateManager("initial content", false);

      // Add a character
      manager.handleCharacterInput("x");
      expect(manager.getState().isModified).toBe(true);

      // Remove the character
      manager.handleBackspace();
      expect(manager.getState().isModified).toBe(false);
    });

    test("should not be modified after cursor movements", () => {
      const manager = new CalculatorStateManager("initial content", false);

      // Move cursor around
      manager.handleArrowRight();
      manager.handleArrowLeft();
      manager.handleMoveToLineEnd();
      manager.handleMoveToLineStart();

      const state = manager.getState();
      expect(state.isModified).toBe(false);
    });

    test("should not be modified after selection operations", () => {
      const manager = new CalculatorStateManager("initial content", false);

      // Create and clear selection
      manager.handleKeyInput(createKeyEvent("right", true), "");
      manager.handleKeyInput(createKeyEvent("right", true), "");
      manager.handleKeyInput(createKeyEvent("escape"), "");

      const state = manager.getState();
      expect(state.isModified).toBe(false);
    });

    test("should be modified after complex edits even if final content matches", () => {
      const manager = new CalculatorStateManager("hello world", false);

      // Delete "hello"
      for (let i = 0; i < 5; i++) {
        manager.handleKeyInput(createKeyEvent("right", true), "");
      }
      manager.handleKeyInput(createKeyEvent("delete"), "");
      expect(manager.getState().isModified).toBe(true);

      // Type "hello" back
      manager.handleCharacterInput("h");
      manager.handleCharacterInput("e");
      manager.handleCharacterInput("l");
      manager.handleCharacterInput("l");
      manager.handleCharacterInput("o");

      // Content is back to original
      expect(manager.getCurrentContent()).toBe("hello world");
      expect(manager.getState().isModified).toBe(false);
    });
  });

  describe("New File Behavior", () => {
    test("should be modified initially for new file", () => {
      const manager = new CalculatorStateManager(
        "",
        false,
        false,
        "new-file.txt",
        true
      );
      const state = manager.getState();
      expect(state.isModified).toBe(true);
    });

    test("should remain modified after adding content to new file", () => {
      const manager = new CalculatorStateManager(
        "",
        false,
        false,
        "new-file.txt",
        true
      );

      manager.handleCharacterInput("h");
      manager.handleCharacterInput("i");

      const state = manager.getState();
      expect(state.isModified).toBe(true);
    });

    test("should remain modified even if content is deleted in new file", () => {
      const manager = new CalculatorStateManager(
        "",
        false,
        false,
        "new-file.txt",
        true
      );

      // Add and remove content
      manager.handleCharacterInput("h");
      manager.handleCharacterInput("i");
      manager.handleBackspace();
      manager.handleBackspace();

      // Even though content is empty, it's still a new file
      const state = manager.getState();
      expect(state.isModified).toBe(true);
      expect(manager.getCurrentContent()).toBe("");
    });

    test("should not be modified after saving new file", () => {
      const testFile = "test-new-file.txt";

      // Clean up if exists
      if (existsSync(testFile)) {
        unlinkSync(testFile);
      }

      const manager = new CalculatorStateManager(
        "test content",
        false,
        false,
        testFile,
        true
      );
      expect(manager.getState().isModified).toBe(true);

      // Save the file
      const saved = manager.saveFile();
      expect(saved).toBe(true);

      // Should no longer be modified
      expect(manager.getState().isModified).toBe(false);

      // Clean up
      if (existsSync(testFile)) {
        unlinkSync(testFile);
      }
    });
  });

  describe("Multi-line Operations", () => {
    test("should track modifications correctly with line operations", () => {
      const manager = new CalculatorStateManager("line1\nline2\nline3", false);

      // Swap lines
      manager.handleArrowDown();
      manager.handleSwapLineUp();

      // Content has changed
      expect(manager.getCurrentContent()).toBe("line2\nline1\nline3");
      expect(manager.getState().isModified).toBe(true);

      // Swap back
      manager.handleSwapLineDown();

      // Content is back to original
      expect(manager.getCurrentContent()).toBe("line1\nline2\nline3");
      expect(manager.getState().isModified).toBe(false);
    });

    test("should handle new line operations", () => {
      const manager = new CalculatorStateManager("hello", false);

      // Move to end and add new line
      manager.handleMoveToLineEnd();
      manager.handleNewLine();
      expect(manager.getCurrentContent()).toBe("hello\n");
      expect(manager.getState().isModified).toBe(true);

      // Remove the new line
      manager.handleBackspace();
      expect(manager.getCurrentContent()).toBe("hello");
      expect(manager.getState().isModified).toBe(false);
    });
  });
});
