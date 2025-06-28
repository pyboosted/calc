import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("String Functions", () => {
  describe("Case Transformation Functions", () => {
    test("uppercase() converts to uppercase", () => {
      const vars = new Map();
      const result = evaluate('uppercase("hello world")', vars);
      expect(result).toEqual({ type: "string", value: "HELLO WORLD" });
    });

    test("upper() as alias for uppercase", () => {
      const vars = new Map();
      const result = evaluate('upper("hello")', vars);
      expect(result).toEqual({ type: "string", value: "HELLO" });
    });

    test("lowercase() converts to lowercase", () => {
      const vars = new Map();
      const result = evaluate('lowercase("HELLO WORLD")', vars);
      expect(result).toEqual({ type: "string", value: "hello world" });
    });

    test("lower() as alias for lowercase", () => {
      const vars = new Map();
      const result = evaluate('lower("HELLO")', vars);
      expect(result).toEqual({ type: "string", value: "hello" });
    });

    test("capitalize() capitalizes first letter", () => {
      const vars = new Map();
      const result = evaluate('capitalize("hello world")', vars);
      expect(result).toEqual({ type: "string", value: "Hello world" });
    });

    test("capitalize() with empty string", () => {
      const vars = new Map();
      const result = evaluate('capitalize("")', vars);
      expect(result).toEqual({ type: "string", value: "" });
    });

    test("capitalize() with single character", () => {
      const vars = new Map();
      const result = evaluate('capitalize("h")', vars);
      expect(result).toEqual({ type: "string", value: "H" });
    });

    test("case functions with variables", () => {
      const vars = new Map();
      evaluate('text = "Hello World"', vars);
      expect(evaluate("upper(text)", vars)).toEqual({
        type: "string",
        value: "HELLO WORLD",
      });
      expect(evaluate("lower(text)", vars)).toEqual({
        type: "string",
        value: "hello world",
      });
    });
  });

  describe("String Checking Functions", () => {
    test("startswith() checks prefix", () => {
      const vars = new Map();
      const result = evaluate('startswith("hello world", "hello")', vars);
      expect(result).toEqual({ type: "boolean", value: true });
    });

    test("startswith() negative case", () => {
      const vars = new Map();
      const result = evaluate('startswith("hello world", "world")', vars);
      expect(result).toEqual({ type: "boolean", value: false });
    });

    test("endswith() checks suffix", () => {
      const vars = new Map();
      const result = evaluate('endswith("hello.txt", ".txt")', vars);
      expect(result).toEqual({ type: "boolean", value: true });
    });

    test("endswith() negative case", () => {
      const vars = new Map();
      const result = evaluate('endswith("hello.txt", ".pdf")', vars);
      expect(result).toEqual({ type: "boolean", value: false });
    });

    test("includes() checks substring", () => {
      const vars = new Map();
      const result = evaluate('includes("hello world", "lo wo")', vars);
      expect(result).toEqual({ type: "boolean", value: true });
    });

    test("contains() as alias for includes", () => {
      const vars = new Map();
      const result = evaluate('contains("hello world", "world")', vars);
      expect(result).toEqual({ type: "boolean", value: true });
    });

    test("includes() negative case", () => {
      const vars = new Map();
      const result = evaluate('includes("hello", "world")', vars);
      expect(result).toEqual({ type: "boolean", value: false });
    });

    test("string checking with empty strings", () => {
      const vars = new Map();
      expect(evaluate('startswith("hello", "")', vars)).toEqual({
        type: "boolean",
        value: true,
      });
      expect(evaluate('endswith("hello", "")', vars)).toEqual({
        type: "boolean",
        value: true,
      });
      expect(evaluate('includes("hello", "")', vars)).toEqual({
        type: "boolean",
        value: true,
      });
    });
  });

  describe("String Manipulation Functions", () => {
    test("replace() replaces first occurrence", () => {
      const vars = new Map();
      const result = evaluate('replace("hello hello", "hello", "hi")', vars);
      expect(result).toEqual({ type: "string", value: "hi hello" });
    });

    test("replace() with no match", () => {
      const vars = new Map();
      const result = evaluate('replace("hello", "world", "hi")', vars);
      expect(result).toEqual({ type: "string", value: "hello" });
    });

    test("replaceall() replaces all occurrences", () => {
      const vars = new Map();
      const result = evaluate('replaceall("hello hello", "hello", "hi")', vars);
      expect(result).toEqual({ type: "string", value: "hi hi" });
    });

    test("split() creates array", () => {
      const vars = new Map();
      const result = evaluate('split("a,b,c", ",")', vars);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({ type: "string", value: "a" });
        expect(result.value[1]).toEqual({ type: "string", value: "b" });
        expect(result.value[2]).toEqual({ type: "string", value: "c" });
      }
    });

    test("split() with empty delimiter", () => {
      const vars = new Map();
      const result = evaluate('split("abc", "")', vars);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({ type: "string", value: "a" });
        expect(result.value[1]).toEqual({ type: "string", value: "b" });
        expect(result.value[2]).toEqual({ type: "string", value: "c" });
      }
    });

    test("join() combines array elements", () => {
      const vars = new Map();
      evaluate('arr = ["a", "b", "c"]', vars);
      const result = evaluate('join(arr, "-")', vars);
      expect(result).toEqual({ type: "string", value: "a-b-c" });
    });

    test("join() with mixed types", () => {
      const vars = new Map();
      evaluate("arr = [1, `hello`, true]", vars);
      const result = evaluate('join(arr, ", ")', vars);
      expect(result).toEqual({ type: "string", value: "1, hello, true" });
    });

    test("reverse() reverses string", () => {
      const vars = new Map();
      const result = evaluate('reverse("hello")', vars);
      expect(result).toEqual({ type: "string", value: "olleh" });
    });

    test("reverse() with unicode", () => {
      const vars = new Map();
      const result = evaluate('reverse("café")', vars);
      expect(result).toEqual({ type: "string", value: "éfac" });
    });
  });

  describe("String Padding Functions", () => {
    test("padleft() pads with spaces", () => {
      const vars = new Map();
      const result = evaluate('padleft("5", 3)', vars);
      expect(result).toEqual({ type: "string", value: "  5" });
    });

    test("padleft() with custom character", () => {
      const vars = new Map();
      const result = evaluate('padleft("5", 3, "0")', vars);
      expect(result).toEqual({ type: "string", value: "005" });
    });

    test("padstart() as alias for padleft", () => {
      const vars = new Map();
      const result = evaluate('padstart("abc", 5, "*")', vars);
      expect(result).toEqual({ type: "string", value: "**abc" });
    });

    test("padright() pads with spaces", () => {
      const vars = new Map();
      const result = evaluate('padright("hello", 8)', vars);
      expect(result).toEqual({ type: "string", value: "hello   " });
    });

    test("padright() with custom character", () => {
      const vars = new Map();
      const result = evaluate('padright("hello", 10, ".")', vars);
      expect(result).toEqual({ type: "string", value: "hello....." });
    });

    test("padend() as alias for padright", () => {
      const vars = new Map();
      const result = evaluate('padend("abc", 5, "*")', vars);
      expect(result).toEqual({ type: "string", value: "abc**" });
    });

    test("padding with length less than string length", () => {
      const vars = new Map();
      expect(evaluate('padleft("hello", 3)', vars)).toEqual({
        type: "string",
        value: "hello",
      });
      expect(evaluate('padright("hello", 3)', vars)).toEqual({
        type: "string",
        value: "hello",
      });
    });
  });

  describe("String Finding Functions", () => {
    test("indexof() finds first occurrence", () => {
      const vars = new Map();
      const result = evaluate('indexof("hello world", "world")', vars);
      expect(result).toEqual({ type: "number", value: 6 });
    });

    test("indexof() returns -1 when not found", () => {
      const vars = new Map();
      const result = evaluate('indexof("hello", "world")', vars);
      expect(result).toEqual({ type: "number", value: -1 });
    });

    test("lastindexof() finds last occurrence", () => {
      const vars = new Map();
      const result = evaluate('lastindexof("abcabc", "abc")', vars);
      expect(result).toEqual({ type: "number", value: 3 });
    });

    test("lastindexof() returns -1 when not found", () => {
      const vars = new Map();
      const result = evaluate('lastindexof("hello", "world")', vars);
      expect(result).toEqual({ type: "number", value: -1 });
    });

    test("indexof() with empty string", () => {
      const vars = new Map();
      const result = evaluate('indexof("hello", "")', vars);
      expect(result).toEqual({ type: "number", value: 0 });
    });
  });

  // Original len() tests
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

  test("error handling - len() with non-string/array/object", () => {
    const vars = new Map();
    expect(() => evaluate("len(123)", vars)).toThrow(
      "len can only be called on arrays, strings, or objects"
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

  describe("Error Handling for New Functions", () => {
    test("uppercase() with non-string", () => {
      const vars = new Map();
      expect(() => evaluate("uppercase(123)", vars)).toThrow(
        "uppercase() requires a string argument"
      );
    });

    test("startswith() with wrong argument types", () => {
      const vars = new Map();
      expect(() => evaluate("startswith(123, `hello`)", vars)).toThrow(
        "First argument to startswith() must be a string"
      );
      expect(() => evaluate('startswith("hello", 123)', vars)).toThrow(
        "Second argument to startswith() must be a string"
      );
    });

    test("replace() with wrong number of arguments", () => {
      const vars = new Map();
      expect(() => evaluate('replace("hello", "hi")', vars)).toThrow(
        "replace() requires exactly 3 arguments"
      );
    });

    test("split() with non-string arguments", () => {
      const vars = new Map();
      expect(() => evaluate("split(123, `,`)", vars)).toThrow(
        "First argument to split() must be a string"
      );
      expect(() => evaluate('split("hello", 123)', vars)).toThrow(
        "Second argument to split() must be a string"
      );
    });

    test("join() with non-array first argument", () => {
      const vars = new Map();
      expect(() => evaluate('join("hello", ",")', vars)).toThrow(
        "First argument to join() must be an array"
      );
    });

    test("padleft() with wrong argument types", () => {
      const vars = new Map();
      expect(() => evaluate("padleft(123, 5)", vars)).toThrow(
        "First argument to padleft() must be a string"
      );
      expect(() => evaluate('padleft("hello", "5")', vars)).toThrow(
        "Second argument to padleft() must be a number"
      );
    });

    test("indexof() with non-string arguments", () => {
      const vars = new Map();
      expect(() => evaluate("indexof(123, `hello`)", vars)).toThrow(
        "First argument to indexof() must be a string"
      );
      expect(() => evaluate('indexof("hello", 123)', vars)).toThrow(
        "Second argument to indexof() must be a string"
      );
    });
  });

  describe("Function Chaining and Integration", () => {
    test("chaining case functions", () => {
      const vars = new Map();
      const result = evaluate('lower(upper("Hello World"))', vars);
      expect(result).toEqual({ type: "string", value: "hello world" });
    });

    test("using string functions in conditionals", () => {
      const vars = new Map();
      const result = evaluate(
        'startswith("hello.txt", "hello") ? "yes" : "no"',
        vars
      );
      expect(result).toEqual({ type: "string", value: "yes" });
    });

    test("split and join round trip", () => {
      const vars = new Map();
      const result = evaluate('join(split("a-b-c", "-"), "-")', vars);
      expect(result).toEqual({ type: "string", value: "a-b-c" });
    });

    test("complex string processing", () => {
      const vars = new Map();
      evaluate('text = "  HELLO world  "', vars);
      const result = evaluate("capitalize(lower(trim(text)))", vars);
      expect(result).toEqual({ type: "string", value: "Hello world" });
    });

    test("using string functions with interpolation", () => {
      const vars = new Map();
      evaluate('name = "john"', vars);
      // biome-ignore lint/complexity/noUselessStringConcat: Avoiding template literal detection
      const result = evaluate("`Hello, $" + "{capitalize(name)}!`", vars);
      expect(result).toEqual({ type: "string", value: "Hello, John!" });
    });

    test("padding numbers for formatting", () => {
      const vars = new Map();
      evaluate("num = 5", vars);
      const result = evaluate('padleft(num as string, 3, "0")', vars);
      expect(result).toEqual({ type: "string", value: "005" });
    });

    test("finding and replacing", () => {
      const vars = new Map();
      evaluate('text = "hello world hello"', vars);
      evaluate("pos = indexof(text, `world`)", vars);
      const result = evaluate(
        'pos >= 0 ? replace(text, "world", "universe") : text',
        vars
      );
      expect(result).toEqual({ type: "string", value: "hello universe hello" });
    });
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
