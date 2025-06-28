import { describe, expect, test } from "bun:test";
import { CalculatorEngine } from "../src/ui/calculator-engine";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Prev Variable with Consecutive Lines", () => {
  test("prev works with consecutive non-empty lines", () => {
    const engine = new CalculatorEngine();

    // Set up the lines as described in the issue
    engine.updateLine(0, "20 + 46");
    engine.insertLine(1);
    engine.updateLine(1, "test = prev");
    engine.insertLine(2);
    engine.updateLine(2, "test");

    const lines = engine.getLines();

    // First line should evaluate to 66
    expect(lines[0]?.result?.type).toBe("number");
    if (lines[0]?.result?.type === "number") {
      expect(fromDecimal(lines[0]?.result?.value)).toBe(66);
    }

    // Second line should assign prev (66) to test
    expect(lines[1]?.result?.type).toBe("number");
    if (lines[1]?.result?.type === "number") {
      expect(fromDecimal(lines[1]?.result?.value)).toBe(66);
    }

    // Third line should output test (66)
    expect(lines[2]?.result?.type).toBe("number");
    if (lines[2]?.result?.type === "number") {
      expect(fromDecimal(lines[2]?.result?.value)).toBe(66);
    }
  });

  test("prev works without empty lines between", () => {
    const engine = new CalculatorEngine();

    // Create lines without inserting empty ones
    engine.updateLine(0, "20 + 46");
    engine.insertLine(1);
    engine.updateLine(1, "test = prev");
    engine.insertLine(2);
    engine.updateLine(2, "test");

    const lines = engine.getLines();

    // All lines should work correctly
    expect(lines[0]?.result?.type).toBe("number");
    if (lines[0]?.result?.type === "number") {
      expect(fromDecimal(lines[0]?.result?.value)).toBe(66);
    }
    expect(lines[1]?.result?.type).toBe("number");
    if (lines[1]?.result?.type === "number") {
      expect(fromDecimal(lines[1]?.result?.value)).toBe(66);
    }
    expect(lines[2]?.result?.type).toBe("number");
    if (lines[2]?.result?.type === "number") {
      expect(fromDecimal(lines[2]?.result?.value)).toBe(66);
    }
  });

  test("multiple consecutive calculations with prev", () => {
    const engine = new CalculatorEngine();

    engine.updateLine(0, "10 + 5");
    engine.insertLine(1);
    engine.updateLine(1, "prev * 2");
    engine.insertLine(2);
    engine.updateLine(2, "prev + 10");

    const lines = engine.getLines();

    expect(lines[0]?.result?.type).toBe("number");
    if (lines[0]?.result?.type === "number") {
      expect(fromDecimal(lines[0]?.result?.value)).toBe(15);
    }
    expect(lines[1]?.result?.type).toBe("number");
    if (lines[1]?.result?.type === "number") {
      expect(fromDecimal(lines[1]?.result?.value)).toBe(30);
    }
    expect(lines[2]?.result?.type).toBe("number");
    if (lines[2]?.result?.type === "number") {
      expect(fromDecimal(lines[2]?.result?.value)).toBe(40);
    }
  });
});
