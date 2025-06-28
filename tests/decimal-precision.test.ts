import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal } from "../src/utils/decimal-math";

// Move regex patterns to top level for performance
const PRECISION_PATTERN_1_DIV_3 = /^0\.3333333333/;
const PRECISION_PATTERN_COMPOUND_INTEREST = /^1628\.894626777/;
const PRECISION_PATTERN_100_DIV_3 = /^33\.3333333/;

describe("Decimal.js Precision", () => {
  test("basic arithmetic with high precision", () => {
    const vars = new Map();

    // Classic floating point error: 0.1 + 0.2 = 0.30000000000000004 in JavaScript
    const result = evaluate("0.1 + 0.2", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(0.3);
      // The string representation should be exact
      expect(result.value.toString()).toBe("0.3");
    }
  });

  test("financial calculations maintain precision", () => {
    const vars = new Map();

    // $19.99 * 7.25% tax rate
    const result = evaluate("19.99 * 0.0725", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(1.449_275);
      expect(result.value.toString()).toBe("1.449275");
    }
  });

  test("division with repeating decimals", () => {
    const vars = new Map();

    // 1/3 should maintain precision
    const result = evaluate("1 / 3", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      // Check that we have high precision
      const strValue = result.value.toString();
      expect(strValue).toMatch(PRECISION_PATTERN_1_DIV_3);
      // Should have many 3s (at least 10)
      expect(strValue.length).toBeGreaterThan(10);
    }
  });

  test("large number calculations", () => {
    const vars = new Map();

    // Large numbers that would lose precision in JavaScript
    const result = evaluate("9007199254740992 + 1", vars); // MAX_SAFE_INTEGER + 1
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toString()).toBe("9007199254740993");
    }
  });

  test("very small number calculations", () => {
    const vars = new Map();

    const result = evaluate("0.0000000001 * 0.0000000001", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toString()).toBe("1e-20");
    }
  });

  test("compound interest calculation", () => {
    const vars = new Map();

    // Principal * (1 + rate)^time
    // $1000 * (1 + 0.05)^10 = compound interest for 10 years at 5%
    evaluate("principal = 1000", vars);
    evaluate("rate = 0.05", vars);
    evaluate("time = 10", vars);

    const result = evaluate("principal * (1 + rate)^time", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      // Should be exactly 1628.894626777442563443...
      expect(fromDecimal(result.value)).toBeCloseTo(1628.8946, 4);
      // Check we maintain more precision than JavaScript would
      expect(result.value.toString()).toMatch(
        PRECISION_PATTERN_COMPOUND_INTEREST
      );
    }
  });

  test("currency calculations with proper rounding", () => {
    const vars = new Map();

    // Split a bill 3 ways
    const result = evaluate("100 / 3", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      // Should maintain full precision
      const strValue = result.value.toString();
      expect(strValue).toMatch(PRECISION_PATTERN_100_DIV_3);
    }
  });

  test("percentage calculations maintain precision", () => {
    const vars = new Map();

    // 15.7% of $234.56
    const result = evaluate("234.56 * 0.157", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(36.825_92);
      expect(result.value.toString()).toBe("36.82592");
    }
  });

  test("chained calculations don't accumulate errors", () => {
    const vars = new Map();

    evaluate("x = 0.1", vars);
    evaluate("y = x + 0.2", vars);
    evaluate("z = y + 0.3", vars);
    evaluate("w = z + 0.4", vars);

    const result = evaluate("w", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(1.0);
      expect(result.value.toString()).toBe("1");
    }
  });

  test("scientific notation handling", () => {
    const vars = new Map();

    const result = evaluate("1.23e-10 + 4.56e-10", vars);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toString()).toBe("0.000000000579");
      expect(fromDecimal(result.value)).toBe(5.79e-10);
    }
  });
});
