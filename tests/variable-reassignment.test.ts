import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Variable Reassignment", () => {
  test("should reassign variable values correctly", () => {
    const variables = new Map();

    // First assignment
    const result1 = evaluate("a = 1", variables);
    expect(result1.type).toBe("number");
    if (result1.type === "number") {
      expect(fromDecimal(result1.value)).toBe(1);
    }
    const varA1 = variables.get("a");
    if (varA1?.type === "number") {
      expect(fromDecimal(varA1.value)).toBe(1);
    }

    // Check variable value
    const check1 = evaluate("a", variables);
    expect(check1.type).toBe("number");
    if (check1.type === "number") {
      expect(fromDecimal(check1.value)).toBe(1);
    }

    // Reassign variable
    const result2 = evaluate("a = 2", variables);
    expect(result2.type).toBe("number");
    if (result2.type === "number") {
      expect(fromDecimal(result2.value)).toBe(2);
    }
    const varA2 = variables.get("a");
    if (varA2?.type === "number") {
      expect(fromDecimal(varA2.value)).toBe(2);
    }

    // Check variable value after reassignment
    const check2 = evaluate("a", variables);
    expect(check2.type).toBe("number");
    if (check2.type === "number") {
      expect(fromDecimal(check2.value)).toBe(2);
    }
  });

  test("should handle multiple reassignments", () => {
    const variables = new Map();

    evaluate("x = 10", variables);
    const result = evaluate("x", variables);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(10);
    }

    evaluate("x = 20", variables);
    const result2 = evaluate("x", variables);
    expect(result2.type).toBe("number");
    if (result2.type === "number") {
      expect(fromDecimal(result2.value)).toBe(20);
    }

    evaluate("x = 30", variables);
    const result3 = evaluate("x", variables);
    expect(result3.type).toBe("number");
    if (result3.type === "number") {
      expect(fromDecimal(result3.value)).toBe(30);
    }
  });

  test("should handle reassignment with expressions", () => {
    const variables = new Map();

    evaluate("a = 5", variables);
    evaluate("b = 10", variables);

    // Reassign using expression
    evaluate("a = b + 5", variables);
    const result = evaluate("a", variables);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(15);
    }

    // Reassign b
    evaluate("b = a * 2", variables);
    const resultB = evaluate("b", variables);
    expect(resultB.type).toBe("number");
    if (resultB.type === "number") {
      expect(fromDecimal(resultB.value)).toBe(30);
    }
    const resultA = evaluate("a", variables);
    expect(resultA.type).toBe("number");
    if (resultA.type === "number") {
      expect(fromDecimal(resultA.value)).toBe(15);
    } // a should remain unchanged
  });

  test("should handle reassignment with units", () => {
    const variables = new Map();

    evaluate("dist = 100 m", variables);
    const distResult1 = evaluate("dist", variables);
    expect(distResult1.type).toBe("quantity");
    if (distResult1.type === "quantity") {
      expect(fromDecimal(distResult1.value)).toBe(100);
      expect(distResult1.dimensions.length?.unit).toBe("m");
    }

    evaluate("dist = 5 km", variables);
    const distResult2 = evaluate("dist", variables);
    expect(distResult2.type).toBe("quantity");
    if (distResult2.type === "quantity") {
      expect(fromDecimal(distResult2.value)).toBe(5);
      expect(distResult2.dimensions.length?.unit).toBe("km");
    }
  });
});
