import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";
import { fromDecimal, toDecimal } from "../src/utils/decimal-math";

describe("Lambda Functions", () => {
  const variables = new Map<string, CalculatedValue>();

  function evaluateExpression(expr: string): CalculatedValue {
    return evaluate(expr, variables);
  }

  describe("Lambda Syntax", () => {
    test("single parameter lambda", () => {
      const result = evaluateExpression("map([1, 2, 3], x => x * 2)");
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(2),
        });
        expect(result.value[1]).toEqual({
          type: "number",
          value: toDecimal(4),
        });
        expect(result.value[2]).toEqual({
          type: "number",
          value: toDecimal(6),
        });
      }
    });

    test("multiple parameter lambda with parentheses", () => {
      const result = evaluateExpression(
        "sort([3, 1, 4, 1, 5], (a, b) => a - b)"
      );
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(5);
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(1),
        });
        expect(result.value[1]).toEqual({
          type: "number",
          value: toDecimal(1),
        });
        expect(result.value[2]).toEqual({
          type: "number",
          value: toDecimal(3),
        });
        expect(result.value[3]).toEqual({
          type: "number",
          value: toDecimal(4),
        });
        expect(result.value[4]).toEqual({
          type: "number",
          value: toDecimal(5),
        });
      }
    });

    test("lambda with property access", () => {
      evaluateExpression(
        'data = [{name: "Alice", age: 30}, {name: "Bob", age: 25}]'
      );
      const result = evaluateExpression("map(data, p => p.age)");
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(30),
        });
        expect(result.value[1]).toEqual({
          type: "number",
          value: toDecimal(25),
        });
      }
    });

    test("lambda stored in variable", () => {
      evaluateExpression("double = x => x * 2");
      const result = evaluateExpression("map([1, 2, 3], double)");
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(2),
        });
        expect(result.value[1]).toEqual({
          type: "number",
          value: toDecimal(4),
        });
        expect(result.value[2]).toEqual({
          type: "number",
          value: toDecimal(6),
        });
      }
    });
  });

  describe("filter function", () => {
    test("filter positive numbers", () => {
      const result = evaluateExpression(
        "filter([1, -2, 3, -4, 5], n => n > 0)"
      );
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(1),
        });
        expect(result.value[1]).toEqual({
          type: "number",
          value: toDecimal(3),
        });
        expect(result.value[2]).toEqual({
          type: "number",
          value: toDecimal(5),
        });
      }
    });

    test("filter with boolean expression", () => {
      const result = evaluateExpression(
        'filter(["", "hello", "", "world"], s => s)'
      );
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]).toEqual({ type: "string", value: "hello" });
        expect(result.value[1]).toEqual({ type: "string", value: "world" });
      }
    });

    test("filter objects by property", () => {
      evaluateExpression(
        'people = [{name: "Alice", age: 30}, {name: "Bob", age: 17}, {name: "Charlie", age: 25}]'
      );
      const result = evaluateExpression("filter(people, p => p.age >= 18)");
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(2);
      }
    });
  });

  describe("map function", () => {
    test("map numbers", () => {
      const result = evaluateExpression("map([1, 2, 3], x => x * x)");
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(1),
        });
        expect(result.value[1]).toEqual({
          type: "number",
          value: toDecimal(4),
        });
        expect(result.value[2]).toEqual({
          type: "number",
          value: toDecimal(9),
        });
      }
    });

    test("map strings", () => {
      const result = evaluateExpression('map(["hello", "world"], s => len(s))');
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(5),
        });
        expect(result.value[1]).toEqual({
          type: "number",
          value: toDecimal(5),
        });
      }
    });

    test("map with type conversion", () => {
      const result = evaluateExpression("map([1, 2, 3], n => n as string)");
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({ type: "string", value: "1" });
        expect(result.value[1]).toEqual({ type: "string", value: "2" });
        expect(result.value[2]).toEqual({ type: "string", value: "3" });
      }
    });
  });

  describe("reduce function", () => {
    test("sum numbers", () => {
      const result = evaluateExpression(
        "reduce([1, 2, 3, 4], (acc, n) => acc + n, 0)"
      );
      expect(result).toEqual({ type: "number", value: toDecimal(10) });
    });

    test("product of numbers", () => {
      const result = evaluateExpression(
        "reduce([2, 3, 4], (acc, n) => acc * n, 1)"
      );
      expect(result).toEqual({ type: "number", value: toDecimal(24) });
    });

    test("concatenate strings", () => {
      const result = evaluateExpression(
        'reduce(["a", "b", "c"], (acc, s) => acc + s, "")'
      );
      expect(result).toEqual({ type: "string", value: "abc" });
    });

    test("find maximum", () => {
      const result = evaluateExpression(
        "reduce([3, 7, 2, 9, 1], (acc, n) => n > acc ? n : acc, 0)"
      );
      expect(result).toEqual({ type: "number", value: toDecimal(9) });
    });

    test("count true values", () => {
      const result = evaluateExpression(
        "reduce([true, false, true, true], (acc, b) => b ? acc + 1 : acc, 0)"
      );
      expect(result).toEqual({ type: "number", value: toDecimal(3) });
    });
  });

  describe("sort function", () => {
    test("sort numbers ascending", () => {
      const result = evaluateExpression(
        "sort([3, 1, 4, 1, 5, 9], (a, b) => a - b)"
      );
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(6);
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(1),
        });
        expect(result.value[1]).toEqual({
          type: "number",
          value: toDecimal(1),
        });
        expect(result.value[2]).toEqual({
          type: "number",
          value: toDecimal(3),
        });
        expect(result.value[3]).toEqual({
          type: "number",
          value: toDecimal(4),
        });
        expect(result.value[4]).toEqual({
          type: "number",
          value: toDecimal(5),
        });
        expect(result.value[5]).toEqual({
          type: "number",
          value: toDecimal(9),
        });
      }
    });

    test("sort numbers descending", () => {
      const result = evaluateExpression(
        "sort([3, 1, 4, 1, 5], (a, b) => b - a)"
      );
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(5);
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(5),
        });
        expect(result.value[1]).toEqual({
          type: "number",
          value: toDecimal(4),
        });
        expect(result.value[2]).toEqual({
          type: "number",
          value: toDecimal(3),
        });
        expect(result.value[3]).toEqual({
          type: "number",
          value: toDecimal(1),
        });
        expect(result.value[4]).toEqual({
          type: "number",
          value: toDecimal(1),
        });
      }
    });

    test("sort strings", () => {
      const result = evaluateExpression(
        'sort(["banana", "apple", "cherry"], (a, b) => a > b ? 1 : a < b ? -1 : 0)'
      );
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({ type: "string", value: "apple" });
        expect(result.value[1]).toEqual({ type: "string", value: "banana" });
        expect(result.value[2]).toEqual({ type: "string", value: "cherry" });
      }
    });

    test("sort by absolute value", () => {
      const result = evaluateExpression(
        "sort([-3, 1, -4, 2], (a, b) => abs(a) - abs(b))"
      );
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(4);
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(1),
        });
        expect(result.value[1]).toEqual({
          type: "number",
          value: toDecimal(2),
        });
        expect(result.value[2]).toEqual({
          type: "number",
          value: toDecimal(-3),
        });
        expect(result.value[3]).toEqual({
          type: "number",
          value: toDecimal(-4),
        });
      }
    });

    test("sort objects by property", () => {
      evaluateExpression(
        'people = [{name: "Bob", age: 30}, {name: "Alice", age: 25}, {name: "Charlie", age: 35}]'
      );
      const result = evaluateExpression(
        "sort(people, (a, b) => a.age - b.age)"
      );
      expect(result.type).toBe("array");
      if (result.type === "array" && result.value[0]?.type === "object") {
        const age0 = result.value[0].value.get("age");
        expect(age0?.type).toBe("number");
        if (age0?.type === "number") {
          expect(fromDecimal(age0.value)).toBe(25);
        }

        if (result.value[1]?.type === "object") {
          const age1 = result.value[1].value.get("age");
          expect(age1?.type).toBe("number");
          if (age1?.type === "number") {
            expect(fromDecimal(age1.value)).toBe(30);
          }
        }

        if (result.value[2]?.type === "object") {
          const age2 = result.value[2].value.get("age");
          expect(age2?.type).toBe("number");
          if (age2?.type === "number") {
            expect(fromDecimal(age2.value)).toBe(35);
          }
        }
      }
    });
  });

  describe("groupBy function", () => {
    test("group by string property", () => {
      evaluateExpression(
        'items = [{cat: "A", val: 1}, {cat: "B", val: 2}, {cat: "A", val: 3}]'
      );
      const result = evaluateExpression("groupBy(items, item => item.cat)");
      expect(result.type).toBe("object");
      if (result.type === "object") {
        expect(result.value.size).toBe(2);

        const groupA = result.value.get("A");
        expect(groupA?.type).toBe("array");
        if (groupA?.type === "array") {
          expect(groupA.value).toHaveLength(2);
        }

        const groupB = result.value.get("B");
        expect(groupB?.type).toBe("array");
        if (groupB?.type === "array") {
          expect(groupB.value).toHaveLength(1);
        }
      }
    });

    test("group by numeric property", () => {
      evaluateExpression(
        "scores = [{team: 1, score: 10}, {team: 2, score: 20}, {team: 1, score: 15}]"
      );
      const result = evaluateExpression("groupBy(scores, s => s.team)");
      expect(result.type).toBe("object");
      if (result.type === "object") {
        expect(result.value.size).toBe(2);
        expect(result.value.has("1")).toBe(true);
        expect(result.value.has("2")).toBe(true);
      }
    });

    test("group by boolean result", () => {
      const result = evaluateExpression(
        "groupBy([1, 2, 3, 4, 5], n => n % 2 == 0)"
      );
      expect(result.type).toBe("object");
      if (result.type === "object") {
        expect(result.value.size).toBe(2);
        expect(result.value.has("true")).toBe(true);
        expect(result.value.has("false")).toBe(true);
      }
    });
  });

  describe("Lambda in user functions", () => {
    test("lambda stored in variable and called directly", () => {
      evaluateExpression("a = i => i + 1");
      const result = evaluateExpression("a(5)");
      expect(result).toEqual({ type: "number", value: toDecimal(6) });
    });

    test("lambda with multiple params stored in variable", () => {
      evaluateExpression("add = (a, b) => a + b");
      const result = evaluateExpression("add(3, 4)");
      expect(result).toEqual({ type: "number", value: toDecimal(7) });
    });

    test("lambda passed as parameter to user function", () => {
      evaluateExpression("do(a, pred) = pred(a)");
      evaluateExpression("inc = i => i + 1");
      const result = evaluateExpression("do(5, inc)");
      expect(result).toEqual({ type: "number", value: toDecimal(6) });
    });

    test("user function with lambda parameter", () => {
      evaluateExpression(
        "any(arr, pred) = reduce(arr, (acc, i) => acc or pred(i), false)"
      );
      const result = evaluateExpression("any([1, 2, 3], n => n > 2)");
      expect(result).toEqual({ type: "boolean", value: true });
    });

    test("all function implementation", () => {
      evaluateExpression(
        "all(arr, pred) = reduce(arr, (acc, i) => acc and pred(i), true)"
      );
      const result1 = evaluateExpression("all([2, 4, 6], n => n % 2 == 0)");
      expect(result1).toEqual({ type: "boolean", value: true });

      const result2 = evaluateExpression("all([2, 3, 6], n => n % 2 == 0)");
      expect(result2).toEqual({ type: "boolean", value: false });
    });

    test("find function implementation", () => {
      evaluateExpression("find(arr, pred) = first(filter(arr, pred))");
      const result = evaluateExpression("find([1, 2, 3, 4], n => n > 2)");
      expect(result).toEqual({ type: "number", value: toDecimal(3) });
    });

    test("sortDescending helper", () => {
      evaluateExpression("sortDesc(arr) = sort(arr, (a, b) => b - a)");
      const result = evaluateExpression("sortDesc([3, 1, 4, 1, 5])");
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value[0]).toEqual({
          type: "number",
          value: toDecimal(5),
        });
        expect(result.value[4]).toEqual({
          type: "number",
          value: toDecimal(1),
        });
      }
    });
  });

  describe("Complex lambda expressions", () => {
    test("nested property access", () => {
      evaluateExpression(
        'data = [{user: {name: "Alice", age: 30}}, {user: {name: "Bob", age: 25}}]'
      );
      const result = evaluateExpression("map(data, d => d.user.name)");
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value[0]).toEqual({ type: "string", value: "Alice" });
        expect(result.value[1]).toEqual({ type: "string", value: "Bob" });
      }
    });

    test("lambda with ternary operator", () => {
      const result = evaluateExpression(
        'map([1, 2, 3, 4], n => n % 2 == 0 ? "even" : "odd")'
      );
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value[0]).toEqual({ type: "string", value: "odd" });
        expect(result.value[1]).toEqual({ type: "string", value: "even" });
        expect(result.value[2]).toEqual({ type: "string", value: "odd" });
        expect(result.value[3]).toEqual({ type: "string", value: "even" });
      }
    });

    test("lambda with math functions", () => {
      const result = evaluateExpression(
        "map([0, 30, 45, 60, 90], angle => sin(angle))"
      );
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(5);
        expect(result.value[0]?.type).toBe("number");
      }
    });

    test("chained operations", () => {
      const result = evaluateExpression(
        "reduce(filter(map([1, 2, 3, 4], n => n * n), n => n > 5), (acc, n) => acc + n, 0)"
      );
      expect(result).toEqual({ type: "number", value: toDecimal(25) }); // 9 + 16
    });
  });

  describe("Error handling", () => {
    test("filter with non-lambda", () => {
      expect(() => evaluateExpression("filter([1, 2, 3], 42)")).toThrow(
        "Second argument to filter must be a function or lambda"
      );
    });

    test("map with non-array", () => {
      expect(() => evaluateExpression("map(42, x => x * 2)")).toThrow(
        "First argument to map must be an array"
      );
    });

    test("lambda with wrong parameter count", () => {
      expect(() => evaluateExpression("sort([1, 2, 3], x => x)")).toThrow(
        "Sort comparator must take exactly two parameters"
      );
    });

    test("sort comparator returning non-number", () => {
      expect(() =>
        evaluateExpression('sort([1, 2, 3], (a, b) => "hello")')
      ).toThrow("Sort comparator must return a number");
    });

    test("groupBy with invalid key type", () => {
      evaluateExpression("items = [{data: [1, 2]}, {data: [3, 4]}]");
      expect(() =>
        evaluateExpression("groupBy(items, item => item.data)")
      ).toThrow("Cannot use array as groupBy key");
    });
  });
});
