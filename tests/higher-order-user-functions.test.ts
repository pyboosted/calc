import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Higher-order functions with user-defined functions", () => {
  describe("filter with user-defined functions", () => {
    test("filter with simple predicate function", () => {
      const env = new Map();
      evaluate("isPositive(n) = n > 0", env);
      const result = evaluate("[-2, -1, 0, 1, 2] | filter(isPositive)", env);

      expect(result.type).toBe("array");
      expect((result as any).value).toHaveLength(2);
      expect((result as any).value[0]).toEqual({ type: "number", value: 1 });
      expect((result as any).value[1]).toEqual({ type: "number", value: 2 });
    });

    test("filter with more complex predicate", () => {
      const env = new Map();
      evaluate("isEven(n) = n % 2 == 0", env);
      const result = evaluate("[1, 2, 3, 4, 5, 6] | filter(isEven)", env);

      expect(result.type).toBe("array");
      expect((result as any).value).toHaveLength(3);
      expect((result as any).value[0]).toEqual({ type: "number", value: 2 });
      expect((result as any).value[1]).toEqual({ type: "number", value: 4 });
      expect((result as any).value[2]).toEqual({ type: "number", value: 6 });
    });

    test("filter with string predicate", () => {
      const env = new Map();
      evaluate("isLong(s) = len(s) > 3", env);
      const result = evaluate(
        '["hi", "hello", "bye", "world"] | filter(isLong)',
        env
      );

      expect(result.type).toBe("array");
      expect((result as any).value).toHaveLength(2);
      expect((result as any).value[0]).toEqual({
        type: "string",
        value: "hello",
      });
      expect((result as any).value[1]).toEqual({
        type: "string",
        value: "world",
      });
    });
  });

  describe("map with user-defined functions", () => {
    test("map with simple transformation", () => {
      const env = new Map();
      evaluate("double(x) = x * 2", env);
      const result = evaluate("[1, 2, 3] | map(double)", env);

      expect(result.type).toBe("array");
      expect((result as any).value).toHaveLength(3);
      expect((result as any).value[0]).toEqual({ type: "number", value: 2 });
      expect((result as any).value[1]).toEqual({ type: "number", value: 4 });
      expect((result as any).value[2]).toEqual({ type: "number", value: 6 });
    });

    test("map with square function", () => {
      const env = new Map();
      evaluate("square(x) = x * x", env);
      const result = evaluate("[1, 2, 3, 4] | map(square)", env);

      expect(result.type).toBe("array");
      expect((result as any).value).toHaveLength(4);
      expect((result as any).value[0]).toEqual({ type: "number", value: 1 });
      expect((result as any).value[1]).toEqual({ type: "number", value: 4 });
      expect((result as any).value[2]).toEqual({ type: "number", value: 9 });
      expect((result as any).value[3]).toEqual({ type: "number", value: 16 });
    });

    test("map with string transformation", () => {
      const env = new Map();
      evaluate('exclaim(s) = s + "!"', env);
      const result = evaluate('["hello", "world"] | map(exclaim)', env);

      expect(result.type).toBe("array");
      expect((result as any).value).toHaveLength(2);
      expect((result as any).value[0]).toEqual({
        type: "string",
        value: "hello!",
      });
      expect((result as any).value[1]).toEqual({
        type: "string",
        value: "world!",
      });
    });
  });

  describe("reduce with user-defined functions", () => {
    test("reduce with add function", () => {
      const env = new Map();
      evaluate("add(a, b) = a + b", env);
      const result = evaluate("[1, 2, 3, 4] | reduce(add, 0)", env);

      expect(result).toEqual({ type: "number", value: 10 });
    });

    test("reduce with multiply function", () => {
      const env = new Map();
      evaluate("multiply(a, b) = a * b", env);
      const result = evaluate("[1, 2, 3, 4] | reduce(multiply, 1)", env);

      expect(result).toEqual({ type: "number", value: 24 });
    });

    test("reduce with string concatenation", () => {
      const env = new Map();
      evaluate('concat(a, b) = a + ", " + b', env);
      const result = evaluate('["a", "b", "c"] | reduce(concat, "")', env);

      expect(result).toEqual({ type: "string", value: ", a, b, c" });
    });
  });

  describe("sort with user-defined functions", () => {
    test("sort with number comparator", () => {
      const env = new Map();
      evaluate("compareNumbers(a, b) = a - b", env);
      const result = evaluate("[3, 1, 4, 1, 5] | sort(compareNumbers)", env);

      expect(result.type).toBe("array");
      const values = (result as any).value.map((v: any) => v.value);
      expect(values).toEqual([1, 1, 3, 4, 5]);
    });

    test("sort in descending order", () => {
      const env = new Map();
      evaluate("descending(a, b) = b - a", env);
      const result = evaluate("[3, 1, 4, 1, 5] | sort(descending)", env);

      expect(result.type).toBe("array");
      const values = (result as any).value.map((v: any) => v.value);
      expect(values).toEqual([5, 4, 3, 1, 1]);
    });
  });

  describe("groupBy with user-defined functions", () => {
    test("groupBy with modulo function", () => {
      const env = new Map();
      evaluate("parity(n) = n % 2 == 0 ? 'even' : 'odd'", env);
      const result = evaluate("[1, 2, 3, 4, 5, 6] | groupBy(parity)", env);

      expect(result.type).toBe("object");
      const obj = result as any;

      const odd = obj.value.get("odd");
      expect(odd.type).toBe("array");
      expect(odd.value).toHaveLength(3);

      const even = obj.value.get("even");
      expect(even.type).toBe("array");
      expect(even.value).toHaveLength(3);
    });

    test("groupBy with string length", () => {
      const env = new Map();
      evaluate("lengthGroup(s) = len(s)", env);
      const result = evaluate(
        '["a", "bb", "ccc", "dd", "e"] | groupBy(lengthGroup)',
        env
      );

      expect(result.type).toBe("object");
      const obj = result as any;

      expect(obj.value.get("1").value).toHaveLength(2); // "a", "e"
      expect(obj.value.get("2").value).toHaveLength(2); // "bb", "dd"
      expect(obj.value.get("3").value).toHaveLength(1); // "ccc"
    });
  });

  describe("combining user functions with lambdas", () => {
    test("filter with user function then map with lambda", () => {
      const env = new Map();
      evaluate("isPositive(n) = n > 0", env);
      const result = evaluate(
        "[-2, -1, 0, 1, 2] | filter(isPositive) | map(x => x * x)",
        env
      );

      expect(result.type).toBe("array");
      expect((result as any).value).toHaveLength(2);
      expect((result as any).value[0]).toEqual({ type: "number", value: 1 });
      expect((result as any).value[1]).toEqual({ type: "number", value: 4 });
    });

    test("map with lambda then filter with user function", () => {
      const env = new Map();
      evaluate("isEven(n) = n % 2 == 0", env);
      const result = evaluate(
        "[1, 2, 3, 4] | map(x => x * 2) | filter(isEven)",
        env
      );

      expect(result.type).toBe("array");
      expect((result as any).value).toHaveLength(4); // All doubled values are even
    });
  });

  describe("error handling", () => {
    test("filter with wrong parameter count", () => {
      const env = new Map();
      evaluate("wrongParams(a, b) = a > b", env);
      expect(() => evaluate("[1, 2, 3] | filter(wrongParams)", env)).toThrow(
        "Filter predicate must take exactly one parameter"
      );
    });

    test("map with wrong parameter count", () => {
      const env = new Map();
      evaluate("wrongParams() = 42", env);
      expect(() => evaluate("[1, 2, 3] | map(wrongParams)", env)).toThrow(
        "Map transform must take exactly one parameter"
      );
    });

    test("reduce with wrong parameter count", () => {
      const env = new Map();
      evaluate("wrongParams(a) = a", env);
      expect(() => evaluate("[1, 2, 3] | reduce(wrongParams, 0)", env)).toThrow(
        "Reduce function must take exactly two parameters"
      );
    });

    test("sort with wrong parameter count", () => {
      const env = new Map();
      evaluate("wrongParams(a) = a", env);
      expect(() => evaluate("[1, 2, 3] | sort(wrongParams)", env)).toThrow(
        "Sort comparator must take exactly two parameters"
      );
    });
  });
});
