import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Partial Application", () => {
  describe("basic partial application", () => {
    test("partial application with user-defined function", () => {
      const env = new Map();
      evaluate("add(a, b) = a + b", env);
      evaluate("add3 = add(3)", env);
      const result = evaluate("add3(5)", env);

      expect(result).toEqual({ type: "number", value: 8 });
    });

    test("partial application with multiple parameters", () => {
      const env = new Map();
      evaluate("sum3(a, b, c) = a + b + c", env);
      evaluate("sum3_10 = sum3(10)", env);
      evaluate("sum3_10_20 = sum3_10(20)", env);
      const result = evaluate("sum3_10_20(30)", env);

      expect(result).toEqual({ type: "number", value: 60 });
    });

    test("partial application with lambda", () => {
      const env = new Map();
      evaluate("multiply = (a, b) => a * b", env);
      evaluate("double = multiply(2)", env);
      const result = evaluate("double(5)", env);

      expect(result).toEqual({ type: "number", value: 10 });
    });
  });

  describe("partial application with pipe operator", () => {
    test("user function with pipe operator", () => {
      const env = new Map();
      evaluate("multiply(a, b) = a * b", env);
      const result = evaluate("5 | multiply(2)", env);

      expect(result).toEqual({ type: "number", value: 10 });
    });

    test("clamp function with partial application", () => {
      const env = new Map();
      evaluate(
        "clamp(min, max, value) = value < min ? min : (value > max ? max : value)",
        env
      );
      evaluate("clamp0to10 = clamp(0, 10)", env);

      const result1 = evaluate("15 | clamp0to10", env);
      expect(result1).toEqual({ type: "number", value: 10 });

      const result2 = evaluate("-5 | clamp0to10", env);
      expect(result2).toEqual({ type: "number", value: 0 });

      const result3 = evaluate("5 | clamp0to10", env);
      expect(result3).toEqual({ type: "number", value: 5 });
    });

    test("partial application in array operations", () => {
      const env = new Map();
      evaluate("multiply(a, b) = a * b", env);
      evaluate("triple = multiply(3)", env);
      const result = evaluate("[1, 2, 3] | map(triple)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        const values = result.value.map((v) =>
          v.type === "number" ? v.value : null
        );
        expect(values).toEqual([3, 6, 9]);
      }
    });
  });

  describe("complex partial application scenarios", () => {
    test("creating specialized functions", () => {
      const env = new Map();
      evaluate("power(base, exp) = base ^ exp", env);
      // Create a lambda that calls power with exp=2
      evaluate("square = (x) => power(x, 2)", env);

      const result = evaluate("square(5)", env);
      expect(result).toEqual({ type: "number", value: 25 });

      // Test with partial application in reverse order
      evaluate("pow2(exp, base) = base ^ exp", env);
      evaluate("square2 = pow2(2)", env); // Partial application with exp=2
      const result2 = evaluate("square2(5)", env);
      expect(result2).toEqual({ type: "number", value: 25 });
    });

    test("partial application with string functions", () => {
      const env = new Map();
      evaluate('greet(greeting, name) = greeting + ", " + name + "!"', env);
      evaluate('sayHello = greet("Hello")', env);

      const result = evaluate('sayHello("World")', env);
      expect(result).toEqual({ type: "string", value: "Hello, World!" });
    });

    test("partial application with units", () => {
      const env = new Map();
      evaluate("convert(value, targetUnit) = value to targetUnit", env);
      evaluate("toMeters = (v) => v to m", env); // Direct conversion is cleaner

      const result = evaluate("toMeters(100 cm)", env);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(1);
      }
    });
  });

  describe("partial application with higher-order functions", () => {
    test("filter with partially applied predicate", () => {
      const env = new Map();
      evaluate("between(min, max, value) = value >= min and value <= max", env);
      evaluate("between0and10 = between(0, 10)", env);
      const result = evaluate(
        "[-5, 0, 5, 10, 15] | filter(between0and10)",
        env
      );

      expect(result.type).toBe("array");
      if (result.type === "array") {
        const values = result.value.map((v) =>
          v.type === "number" ? v.value : null
        );
        expect(values).toEqual([0, 5, 10]);
      }
    });

    test("map with partially applied transformation", () => {
      const env = new Map();
      evaluate("add(a, b) = a + b", env);
      evaluate("increment = add(1)", env);
      const result = evaluate("[1, 2, 3] | map(increment)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        const values = result.value.map((v) =>
          v.type === "number" ? v.value : null
        );
        expect(values).toEqual([2, 3, 4]);
      }
    });

    test("reduce with partially applied reducer", () => {
      const env = new Map();
      // Since reduce needs exactly 2 params, we can't partially apply it directly
      // But we can create specialized reducers
      evaluate("multiply(a, b) = a * b", env);
      const result = evaluate("[1, 2, 3, 4] | reduce(multiply, 1)", env);

      expect(result).toEqual({ type: "number", value: 24 });
    });
  });

  describe("error handling", () => {
    test("too many arguments after partial application", () => {
      const env = new Map();
      evaluate("add(a, b) = a + b", env);
      evaluate("add5 = add(5)", env);

      expect(() => evaluate("add5(10, 20)", env)).toThrow(
        "add expects 2 arguments, got 3"
      );
    });

    test("partial of partial", () => {
      const env = new Map();
      evaluate("sum4(a, b, c, d) = a + b + c + d", env);
      evaluate("partial1 = sum4(1)", env);
      evaluate("partial2 = partial1(2)", env);
      evaluate("partial3 = partial2(3)", env);
      const result = evaluate("partial3(4)", env);

      expect(result).toEqual({ type: "number", value: 10 });
    });
  });

  describe("partial application display", () => {
    test("partial function value representation", () => {
      const env = new Map();
      evaluate("add(a, b) = a + b", env);
      const partial = evaluate("add(5)", env);

      expect(partial.type).toBe("partial");
      if (partial.type === "partial") {
        expect(partial.value.remainingParams).toEqual(["b"]);
        expect(partial.value.appliedArgs).toHaveLength(1);
        expect(partial.value.appliedArgs[0]).toEqual({
          type: "number",
          value: 5,
        });
      }
    });
  });
});
