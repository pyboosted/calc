import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal, toDecimal } from "../src/utils/decimal-math";

describe("Dimension Cancellation in Multiplication", () => {
  test("frequency * time = dimensionless count", () => {
    const result = evaluate("1s^-1 * 1min", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(60);
    }
  });

  test("frequency * time with same units", () => {
    const result = evaluate("1s^-1 * 60s", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(60);
    }
  });

  test("velocity * time = distance", () => {
    const vars = new Map();
    evaluate("v = 10m/s", vars);
    const result = evaluate("v * 5s", vars);
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(50);
      expect(result.dimensions).toEqual({
        length: { exponent: 1, unit: "m" },
      });
    }
  });

  test("flow rate * time = mass", () => {
    const vars = new Map();
    evaluate("flow = 5kg/s", vars);
    const result = evaluate("flow * 10s", vars);
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(50);
      expect(result.dimensions).toEqual({
        mass: { exponent: 1, unit: "kg" },
      });
    }
  });

  test("acceleration * time = velocity", () => {
    const vars = new Map();
    evaluate("a = 10m/s^2", vars);
    const result = evaluate("a * 5s", vars);
    expect(result).toEqual({
      type: "quantity",
      value: toDecimal(50),
      dimensions: {
        length: { exponent: 1, unit: "m" },
        time: { exponent: -1, unit: "s" },
      },
    });
  });

  test("different time units cancel correctly", () => {
    const vars = new Map();
    evaluate("rate = 120min^-1", vars); // 120 per minute
    const result = evaluate("rate * 1h", vars); // should be 7200
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(7200);
    }
  });
});
