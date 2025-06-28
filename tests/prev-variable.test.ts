import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Prev Variable", () => {
  test("prev references the previous line result", () => {
    const vars = new Map();

    // Line 1: 10
    const result1 = evaluate("10", vars);
    expect(result1.type).toBe("number");
    if (result1.type === "number") {
      expect(fromDecimal(result1.value)).toBe(10);
    }

    // Line 2: prev * 2 (should be 10 * 2 = 20)
    vars.set("prev", result1);
    const result2 = evaluate("prev * 2", vars);
    expect(result2.type).toBe("number");
    if (result2.type === "number") {
      expect(fromDecimal(result2.value)).toBe(20);
    }

    // Line 3: prev + 5 (should be 20 + 5 = 25)
    vars.set("prev", result2);
    const result3 = evaluate("prev + 5", vars);
    expect(result3.type).toBe("number");
    if (result3.type === "number") {
      expect(fromDecimal(result3.value)).toBe(25);
    }
  });

  test("prev throws error when not available", () => {
    const vars = new Map();

    // First line trying to use prev should fail
    expect(() => evaluate("prev", vars)).toThrow("Unknown variable: prev");
  });

  test("prev with comment lines", () => {
    const vars = new Map();

    // Line 1: 100
    const result1 = evaluate("100", vars);
    expect(result1.type).toBe("number");
    if (result1.type === "number") {
      expect(fromDecimal(result1.value)).toBe(100);
    }

    // Line 2: comment (would be an error in real app, skipped)
    // Line 3: empty line (skipped)

    // Line 4: prev / 2 (should still use result from line 1 = 50)
    vars.set("prev", result1);
    const result4 = evaluate("prev / 2", vars);
    expect(result4.type).toBe("number");
    if (result4.type === "number") {
      expect(fromDecimal(result4.value)).toBe(50);
    }
  });
});
