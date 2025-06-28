import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";

describe("Sum and Average Functions", () => {
  describe("sum function", () => {
    test("should sum numbers in array", () => {
      const result = evaluate("sum([1, 2, 3, 4, 5])", new Map());
      expect(result.type).toBe("number");
      expect(result.value).toBe(15);
    });

    test("should work with pipe operator", () => {
      const vars = new Map<string, CalculatedValue>();
      evaluate("arr = [10, 20, 30]", vars);
      const result = evaluate("arr | sum", vars);
      expect(result.type).toBe("number");
      expect(result.value).toBe(60);
    });

    test("should sum quantities with units", () => {
      const result = evaluate("sum([10m, 20m, 30m])", new Map());
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(60);
        expect(result.dimensions.length?.unit).toBe("m");
      }
    });

    test("should handle mixed compatible units", () => {
      const result = evaluate("sum([1m, 100cm, 1000mm])", new Map());
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(3); // All converted to meters
        expect(result.dimensions.length?.unit).toBe("m");
      }
    });

    test("should skip non-numeric values", () => {
      const result = evaluate('sum([1, "hello", 2, true, 3])', new Map());
      expect(result.type).toBe("number");
      expect(result.value).toBe(6); // Only sums 1, 2, 3
    });

    test("should return 0 for empty array", () => {
      const result = evaluate("sum([])", new Map());
      expect(result.type).toBe("number");
      expect(result.value).toBe(0);
    });
  });

  describe("avg/average function", () => {
    test("should average numbers in array", () => {
      const result = evaluate("avg([10, 20, 30])", new Map());
      expect(result.type).toBe("number");
      expect(result.value).toBe(20);
    });

    test("should work with 'average' alias", () => {
      const result = evaluate("average([10, 20, 30])", new Map());
      expect(result.type).toBe("number");
      expect(result.value).toBe(20);
    });

    test("should work with pipe operator", () => {
      const vars = new Map<string, CalculatedValue>();
      evaluate("arr = [100, 200, 300]", vars);
      const result = evaluate("arr | avg", vars);
      expect(result.type).toBe("number");
      expect(result.value).toBe(200);
    });

    test("should average quantities with units", () => {
      const result = evaluate("avg([10kg, 20kg, 30kg])", new Map());
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(20);
        expect(result.dimensions.mass?.unit).toBe("kg");
      }
    });

    test("should handle mixed compatible units", () => {
      const result = evaluate("avg([1000g, 2kg, 3000g])", new Map());
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(2000); // Average is 2000g (first unit is used)
        expect(result.dimensions.mass?.unit).toBe("g");
      }
    });

    test("should skip non-numeric values", () => {
      const result = evaluate('avg([10, "skip", 20, false, 30])', new Map());
      expect(result.type).toBe("number");
      expect(result.value).toBe(20); // Average of 10, 20, 30
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

  describe("aggregate keyword compatibility", () => {
    test("sum keyword should work for multi-line aggregation", () => {
      const vars = new Map<string, CalculatedValue>();
      const context = { previousResults: [] as CalculatedValue[] };

      // Simulate multi-line calculation
      const result1 = evaluate("100", vars, context);
      context.previousResults.push(result1);

      const result2 = evaluate("200", vars, context);
      context.previousResults.push(result2);

      const result3 = evaluate("300", vars, context);
      context.previousResults.push(result3);

      // Use sum as aggregate keyword
      const sum = evaluate("sum", vars, context);
      expect(sum.type).toBe("number");
      expect(sum.value).toBe(600);
    });

    test("avg keyword should work for multi-line aggregation", () => {
      const vars = new Map<string, CalculatedValue>();
      const context = { previousResults: [] as CalculatedValue[] };

      // Simulate multi-line calculation
      const result1 = evaluate("10", vars, context);
      context.previousResults.push(result1);

      const result2 = evaluate("20", vars, context);
      context.previousResults.push(result2);

      const result3 = evaluate("30", vars, context);
      context.previousResults.push(result3);

      // Use avg as aggregate keyword
      const avg = evaluate("avg", vars, context);
      expect(avg.type).toBe("number");
      expect(avg.value).toBe(20);
    });

    test("agg keyword with pipe should work", () => {
      const vars = new Map<string, CalculatedValue>();
      const context = { previousResults: [] as CalculatedValue[] };

      // Simulate multi-line calculation
      context.previousResults.push({ type: "number", value: 5 });
      context.previousResults.push({ type: "number", value: 10 });
      context.previousResults.push({ type: "number", value: 15 });

      // Use agg keyword with pipe
      const sum = evaluate("agg | sum", vars, context);
      expect(sum.type).toBe("number");
      expect(sum.value).toBe(30);

      const avg = evaluate("agg | avg", vars, context);
      expect(avg.type).toBe("number");
      expect(avg.value).toBe(10);
    });
  });
});
