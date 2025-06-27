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
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.value).toBe(expectedValue);

      // Determine the dimension based on the unit
      if (
        expectedUnit === "USD" ||
        expectedUnit === "EUR" ||
        expectedUnit === "GBP"
      ) {
        expect(result.dimensions.currency?.code).toBe(expectedUnit);
      } else if (expectedUnit === "kg" || expectedUnit === "kilograms") {
        expect(result.dimensions.mass?.unit).toBe(expectedUnit);
      } else if (expectedUnit === "m" || expectedUnit === "meters") {
        expect(result.dimensions.length?.unit).toBe(expectedUnit);
      } else if (expectedUnit === "l") {
        expect(result.dimensions.volume?.unit).toBe(expectedUnit);
      }
    }
  });

  test.each([
    ["1d+1h", 1.041_666_666_666_666_7, "d"],
    ["2kg+500g", 2.5, "kg"],
    ["5m+20cm", 5.2, "m"],
  ])("compound expression: %s", (expression, expectedValue, expectedUnit) => {
    const result = evaluate(expression, new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.value).toBeCloseTo(expectedValue);

      // Determine the dimension based on the unit
      if (expectedUnit === "d") {
        expect(result.dimensions.time?.unit).toBe(expectedUnit);
      } else if (expectedUnit === "kg") {
        expect(result.dimensions.mass?.unit).toBe(expectedUnit);
      } else if (expectedUnit === "m") {
        expect(result.dimensions.length?.unit).toBe(expectedUnit);
      }
    }
  });

  test.each([
    ["1e5", 100_000, undefined],
    ["1.5e10", 15_000_000_000, undefined],
    ["2e-3", 0.002, undefined],
  ])("scientific notation: %s", (expression, expectedValue, _expectedUnit) => {
    const result = evaluate(expression, new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value).toBe(expectedValue);
    }
  });
});
