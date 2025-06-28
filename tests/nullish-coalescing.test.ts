import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("nullish coalescing operator (??)", () => {
  describe("basic functionality", () => {
    test("returns right operand when left is null", () => {
      const result = evaluate("null ?? 42", new Map());
      expect(result).toEqual({ type: "number", value: 42 });
    });

    test("returns left operand when left is not null", () => {
      const result = evaluate("10 ?? 42", new Map());
      expect(result).toEqual({ type: "number", value: 10 });
    });

    test("works with zero (not nullish)", () => {
      const result = evaluate("0 ?? 42", new Map());
      expect(result).toEqual({ type: "number", value: 0 });
    });

    test("works with false (not nullish)", () => {
      const result = evaluate("false ?? true", new Map());
      expect(result).toEqual({ type: "boolean", value: false });
    });

    test("works with empty string (not nullish)", () => {
      const result = evaluate('"" ?? "default"', new Map());
      expect(result).toEqual({ type: "string", value: "" });
    });
  });

  describe("with variables", () => {
    test("returns default when variable is null", () => {
      const env = new Map();
      evaluate("x = null", env);
      const result = evaluate("x ?? 100", env);
      expect(result).toEqual({ type: "number", value: 100 });
    });

    test("returns variable value when not null", () => {
      const env = new Map();
      evaluate("x = 0", env);
      const result = evaluate("x ?? 100", env);
      expect(result).toEqual({ type: "number", value: 0 });
    });

    test("works with undefined variables (which evaluate to null)", () => {
      const env = new Map();
      expect(() => evaluate("undefinedVar ?? 42", env)).toThrow();
    });
  });

  describe("chaining", () => {
    test("chains multiple ?? operators left to right", () => {
      const result = evaluate("null ?? null ?? 42", new Map());
      expect(result).toEqual({ type: "number", value: 42 });
    });

    test("stops at first non-null value", () => {
      const result = evaluate("null ?? 10 ?? 42", new Map());
      expect(result).toEqual({ type: "number", value: 10 });
    });
  });

  describe("with other operators", () => {
    test("has same precedence as ||", () => {
      // Should parse as (null ?? 0) || 42, not null ?? (0 || 42)
      const result = evaluate("null ?? 0 || 42", new Map());
      expect(result).toEqual({ type: "number", value: 42 });
    });

    test("works in ternary expressions", () => {
      const result = evaluate("true ? null ?? 10 : 20", new Map());
      expect(result).toEqual({ type: "number", value: 10 });
    });

    test("works with arithmetic", () => {
      const result = evaluate("(null ?? 5) * 2", new Map());
      expect(result).toEqual({ type: "number", value: 10 });
    });
  });

  describe("with different types", () => {
    test("works with arrays", () => {
      const env = new Map();
      evaluate("arr = null", env);
      const result = evaluate("arr ?? [1, 2, 3]", env);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
      }
    });

    test("works with objects", () => {
      const env = new Map();
      evaluate("obj = null", env);
      const result = evaluate("obj ?? {a: 1, b: 2}", env);
      expect(result.type).toBe("object");
      if (result.type === "object") {
        expect(result.value.get("a")).toEqual({
          type: "number",
          value: 1,
        });
      }
    });

    test("works with strings", () => {
      const result = evaluate('null ?? "hello"', new Map());
      expect(result).toEqual({ type: "string", value: "hello" });
    });

    test("works with dates", () => {
      const env = new Map();
      evaluate("d = null", env);
      const result = evaluate("d ?? today", env);
      expect(result.type).toBe("date");
    });
  });

  describe("comparison with || operator", () => {
    test("|| treats 0 as falsy, ?? does not", () => {
      const orResult = evaluate("0 || 42", new Map());
      const nullishResult = evaluate("0 ?? 42", new Map());

      expect(orResult).toEqual({ type: "number", value: 42 });
      expect(nullishResult).toEqual({ type: "number", value: 0 });
    });

    test("|| treats false as falsy, ?? does not", () => {
      const orResult = evaluate("false || true", new Map());
      const nullishResult = evaluate("false ?? true", new Map());

      expect(orResult).toEqual({ type: "boolean", value: true });
      expect(nullishResult).toEqual({ type: "boolean", value: false });
    });

    test("|| treats empty string as falsy, ?? does not", () => {
      const orResult = evaluate('"" || "default"', new Map());
      const nullishResult = evaluate('"" ?? "default"', new Map());

      expect(orResult).toEqual({ type: "string", value: "default" });
      expect(nullishResult).toEqual({ type: "string", value: "" });
    });

    test("both treat null the same way", () => {
      const orResult = evaluate("null || 42", new Map());
      const nullishResult = evaluate("null ?? 42", new Map());

      expect(orResult).toEqual({ type: "number", value: 42 });
      expect(nullishResult).toEqual({ type: "number", value: 42 });
    });
  });

  describe("real-world use cases", () => {
    test("default values for configuration", () => {
      const env = new Map();
      evaluate("config = {timeout: 5000}", env);
      const result = evaluate("config.maxRetries ?? 3", env);
      expect(result).toEqual({ type: "number", value: 3 });
    });

    test("fallback for array access", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);
      const result = evaluate("arr[10] ?? 0", env);
      expect(result).toEqual({ type: "number", value: 0 });
    });

    test("chained defaults", () => {
      const env = new Map();
      evaluate("userPref = null", env);
      evaluate("defaultPref = null", env);
      evaluate("systemDefault = 100", env);
      const result = evaluate("userPref ?? defaultPref ?? systemDefault", env);
      expect(result).toEqual({ type: "number", value: 100 });
    });
  });
});
