import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

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
    expect(result.value).toBe(expected);
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
    expect(result.value).toBe(expected);
  });
});

describe("Percentage Calculations", () => {
  test.each([
    ["20%", 20, "%"],
    ["100 + 10%", 110, undefined],
    ["100 - 10%", 90, undefined],
    ["20% of 100", 20, undefined],
  ])("%s", (expression, expectedValue, expectedUnit) => {
    const result = evaluate(expression, new Map());
    expect(result.value).toBe(expectedValue);
    if (expectedUnit !== undefined) {
      expect(result.type === "number" && result.unit).toBe(expectedUnit);
    }
  });
});

describe("Variables", () => {
  test("variable assignment and usage", () => {
    const vars = new Map();
    const result1 = evaluate("x = 10", vars);
    expect(result1.value).toBe(10);

    const result2 = evaluate("x + 5", vars);
    expect(result2.value).toBe(15);
  });

  test("prev variable with value", () => {
    const vars = new Map([["prev", { type: "number" as const, value: 42 }]]);
    const result = evaluate("prev * 2", vars);
    expect(result.value).toBe(84);
  });

  test("prev variable without value throws error", () => {
    const vars = new Map();
    expect(() => evaluate("prev", vars)).toThrow("Unknown variable: prev");
  });
});

describe("Inline Comments", () => {
  test.each([
    ["2 + 3 # this is a comment", 5, undefined],
    ["5 * 4 # multiply five by four", 20, undefined],
    ["10 + 5 # 10 + 5 = 15", 15, undefined],
    ["100 - 10% # apply discount", 90, undefined],
    ["sqrt(16) # square root of 16", 4, undefined],
    ["2 * 3 # result: 6! (factorial notation in comment)", 6, undefined],
    ["5 m # five meters", 5, "m"],
  ])("%s", (expression, expectedValue, expectedUnit) => {
    const result = evaluate(expression, new Map());
    expect(result.value).toBe(expectedValue);
    if (expectedUnit !== undefined) {
      expect(result.type === "number" && result.unit).toBe(expectedUnit);
    }
  });

  test("variable assignment with comment", () => {
    const vars = new Map();
    const result = evaluate("price = 100 # base price", vars);
    expect(result.value).toBe(100);
    const priceValue = vars.get("price");
    expect(priceValue?.value).toBe(100);
  });
});
