import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal, toDecimal } from "../src/utils/decimal-math";

describe("Basic Arithmetic", () => {
  test.each([
    ["2 + 2", 4, "addition"],
    ["10 - 5", 5, "subtraction"],
    ["3 * 4", 12, "multiplication"],
    ["20 / 4", 5, "division"],
    ["2 ^ 3", 8, "exponentiation"],
    ["10 % 3", 1, "modulo"],
  ])("%s (%s)", (expression, expected, _operation) => {
    const result = evaluate(expression, new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(expected);
    }
  });
});

describe("Mathematical Functions", () => {
  test.each([
    ["sqrt(16)", 4],
    ["abs(-5)", 5],
    ["round(3.14159)", 3],
    ["ceil(3.1)", 4],
    ["floor(3.9)", 3],
  ])("%s", (expression, expected) => {
    const result = evaluate(expression, new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(expected);
    }
  });
});

describe("Percentage Calculations", () => {
  test.each([
    ["20%", 20, "percentage" as const],
    ["100 + 10%", 110, "number" as const],
    ["100 - 10%", 90, "number" as const],
    ["20% of 100", 20, "number" as const],
  ])("%s", (expression, expectedValue, expectedType) => {
    const result = evaluate(expression, new Map());
    expect(result.type).toBe(expectedType);
    if (result.type === "number" || result.type === "percentage") {
      expect(fromDecimal(result.value)).toBe(expectedValue);
    }
  });
});

describe("Variables", () => {
  test("variable assignment and usage", () => {
    const vars = new Map();
    const result1 = evaluate("x = 10", vars);
    expect(result1.type).toBe("number");
    if (result1.type === "number") {
      expect(fromDecimal(result1.value)).toBe(10);
    }

    const result2 = evaluate("x + 5", vars);
    expect(result2.type).toBe("number");
    if (result2.type === "number") {
      expect(fromDecimal(result2.value)).toBe(15);
    }
  });

  test("prev variable with value", () => {
    const vars = new Map([
      ["prev", { type: "number" as const, value: toDecimal(42) }],
    ]);
    const result = evaluate("prev * 2", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(84);
    }
  });

  test("prev variable without value throws error", () => {
    const vars = new Map();
    expect(() => evaluate("prev", vars)).toThrow("Unknown variable: prev");
  });
});

describe("Inline Comments", () => {
  test.each([
    ["2 + 3 # this is a comment", 5, "number" as const],
    ["5 * 4 # multiply five by four", 20, "number" as const],
    ["10 + 5 # 10 + 5 = 15", 15, "number" as const],
    ["100 - 10% # apply discount", 90, "number" as const],
    ["sqrt(16) # square root of 16", 4, "number" as const],
    [
      "2 * 3 # result: 6! (factorial notation in comment)",
      6,
      "number" as const,
    ],
    ["5 m # five meters", 5, "quantity" as const],
  ])("%s", (expression, expectedValue, expectedType) => {
    const result = evaluate(expression, new Map());
    expect(result.type).toBe(expectedType);
    if (result.type === "number" || result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(expectedValue);
    }
    if (expectedType === "quantity" && result.type === "quantity") {
      expect(result.dimensions.length?.unit).toBe("m");
    }
  });

  test("variable assignment with comment", () => {
    const vars = new Map();
    const result = evaluate("price = 100 # base price", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(100);
    }
    const priceValue = vars.get("price");
    expect(priceValue?.value && fromDecimal(priceValue.value)).toBe(100);
  });
});
