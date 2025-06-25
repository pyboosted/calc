import { describe, expect, test } from "bun:test";
import { CalculatorStateManager } from "../src/ui/calculator-state";

describe("Filename Prompt", () => {
  test("ESC cancels filename prompt", () => {
    const state = new CalculatorStateManager();

    // Start filename prompt
    state.startFilenamePrompt();
    expect(state.getIsFilenamePrompt()).toBe(true);

    // Type some text
    state.handleFilenamePromptInput("t");
    state.handleFilenamePromptInput("e");
    state.handleFilenamePromptInput("s");
    state.handleFilenamePromptInput("t");
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
    state.handleFilenamePromptInput("t");
    state.handleFilenamePromptInput("e");
    state.handleFilenamePromptInput("s");
    state.handleFilenamePromptInput("t");
    state.handleFilenamePromptInput(".");
    state.handleFilenamePromptInput("t");
    state.handleFilenamePromptInput("x");
    state.handleFilenamePromptInput("t");

    // Press Enter
    state.handleFilenamePromptEnter();

    // Should exit filename prompt mode
    expect(state.getIsFilenamePrompt()).toBe(false);
    expect(state.getFilename()).toBe("test.txt");
  });
});
