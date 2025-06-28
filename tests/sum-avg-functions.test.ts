import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";
import { fromDecimal, toDecimal } from "../src/utils/decimal-math";

describe("Sum and Average Functions", () => {
  describe("sum function", () => {
    test("should sum numbers in array", () => {
      const result = evaluate("sum([1, 2, 3, 4, 5])", new Map());
      expect(result.type).toBe("number");
      if (result.type === "number") {
        expect(fromDecimal(result.value)).toBe(15);
      }
    });

    test("should work with pipe operator", () => {
      const vars = new Map<string, CalculatedValue>();
      evaluate("arr = [10, 20, 30]", vars);
      const result = evaluate("arr | sum", vars);
      expect(result.type).toBe("number");
      if (result.type === "number") {
        expect(fromDecimal(result.value)).toBe(60);
      }
    });

    test("should sum quantities with units", () => {
      const result = evaluate("sum([10m, 20m, 30m])", new Map());
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(fromDecimal(result.value)).toBe(60);
        expect(result.dimensions.length?.unit).toBe("m");
      }
    });

    test("should handle mixed compatible units", () => {
      const result = evaluate("sum([1m, 100cm, 1000mm])", new Map());
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(fromDecimal(result.value)).toBe(3); // All converted to meters
        expect(result.dimensions.length?.unit).toBe("m");
      }
    });

    test("should skip non-numeric values", () => {
      const result = evaluate('sum([1, "hello", 2, true, 3])', new Map());
      expect(result.type).toBe("number");
      expect(result.type).toBe("number");
      if (result.type === "number") {
        expect(fromDecimal(result.value)).toBe(6); // Only sums 1, 2, 3
      }
    });

    test("should return 0 for empty array", () => {
      const result = evaluate("sum([])", new Map());
      expect(result.type).toBe("number");
      if (result.type === "number") {
        expect(fromDecimal(result.value)).toBe(0);
      }
    });
  });

  describe("avg/average function", () => {
    test("should average numbers in array", () => {
      const result = evaluate("avg([10, 20, 30])", new Map());
      expect(result.type).toBe("number");
      if (result.type === "number") {
        expect(fromDecimal(result.value)).toBe(20);
      }
    });

    test("should work with 'average' alias", () => {
      const result = evaluate("average([10, 20, 30])", new Map());
      expect(result.type).toBe("number");
      if (result.type === "number") {
        expect(fromDecimal(result.value)).toBe(20);
      }
    });

    test("should work with pipe operator", () => {
      const vars = new Map<string, CalculatedValue>();
      evaluate("arr = [100, 200, 300]", vars);
      const result = evaluate("arr | avg", vars);
      expect(result.type).toBe("number");
      if (result.type === "number") {
        expect(fromDecimal(result.value)).toBe(200);
      }
    });

    test("should average quantities with units", () => {
      const result = evaluate("avg([10kg, 20kg, 30kg])", new Map());
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(fromDecimal(result.value)).toBe(20);
        expect(result.dimensions.mass?.unit).toBe("kg");
      }
    });

    test("should handle mixed compatible units", () => {
      const result = evaluate("avg([1000g, 2kg, 3000g])", new Map());
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(fromDecimal(result.value)).toBe(2000); // Average is 2000g (first unit is used)
        expect(result.dimensions.mass?.unit).toBe("g");
      }
    });

    test("should skip non-numeric values", () => {
      const result = evaluate('avg([10, "skip", 20, false, 30])', new Map());
      expect(result.type).toBe("number");
      if (result.type === "number") {
        expect(fromDecimal(result.value)).toBe(20);
      } // Average of 10, 20, 30
    });

    test("should return null for empty array", () => {
      const result = evaluate("avg([])", new Map());
      expect(result.type).toBe("null");
      expect(result.value).toBe(null);
    });

    test("should return null for array with no numeric values", () => {
      const result = evaluate('avg(["a", "b", true])', new Map());
      expect(result.type).toBe("null");
      expect(result.value).toBe(null);
    });
  });

  describe("aggregate with pipe operator", () => {
    test("agg | sum should work for multi-line aggregation", () => {
      const vars = new Map<string, CalculatedValue>();
      const context = { previousResults: [] as CalculatedValue[] };

      // Simulate multi-line calculation
      context.previousResults.push({ type: "number", value: toDecimal(5) });
      context.previousResults.push({ type: "number", value: toDecimal(10) });
      context.previousResults.push({ type: "number", value: toDecimal(15) });

      // Use agg keyword with pipe to sum
      const sum = evaluate("agg | sum", vars, context);
      expect(sum.type).toBe("number");
      expect(sum.type).toBe("number");
      if (sum.type === "number") {
        expect(fromDecimal(sum.value)).toBe(30);
      }
    });

    test("agg | avg should work for multi-line aggregation", () => {
      const vars = new Map<string, CalculatedValue>();
      const context = { previousResults: [] as CalculatedValue[] };

      // Simulate multi-line calculation
      context.previousResults.push({ type: "number", value: toDecimal(5) });
      context.previousResults.push({ type: "number", value: toDecimal(10) });
      context.previousResults.push({ type: "number", value: toDecimal(15) });

      // Use agg keyword with pipe to average
      const avg = evaluate("agg | avg", vars, context);
      expect(avg.type).toBe("number");
      expect(avg.type).toBe("number");
      if (avg.type === "number") {
        expect(fromDecimal(avg.value)).toBe(10);
      }
    });
  });
});
