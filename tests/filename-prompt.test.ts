import { describe, expect, mock, test } from "bun:test";
import { writeFileSync } from "node:fs";
import { CalculatorStateManager } from "../src/ui/calculator-state";

// Mock fs module
mock.module("fs", () => ({
  writeFileSync: mock(() => {
    // Intentionally empty - mocking file write
  }),
  readFileSync: mock(() => ""),
  existsSync: mock(() => false),
}));

describe("Filename Prompt", () => {
  test("ESC cancels filename prompt", () => {
    const state = new CalculatorStateManager();

    // Start filename prompt
    state.startFilenamePrompt();
    expect(state.getIsFilenamePrompt()).toBe(true);

    // Type some text
    for (const char of "test".split("")) {
      state.handleFilenamePromptInput(char);
    }
    expect(state.getPromptInput()).toBe("test");

    // ESC should be handled by Calculator component, not here
    // But we can test the cancelFilenamePrompt method
    state.cancelFilenamePrompt();
    expect(state.getIsFilenamePrompt()).toBe(false);
    expect(state.getPromptInput()).toBe("");
  });

  test("Enter saves file with entered filename", () => {
    const state = new CalculatorStateManager();

    // Start filename prompt
    state.startFilenamePrompt();

    // Type filename
    for (const char of "test.txt".split("")) {
      state.handleFilenamePromptInput(char);
    }

    // Press Enter
    state.handleFilenamePromptEnter();

    // Should exit filename prompt mode
    expect(state.getIsFilenamePrompt()).toBe(false);
    expect(state.getFilename()).toBe("test.txt");

    // Verify writeFileSync was called but file wasn't actually created
    expect(writeFileSync).toHaveBeenCalled();
  });
});
