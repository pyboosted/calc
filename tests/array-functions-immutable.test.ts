import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Immutable Array Functions", () => {
  describe("push - non-mutating", () => {
    test("push returns new array with added element", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);
      const result = evaluate("push(arr, 4)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(4);
        expect(result.value[3]?.value).toBe(4);
      }

      // Original array should be unchanged
      const original = evaluate("arr", env);
      expect(original.type).toBe("array");
      if (original.type === "array") {
        expect(original.value.length).toBe(3);
      }
    });

    test("push can add multiple elements", () => {
      const env = new Map();
      const result = evaluate("push([1, 2], 3, 4, 5)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(5);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
      }
    });

    test("push works with different types", () => {
      const env = new Map();
      const result = evaluate('push([1], "hello", true)', env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(3);
        expect(result.value[0]?.value).toBe(1);
        expect(result.value[1]?.value).toBe("hello");
        expect(result.value[2]?.value).toBe(true);
      }
    });
  });

  describe("pop - non-mutating", () => {
    test("pop returns new array without last element", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);
      const result = evaluate("pop(arr)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(2);
        expect(result.value.map((v) => v.value)).toEqual([1, 2]);
      }

      // Original array should be unchanged
      const original = evaluate("arr", env);
      expect(original.type).toBe("array");
      if (original.type === "array") {
        expect(original.value.length).toBe(3);
      }
    });

    test("pop on empty array returns empty array", () => {
      const env = new Map();
      const result = evaluate("pop([])", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(0);
      }
    });

    test("pop on single element array returns empty array", () => {
      const env = new Map();
      const result = evaluate("pop([42])", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(0);
      }
    });
  });

  describe("find function", () => {
    test("find returns first matching element", () => {
      const env = new Map();
      const result = evaluate("find([1, 5, 10, 15], x => x > 7)", env);

      expect(result.type).toBe("number");
      expect(result.value).toBe(10);
    });

    test("find returns null when no match", () => {
      const env = new Map();
      const result = evaluate("find([1, 2, 3], x => x > 10)", env);

      expect(result.type).toBe("null");
    });

    test("find works with objects", () => {
      const env = new Map();
      evaluate(
        'users = [{name: "Alice", age: 25}, {name: "Bob", age: 30}]',
        env
      );
      const result = evaluate('find(users, u => u.name == "Bob")', env);

      expect(result.type).toBe("object");
      if (result.type === "object") {
        expect(result.value.get("name")?.value).toBe("Bob");
        expect(result.value.get("age")?.value).toBe(30);
      }
    });

    test("find with complex predicate", () => {
      const env = new Map();
      const result = evaluate(
        'find(["", "hello", "", "world"], s => len(s) > 0)',
        env
      );

      expect(result.type).toBe("string");
      expect(result.value).toBe("hello");
    });

    test("find uses truthiness", () => {
      const env = new Map();
      const result = evaluate('find([0, "", false, null, 5], x => x)', env);

      expect(result.type).toBe("number");
      expect(result.value).toBe(5);
    });
  });

  describe("findIndex function", () => {
    test("findIndex returns index of first matching element", () => {
      const env = new Map();
      const result = evaluate("findIndex([10, 20, 30, 40], x => x > 25)", env);

      expect(result.type).toBe("number");
      expect(result.value).toBe(2); // index of 30
    });

    test("findIndex returns -1 when no match", () => {
      const env = new Map();
      const result = evaluate("findIndex([1, 2, 3], x => x > 10)", env);

      expect(result.type).toBe("number");
      expect(result.value).toBe(-1);
    });

    test("findIndex works with strings", () => {
      const env = new Map();
      const result = evaluate('findIndex(["a", "b", "c"], s => s == "b")', env);

      expect(result.type).toBe("number");
      expect(result.value).toBe(1);
    });

    test("findIndex finds first occurrence", () => {
      const env = new Map();
      const result = evaluate("findIndex([1, 5, 3, 5, 2], x => x == 5)", env);

      expect(result.type).toBe("number");
      expect(result.value).toBe(1); // first 5 is at index 1
    });

    test("findIndex with empty array", () => {
      const env = new Map();
      const result = evaluate("findIndex([], x => true)", env);

      expect(result.type).toBe("number");
      expect(result.value).toBe(-1);
    });
  });

  describe("Compound assignment with immutable arrays", () => {
    test("+= still mutates for arrays", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);
      evaluate("arr += [4, 5]", env);

      const result = evaluate("arr", env);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(5);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
      }
    });

    test("-= still mutates for arrays", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3, 2, 4]", env);
      evaluate("arr -= 2", env);

      const result = evaluate("arr", env);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(3);
        expect(result.value.map((v) => v.value)).toEqual([1, 3, 4]);
      }
    });
  });

  describe("Error handling", () => {
    test("find requires lambda as second argument", () => {
      const env = new Map();
      expect(() => evaluate("find([1, 2, 3], 5)", env)).toThrow(
        "Second argument to find must be a lambda function"
      );
    });

    test("findIndex requires lambda as second argument", () => {
      const env = new Map();
      expect(() => evaluate("findIndex([1, 2, 3], true)", env)).toThrow(
        "Second argument to findIndex must be a lambda function"
      );
    });

    test("find/findIndex predicate must take 1 parameter", () => {
      const env = new Map();
      expect(() => evaluate("find([1, 2], (a, b) => a + b)", env)).toThrow(
        "find predicate must take exactly 1 parameter"
      );
      expect(() => evaluate("findIndex([1, 2], (a, b) => a + b)", env)).toThrow(
        "findIndex predicate must take exactly 1 parameter"
      );
    });
  });
});
