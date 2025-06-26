import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("String Functions", () => {
  test("len() returns string length", () => {
    const vars = new Map();
    const result = evaluate('len("Hello")', vars);
    expect(result).toEqual({ type: "number", value: 5 });
  });

  test("len() with empty string", () => {
    const vars = new Map();
    const result = evaluate('len("")', vars);
    expect(result).toEqual({ type: "number", value: 0 });
  });

  test("len() with variable", () => {
    const vars = new Map();
    evaluate('str = "Hello World"', vars);
    const result = evaluate("len(str)", vars);
    expect(result).toEqual({ type: "number", value: 11 });
  });

  test("substr() extracts substring", () => {
    const vars = new Map();
    const result = evaluate('substr("Hello World", 0, 5)', vars);
    expect(result).toEqual({ type: "string", value: "Hello" });
  });

  test("substr() from position to end", () => {
    const vars = new Map();
    const result = evaluate('substr("Hello World", 6)', vars);
    expect(result).toEqual({ type: "string", value: "World" });
  });

  test("substr() with negative start", () => {
    const vars = new Map();
    const result = evaluate('substr("Hello", -2, 2)', vars);
    expect(result).toEqual({ type: "string", value: "" }); // JavaScript substr behavior
  });

  test("charAt() returns character at index", () => {
    const vars = new Map();
    const result = evaluate('charat("Hello", 1)', vars);
    expect(result).toEqual({ type: "string", value: "e" });
  });

  test("charAt() with out of bounds index", () => {
    const vars = new Map();
    const result = evaluate('charat("Hello", 10)', vars);
    expect(result).toEqual({ type: "string", value: "" });
  });

  test("trim() removes whitespace", () => {
    const vars = new Map();
    const result = evaluate('trim("  Hello World  ")', vars);
    expect(result).toEqual({ type: "string", value: "Hello World" });
  });

  test("trim() with tabs and newlines", () => {
    const vars = new Map();
    const result = evaluate('trim("\tHello\t")', vars);
    expect(result).toEqual({ type: "string", value: "Hello" });
  });

  test("string functions with interpolation", () => {
    const vars = new Map();
    evaluate("name = `John`", vars);
    // biome-ignore lint/complexity/noUselessStringConcat: Testing string interpolation
    evaluate("padded = `  $" + "{name}  `", vars);
    const result = evaluate("trim(padded)", vars);
    expect(result).toEqual({ type: "string", value: "John" });
  });

  test("chaining string functions", () => {
    const vars = new Map();
    const result = evaluate('len(trim("  Hello  "))', vars);
    expect(result).toEqual({ type: "number", value: 5 });
  });

  test("substr with calculated indices", () => {
    const vars = new Map();
    evaluate("pos = 2", vars);
    evaluate("count = 3", vars);
    const result = evaluate('substr("Hello World", pos, count)', vars);
    expect(result).toEqual({ type: "string", value: "llo" });
  });

  test("error handling - len() with non-string", () => {
    const vars = new Map();
    expect(() => evaluate("len(123)", vars)).toThrow(
      "len() requires a string argument"
    );
  });

  test("error handling - substr() with non-string", () => {
    const vars = new Map();
    expect(() => evaluate("substr(123, 0)", vars)).toThrow(
      "First argument to substr() must be a string"
    );
  });

  test("error handling - charAt() with non-numeric index", () => {
    const vars = new Map();
    expect(() => evaluate('charat("Hello", "a")', vars)).toThrow(
      "Second argument to charAt() must be a number"
    );
  });
});

describe("String Aggregates", () => {
  test("total concatenates strings", () => {
    const vars = new Map();

    const previousResults = [
      { type: "string" as const, value: "Hello" },
      { type: "string" as const, value: " " },
      { type: "string" as const, value: "World" },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result).toEqual({ type: "string", value: "Hello World" });
  });

  test("sum as alias for total with strings", () => {
    const vars = new Map();

    const previousResults = [
      { type: "string" as const, value: "A" },
      { type: "string" as const, value: "B" },
      { type: "string" as const, value: "C" },
    ];

    const result = evaluate("sum", vars, { previousResults });
    expect(result).toEqual({ type: "string", value: "ABC" });
  });

  test("total with mixed strings and numbers uses only strings", () => {
    const vars = new Map();

    const previousResults = [
      { type: "string" as const, value: "Hello" },
      { type: "number" as const, value: 123 },
      { type: "string" as const, value: " World" },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result).toEqual({ type: "string", value: "Hello World" });
  });

  test("average ignores strings", () => {
    const vars = new Map();

    const previousResults = [
      { type: "number" as const, value: 10 },
      { type: "string" as const, value: "ignored" },
      { type: "number" as const, value: 20 },
    ];

    const result = evaluate("average", vars, { previousResults });
    expect(result).toEqual({ type: "number", value: 15 });
  });

  test("avg as alias for average", () => {
    const vars = new Map();

    const previousResults = [
      { type: "number" as const, value: 5 },
      { type: "number" as const, value: 15 },
    ];

    const result = evaluate("avg", vars, { previousResults });
    expect(result).toEqual({ type: "number", value: 10 });
  });
});
