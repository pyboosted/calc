import { describe, expect, spyOn, test } from "bun:test";
import { CalculatorStateManager } from "../src/ui/calculator-state";

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

    // Spy on the saveFileAs method
    const saveFileAsSpy = spyOn(state, "saveFileAs").mockReturnValue(true);

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

    // Verify saveFileAs was called with the correct filename
    expect(saveFileAsSpy).toHaveBeenCalledWith("test.txt");

    // Clean up
    saveFileAsSpy.mockRestore();
  });
});
