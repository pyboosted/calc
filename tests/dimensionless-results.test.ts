import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Dimensionless Results", () => {
  test("unit/same unit returns dimensionless number", () => {
    expect(evaluate("1kg/kg", new Map())).toEqual({
      type: "number",
      value: 1,
    });

    expect(evaluate("5m/m", new Map())).toEqual({
      type: "number",
      value: 5,
    });

    expect(evaluate("10s/s", new Map())).toEqual({
      type: "number",
      value: 10,
    });
  });

  test("compound units that cancel completely", () => {
    const vars = new Map();

    // kg*m / (kg*m)
    evaluate("force = 100kg*m", vars);
    evaluate("divisor = 20kg*m", vars);
    const result = evaluate("force / divisor", vars);

    expect(result).toEqual({
      type: "number",
      value: 5,
    });
  });

  test("no zero-exponent dimensions in output", () => {
    // This should not have any dimensions with exponent 0
    const result = evaluate("100kg*m/kg", new Map());

    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.dimensions).toEqual({
        length: { exponent: 1, unit: "m" },
      });

      // Ensure no mass dimension with exponent 0
      expect(result.dimensions.mass).toBeUndefined();
    }
  });
});
