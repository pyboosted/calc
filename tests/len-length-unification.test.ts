import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("len and length unification", () => {
  describe("strings", () => {
    test("length works with strings", () => {
      const result = evaluate('length("hello")', new Map());
      expect(result.value).toBe(5);
    });

    test("len works with strings", () => {
      const result = evaluate('len("hello")', new Map());
      expect(result.value).toBe(5);
    });

    test("length and len give same result for strings", () => {
      const env = new Map();
      const lengthResult = evaluate('length("test string")', env);
      const lenResult = evaluate('len("test string")', env);
      expect(lengthResult.value).toBe(lenResult.value);
      expect(lengthResult.value).toBe(11);
    });

    test("works with empty strings", () => {
      const env = new Map();
      const lengthResult = evaluate('length("")', env);
      const lenResult = evaluate('len("")', env);
      expect(lengthResult.value).toBe(0);
      expect(lenResult.value).toBe(0);
    });
  });

  describe("arrays", () => {
    test("length works with arrays", () => {
      const result = evaluate("length([1, 2, 3, 4, 5])", new Map());
      expect(result.value).toBe(5);
    });

    test("len works with arrays", () => {
      const result = evaluate("len([1, 2, 3, 4, 5])", new Map());
      expect(result.value).toBe(5);
    });

    test("length and len give same result for arrays", () => {
      const env = new Map();
      const lengthResult = evaluate('length(["a", "b", "c"])', env);
      const lenResult = evaluate('len(["a", "b", "c"])', env);
      expect(lengthResult.value).toBe(lenResult.value);
      expect(lengthResult.value).toBe(3);
    });

    test("works with empty arrays", () => {
      const env = new Map();
      const lengthResult = evaluate("length([])", env);
      const lenResult = evaluate("len([])", env);
      expect(lengthResult.value).toBe(0);
      expect(lenResult.value).toBe(0);
    });

    test("works with nested arrays", () => {
      const env = new Map();
      const lengthResult = evaluate("length([[1, 2], [3, 4], [5]])", env);
      const lenResult = evaluate("len([[1, 2], [3, 4], [5]])", env);
      expect(lengthResult.value).toBe(3);
      expect(lenResult.value).toBe(3);
    });
  });

  describe("objects", () => {
    test("length works with objects", () => {
      const result = evaluate("length({a: 1, b: 2, c: 3})", new Map());
      expect(result.value).toBe(3);
    });

    test("len works with objects", () => {
      const result = evaluate("len({a: 1, b: 2, c: 3})", new Map());
      expect(result.value).toBe(3);
    });

    test("length and len give same result for objects", () => {
      const env = new Map();
      const lengthResult = evaluate("length({x: 10, y: 20})", env);
      const lenResult = evaluate("len({x: 10, y: 20})", env);
      expect(lengthResult.value).toBe(lenResult.value);
      expect(lengthResult.value).toBe(2);
    });

    test("works with empty objects", () => {
      const env = new Map();
      const lengthResult = evaluate("length({})", env);
      const lenResult = evaluate("len({})", env);
      expect(lengthResult.value).toBe(0);
      expect(lenResult.value).toBe(0);
    });
  });

  describe("with variables", () => {
    test("works with string variables", () => {
      const env = new Map();
      evaluate('text = "hello world"', env);
      const result = evaluate("length(text)", env);
      expect(result.value).toBe(11);

      const env2 = new Map();
      evaluate('text = "hello world"', env2);
      const result2 = evaluate("len(text)", env2);
      expect(result2.value).toBe(11);
    });

    test("works with array variables", () => {
      const env = new Map();
      evaluate("arr = [10, 20, 30, 40]", env);
      const result = evaluate("length(arr)", env);
      expect(result.value).toBe(4);

      const env2 = new Map();
      evaluate("arr = [10, 20, 30, 40]", env2);
      const result2 = evaluate("len(arr)", env2);
      expect(result2.value).toBe(4);
    });

    test("works with object variables", () => {
      const env = new Map();
      evaluate('obj = {name: "John", age: 30, city: "NYC"}', env);
      const result = evaluate("length(obj)", env);
      expect(result.value).toBe(3);

      const env2 = new Map();
      evaluate('obj = {name: "John", age: 30, city: "NYC"}', env2);
      const result2 = evaluate("len(obj)", env2);
      expect(result2.value).toBe(3);
    });
  });

  describe("pipe operator", () => {
    test("works with pipe operator for strings", () => {
      const env = new Map();
      const lengthResult = evaluate('"hello" | length', env);
      const lenResult = evaluate('"hello" | len', env);
      expect(lengthResult.value).toBe(5);
      expect(lenResult.value).toBe(5);
    });

    test("works with pipe operator for arrays", () => {
      const env = new Map();
      const lengthResult = evaluate("[1, 2, 3] | length", env);
      const lenResult = evaluate("[1, 2, 3] | len", env);
      expect(lengthResult.value).toBe(3);
      expect(lenResult.value).toBe(3);
    });

    test("works with pipe operator for objects", () => {
      const env = new Map();
      const lengthResult = evaluate("{a: 1, b: 2} | length", env);
      const lenResult = evaluate("{a: 1, b: 2} | len", env);
      expect(lengthResult.value).toBe(2);
      expect(lenResult.value).toBe(2);
    });
  });

  describe("error handling", () => {
    test("both functions require exactly 1 argument", () => {
      const env = new Map();
      expect(() => evaluate("length()", env)).toThrow();
      expect(() => evaluate("len()", env)).toThrow();
      expect(() => evaluate('length("a", "b")', env)).toThrow();
      expect(() => evaluate('len("a", "b")', env)).toThrow();
    });

    test("both functions reject invalid types", () => {
      const env = new Map();
      expect(() => evaluate("length(5)", env)).toThrow();
      expect(() => evaluate("len(5)", env)).toThrow();
      expect(() => evaluate("length(true)", env)).toThrow();
      expect(() => evaluate("len(true)", env)).toThrow();
      expect(() => evaluate("length(null)", env)).toThrow();
      expect(() => evaluate("len(null)", env)).toThrow();
    });
  });
});
