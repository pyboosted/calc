import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Variable Reassignment", () => {
  test("should reassign variable values correctly", () => {
    const variables = new Map();

    // First assignment
    const result1 = evaluate("a = 1", variables);
    expect(result1.value).toBe(1);
    expect(variables.get("a")?.value).toBe(1);

    // Check variable value
    const check1 = evaluate("a", variables);
    expect(check1.value).toBe(1);

    // Reassign variable
    const result2 = evaluate("a = 2", variables);
    expect(result2.value).toBe(2);
    expect(variables.get("a")?.value).toBe(2);

    // Check variable value after reassignment
    const check2 = evaluate("a", variables);
    expect(check2.value).toBe(2);
  });

  test("should handle multiple reassignments", () => {
    const variables = new Map();

    evaluate("x = 10", variables);
    expect(evaluate("x", variables).value).toBe(10);

    evaluate("x = 20", variables);
    expect(evaluate("x", variables).value).toBe(20);

    evaluate("x = 30", variables);
    expect(evaluate("x", variables).value).toBe(30);
  });

  test("should handle reassignment with expressions", () => {
    const variables = new Map();

    evaluate("a = 5", variables);
    evaluate("b = 10", variables);

    // Reassign using expression
    evaluate("a = b + 5", variables);
    expect(evaluate("a", variables).value).toBe(15);

    // Reassign b
    evaluate("b = a * 2", variables);
    expect(evaluate("b", variables).value).toBe(30);
    expect(evaluate("a", variables).value).toBe(15); // a should remain unchanged
  });

  test("should handle reassignment with units", () => {
    const variables = new Map();

    evaluate("dist = 100 m", variables);
    const distResult1 = evaluate("dist", variables);
    expect(distResult1.type).toBe("quantity");
    if (distResult1.type === "quantity") {
      expect(distResult1.value).toBe(100);
      expect(distResult1.dimensions.length?.unit).toBe("m");
    }

    evaluate("dist = 5 km", variables);
    const distResult2 = evaluate("dist", variables);
    expect(distResult2.type).toBe("quantity");
    if (distResult2.type === "quantity") {
      expect(distResult2.value).toBe(5);
      expect(distResult2.dimensions.length?.unit).toBe("km");
    }
  });
});
