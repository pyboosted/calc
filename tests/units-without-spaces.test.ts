import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Units Without Spaces", () => {
  test.each([
    // Currency codes
    ["10usd", 10, "USD"],
    ["10eur", 10, "EUR"],
    ["25.50gbp", 25.5, "GBP"],
    // Unit abbreviations
    ["5kg", 5, "kg"],
    ["10m", 10, "m"],
    ["3.5l", 3.5, "l"],
    // Full unit names
    ["10meters", 10, "meters"],
    ["5kilograms", 5, "kilograms"],
    // Units starting with 'e'
    ["10eur", 10, "EUR"],
  ])("parses %s correctly", (expression, expectedValue, expectedUnit) => {
    const result = evaluate(expression, new Map());
    expect(result.value).toBe(expectedValue);
    expect(result.type === "number" && result.unit).toBe(expectedUnit);
  });

  test.each([
    ["1d+1h", 1.041_666_666_666_666_7, "d"],
    ["2kg+500g", 2.5, "kg"],
    ["5m+20cm", 5.2, "m"],
  ])("compound expression: %s", (expression, expectedValue, expectedUnit) => {
    const result = evaluate(expression, new Map());
    expect(result.value).toBeCloseTo(expectedValue);
    expect(result.type === "number" && result.unit).toBe(expectedUnit);
  });

  test.each([
    ["1e5", 100_000, undefined],
    ["1.5e10", 15_000_000_000, undefined],
    ["2e-3", 0.002, undefined],
  ])("scientific notation: %s", (expression, expectedValue, expectedUnit) => {
    const result = evaluate(expression, new Map());
    expect(result.value).toBe(expectedValue);
    if (expectedUnit !== undefined) {
      expect(result.type === "number" && result.unit).toBe(expectedUnit);
    } else {
      expect(result.type === "number" && result.unit).toBeUndefined();
    }
  });
});
