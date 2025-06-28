import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";

function evalExpression(
  input: string,
  variables?: Map<string, CalculatedValue>
) {
  return evaluate(input, variables || new Map());
}

describe("Pipe Operator", () => {
  describe("Basic piping", () => {
    test("should pipe value to function", () => {
      const vars = new Map<string, CalculatedValue>();

      // First define the array
      evalExpression("arr = [1, 2, 3, 4, 5]", vars);

      // Test piping to length function
      const result = evalExpression("arr | length", vars);
      expect(result.type).toBe("number");
      expect(result.value).toBe(5);
    });

    test("should handle chained pipes", () => {
      const vars = new Map<string, CalculatedValue>();

      // Test with string operations
      evalExpression('text = "  hello world  "', vars);

      const result = evalExpression("text | trim | len", vars);
      expect(result.type).toBe("number");
      expect(result.value).toBe(11); // "hello world" is 11 characters
    });

    test("should pipe to function with additional arguments", () => {
      const vars = new Map<string, CalculatedValue>();

      // Define array and filter function
      evalExpression("arr = [1, 2, 3, 4, 5]", vars);

      // Define a lambda for filtering
      evalExpression("isGreaterThan3 = x => x > 3", vars);

      // Test piping with filter
      const result = evalExpression("arr | filter(isGreaterThan3)", vars);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]?.value).toBe(4);
        expect(result.value[1]?.value).toBe(5);
      }
    });

    test("should work with user-defined functions", () => {
      const vars = new Map<string, CalculatedValue>();

      // Define a user function
      evalExpression("double(x) = x * 2", vars);

      // Test piping to user function
      const result = evalExpression("5 | double", vars);
      expect(result.type).toBe("number");
      expect(result.value).toBe(10);
    });

    test("should maintain units through pipe", () => {
      const vars = new Map<string, CalculatedValue>();

      // Define a function that works with units
      evalExpression("toMeters(x) = x to m", vars);

      // Test piping with units
      const result = evalExpression("100 cm | toMeters", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(1);
        expect(result.dimensions.length?.unit).toBe("m");
      }
    });
  });

  describe("Error cases", () => {
    test("should error when piping to non-function", () => {
      const vars = new Map<string, CalculatedValue>();
      evalExpression("notAFunction = 42", vars);

      expect(() => evalExpression("5 | notAFunction", vars)).toThrow();
    });

    test("should error when piping to lambda directly", () => {
      expect(() => evalExpression("[1, 2, 3] | (x => x * 2)")).toThrow(
        "Piping to lambda expressions directly is not yet supported"
      );
    });

    test("should error when piping to invalid expression", () => {
      expect(() => evalExpression("5 | (2 + 3)")).toThrow("Cannot pipe to");
    });
  });

  describe("Operator precedence", () => {
    test("pipe should have lower precedence than arithmetic", () => {
      const vars = new Map<string, CalculatedValue>();
      evalExpression("double(x) = x * 2", vars);

      // 3 + 2 should be evaluated first, then piped
      const result = evalExpression("3 + 2 | double", vars);
      expect(result.type).toBe("number");
      expect(result.value).toBe(10); // (3 + 2) * 2 = 10
    });

    test("pipe should have higher precedence than comparison", () => {
      const vars = new Map<string, CalculatedValue>();
      evalExpression("double(x) = x * 2", vars);
      evalExpression("x = 5", vars);

      // x | double should be evaluated first, then compared
      const result = evalExpression("x | double == 10", vars);
      expect(result.type).toBe("boolean");
      expect(result.value).toBe(true);
    });
  });

  describe("Integration with higher-order functions", () => {
    test("should work with map", () => {
      const vars = new Map<string, CalculatedValue>();

      // Define array
      evalExpression("arr = [1, 2, 3]", vars);

      // Test piping to map with lambda
      const result = evalExpression("arr | map(x => x * x)", vars);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]?.value).toBe(1);
        expect(result.value[1]?.value).toBe(4);
        expect(result.value[2]?.value).toBe(9);
      }
    });

    test("should work with reduce", () => {
      const vars = new Map<string, CalculatedValue>();

      // Define array
      evalExpression("arr = [1, 2, 3, 4]", vars);

      // Test piping to reduce with lambda
      const result = evalExpression("arr | reduce((a, b) => a + b, 0)", vars);
      expect(result.type).toBe("number");
      expect(result.value).toBe(10);
    });
  });
});
