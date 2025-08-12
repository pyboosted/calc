import { describe, expect, test } from "bun:test";
import type { DimensionMap } from "../src/evaluator/dimensions";
import { evaluate } from "../src/evaluator/evaluate";
import { formatQuantity } from "../src/evaluator/unit-formatter";
import { toDecimal } from "../src/utils/decimal-math";

// Regex for matching currency division results
const CURRENCY_DIVISION_REGEX = /^33\.333.*USD$/;

describe("Currency decimal formatting", () => {
  test("currency with decimals should preserve decimals when precision is undefined", () => {
    const dimensions: DimensionMap = {
      currency: { exponent: 1, code: "USD" },
    };

    const result = formatQuantity(toDecimal(123.45), dimensions);
    expect(result).toBe("123.45 USD");
  });

  test("currency with decimals should work with explicit precision", () => {
    const dimensions: DimensionMap = {
      currency: { exponent: 1, code: "USD" },
    };

    const result = formatQuantity(toDecimal(123.45), dimensions, 2);
    expect(result).toBe("123.45 USD");
  });

  test("currency with more decimals than precision should round correctly", () => {
    const dimensions: DimensionMap = {
      currency: { exponent: 1, code: "EUR" },
    };

    const result = formatQuantity(toDecimal(123.456), dimensions, 2);
    expect(result).toBe("123.46 EUR");
  });

  test("whole number currencies should not show unnecessary decimals", () => {
    const dimensions: DimensionMap = {
      currency: { exponent: 1, code: "USD" },
    };

    const result = formatQuantity(toDecimal(100), dimensions);
    expect(result).toBe("100 USD");
  });

  test("evaluate currency expressions preserve decimals", () => {
    const vars = new Map();

    const result = evaluate("123.45 USD", vars);
    expect(result.type).toBe("quantity");

    if (result.type === "quantity") {
      const formatted = formatQuantity(result.value, result.dimensions);
      expect(formatted).toBe("123.45 USD");
    }
  });

  test("currency arithmetic preserves appropriate precision", () => {
    const vars = new Map();

    // Test division that creates decimals
    const result = evaluate("100 USD / 3", vars);
    expect(result.type).toBe("quantity");

    if (result.type === "quantity") {
      const formatted = formatQuantity(result.value, result.dimensions);
      // Should show significant digits, not truncate to integer
      expect(formatted).toMatch(CURRENCY_DIVISION_REGEX);
    }
  });

  test("different currency codes work correctly", () => {
    const testCases = [
      { code: "USD", value: 12.34 },
      { code: "EUR", value: 56.78 },
      { code: "GBP", value: 90.12 },
    ];

    for (const testCase of testCases) {
      const dimensions: DimensionMap = {
        currency: { exponent: 1, code: testCase.code },
      };

      const result = formatQuantity(toDecimal(testCase.value), dimensions);
      expect(result).toBe(`${testCase.value} ${testCase.code}`);
    }
  });
});
