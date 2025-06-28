import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Dimensionless Results", () => {
  test("unit/same unit returns dimensionless number", () => {
    const result1 = evaluate("1kg/kg", new Map());
    expect(result1.type).toBe("number");
    if (result1.type === "number") {
      expect(fromDecimal(result1.value)).toBe(1);
    }

    const result2 = evaluate("5m/m", new Map());
    expect(result2.type).toBe("number");
    if (result2.type === "number") {
      expect(fromDecimal(result2.value)).toBe(5);
    }

    const result3 = evaluate("10s/s", new Map());
    expect(result3.type).toBe("number");
    if (result3.type === "number") {
      expect(fromDecimal(result3.value)).toBe(10);
    }
  });

  test("compound units that cancel completely", () => {
    const vars = new Map();

    // kg*m / (kg*m)
    evaluate("force = 100kg*m", vars);
    evaluate("divisor = 20kg*m", vars);
    const result = evaluate("force / divisor", vars);

    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(5);
    }
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
