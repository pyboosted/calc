import { describe, expect, test } from "bun:test";
import { CalculatorEngine } from "../src/ui/calculator-engine";

describe("Calculator Engine Variable Reassignment", () => {
  test("should handle variable reassignment across lines", () => {
    const engine = new CalculatorEngine();

    // Set up initial lines
    engine.updateLine(0, "a = 1");
    engine.insertLine(1);
    engine.updateLine(1, "a");

    // Check initial value
    let lines = engine.getLines();
    expect(lines[0]?.result?.value).toBe(1);
    expect(lines[1]?.result?.value).toBe(1);

    // Now reassign
    engine.insertLine(2);
    engine.updateLine(2, "a = 2");
    engine.insertLine(3);
    engine.updateLine(3, "a");

    // Check that reassignment worked
    lines = engine.getLines();
    expect(lines[2]?.result?.value).toBe(2);
    expect(lines[3]?.result?.value).toBe(2);
  });

  test("should propagate variable changes to subsequent lines", () => {
    const engine = new CalculatorEngine();

    // Set up calculation chain
    engine.updateLine(0, "x = 10");
    engine.insertLine(1);
    engine.updateLine(1, "y = x * 2");
    engine.insertLine(2);
    engine.updateLine(2, "y");

    // Check initial values
    let lines = engine.getLines();
    expect(lines[0]?.result?.value).toBe(10);
    expect(lines[1]?.result?.value).toBe(20);
    expect(lines[2]?.result?.value).toBe(20);

    // Reassign x
    engine.insertLine(3);
    engine.updateLine(3, "x = 5");
    engine.insertLine(4);
    engine.updateLine(4, "y");

    // y should still be 20 because it was calculated with old x
    lines = engine.getLines();
    expect(lines[3]?.result?.value).toBe(5);
    expect(lines[4]?.result?.value).toBe(20);

    // But if we recalculate y after x change
    engine.insertLine(5);
    engine.updateLine(5, "y = x * 2");
    engine.insertLine(6);
    engine.updateLine(6, "y");

    // Now y should be updated
    lines = engine.getLines();
    expect(lines[5]?.result?.value).toBe(10);
    expect(lines[6]?.result?.value).toBe(10);
  });

  test("should handle multiple reassignments in sequence", () => {
    const engine = new CalculatorEngine();

    engine.updateLine(0, "a = 1");
    engine.insertLine(1);
    engine.updateLine(1, "a = a + 1");
    engine.insertLine(2);
    engine.updateLine(2, "a = a + 1");
    engine.insertLine(3);
    engine.updateLine(3, "a");

    const lines = engine.getLines();
    expect(lines[0]?.result?.value).toBe(1);
    expect(lines[1]?.result?.value).toBe(2);
    expect(lines[2]?.result?.value).toBe(3);
    expect(lines[3]?.result?.value).toBe(3);
  });

  test("should handle reassignment with units", () => {
    const engine = new CalculatorEngine();

    engine.updateLine(0, "dist = 100 m");
    engine.insertLine(1);
    engine.updateLine(1, "dist");

    let lines = engine.getLines();
    const result0 = lines[0]?.result;
    expect(result0?.type).toBe("quantity");
    if (result0?.type === "quantity") {
      expect(result0.value).toBe(100);
      expect(result0.dimensions.length?.unit).toBe("m");
    }
    const result1 = lines[1]?.result;
    expect(result1?.type).toBe("quantity");
    if (result1?.type === "quantity") {
      expect(result1.value).toBe(100);
      expect(result1.dimensions.length?.unit).toBe("m");
    }

    // Reassign with different unit
    engine.insertLine(2);
    engine.updateLine(2, "dist = 5 km");
    engine.insertLine(3);
    engine.updateLine(3, "dist");

    lines = engine.getLines();
    const result2 = lines[2]?.result;
    expect(result2?.type).toBe("quantity");
    if (result2?.type === "quantity") {
      expect(result2.value).toBe(5);
      expect(result2.dimensions.length?.unit).toBe("km");
    }
    const result3 = lines[3]?.result;
    expect(result3?.type).toBe("quantity");
    if (result3?.type === "quantity") {
      expect(result3.value).toBe(5);
      expect(result3.dimensions.length?.unit).toBe("km");
    }
  });
});
