import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { emptyCell, unpackChar } from "../src/cell.ts";
import { Terminal } from "../src/terminal.ts";

describe("Terminal", () => {
  let term: Terminal;

  beforeEach(() => {
    term = Terminal.open();
  });

  afterEach(() => {
    term.close();
  });

  test("putText preserves spaces", () => {
    // Test that spaces are properly rendered
    term.putText(0, 0, "A B C");

    // Check each character in the diff engine
    // @ts-expect-error - accessing private property for testing
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private property for testing
    const diffEngine = (term as any).diffEngine;
    expect(unpackChar(diffEngine.getCell(0, 0))).toBe("A");
    expect(unpackChar(diffEngine.getCell(0, 1))).toBe(" ");
    expect(unpackChar(diffEngine.getCell(0, 2))).toBe("B");
    expect(unpackChar(diffEngine.getCell(0, 3))).toBe(" ");
    expect(unpackChar(diffEngine.getCell(0, 4))).toBe("C");
  });

  test("putText handles text near boundaries", () => {
    // Get terminal dimensions
    const cols = term.cols;

    // Put text that would go past the boundary
    const longText =
      "This is a very long text that might exceed terminal width";
    term.putText(0, cols - 10, longText);

    // Check that text is clipped at boundary
    // @ts-expect-error - accessing private property for testing
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private property for testing
    const diffEngine = (term as any).diffEngine;
    // Should have written up to the boundary
    for (let i = 0; i < 10 && i < longText.length; i++) {
      expect(unpackChar(diffEngine.getCell(0, cols - 10 + i))).toBe(
        longText[i]
      );
    }

    // Should not have written past the boundary
    expect(diffEngine.getCell(0, cols)).toEqual(emptyCell()); // Empty or unchanged
  });

  test("render output includes spaces", () => {
    // Mock the buffer to capture output
    const outputs: string[] = [];
    // @ts-expect-error - accessing private property for testing
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private property for testing
    const buffer = (term as any).buffer;
    const originalWrite = buffer.write.bind(buffer);
    buffer.write = (data: string) => {
      outputs.push(data);
      originalWrite(data);
    };

    // Write text with spaces
    term.putText(0, 0, "Hello World");
    term.render();

    // Join all outputs
    const output = outputs.join("");

    // Should contain all the characters including the space
    expect(output).toContain("H");
    expect(output).toContain("e");
    expect(output).toContain("l");
    expect(output).toContain("l");
    expect(output).toContain("o");
    expect(output).toContain(" "); // The space
    expect(output).toContain("W");
    expect(output).toContain("o");
    expect(output).toContain("r");
    expect(output).toContain("l");
    expect(output).toContain("d");
  });
});
