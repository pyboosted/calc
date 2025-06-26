import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

// Regex constants for performance
const TOTAL_REGEX = /^Total: 32\.389/;
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

describe("String Operations", () => {
  test("string literals", () => {
    const result = evaluate("`hello world`", new Map());
    expect(result).toEqual({ type: "string", value: "hello world" });
  });

  test("string interpolation", () => {
    const vars = new Map();
    evaluate("x = 10", vars);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing template string interpolation
    const result = evaluate("`Value: ${x}`", vars);
    expect(result).toEqual({ type: "string", value: "Value: 10" });
  });

  test("complex string interpolation", () => {
    const vars = new Map();
    evaluate("price = 29.99", vars);
    evaluate("tax = 0.08", vars);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing template string interpolation
    const result = evaluate("`Total: ${price + price * tax}`", vars);
    expect(result.type).toBe("string");
    expect(result.value).toMatch(TOTAL_REGEX);
  });

  test("string concatenation", () => {
    const result = evaluate("`hello` + ` ` + `world`", new Map());
    expect(result).toEqual({ type: "string", value: "hello world" });
  });

  test("string multiplication", () => {
    const result = evaluate("`abc` * 3", new Map());
    expect(result).toEqual({ type: "string", value: "abcabcabc" });
  });

  test("string multiplication reverse order", () => {
    const result = evaluate("3 * `xyz`", new Map());
    expect(result).toEqual({ type: "string", value: "xyzxyzxyz" });
  });

  test("string subtraction", () => {
    const result = evaluate("`hello.txt` - `.txt`", new Map());
    expect(result).toEqual({ type: "string", value: "hello" });
  });

  test("string subtraction not suffix", () => {
    const result = evaluate("`hello.txt` - `.pdf`", new Map());
    expect(result).toEqual({ type: "string", value: "hello.txt" });
  });

  test("escape sequences", () => {
    const result = evaluate("`line1\\\\nline2\\\\ttab`", new Map());
    expect(result).toEqual({ type: "string", value: "line1\nline2\ttab" });
  });

  test("type casting to string", () => {
    const result = evaluate("123 as string", new Map());
    expect(result).toEqual({ type: "string", value: "123" });
  });

  test("type casting float to string", () => {
    const result = evaluate("123.45 as string", new Map());
    expect(result).toEqual({ type: "string", value: "123.45" });
  });

  test("type casting to number", () => {
    const result = evaluate("`123.45` as number", new Map());
    expect(result).toEqual({ type: "number", value: 123.45 });
  });

  test("type casting invalid string to number throws", () => {
    expect(() => evaluate("`abc` as number", new Map())).toThrow(
      'Cannot convert "abc" to number'
    );
  });

  test("string with number concatenation", () => {
    const result = evaluate("`Age: ` + 25", new Map());
    expect(result).toEqual({ type: "string", value: "Age: 25" });
  });

  test("number with string concatenation", () => {
    const result = evaluate("100 + ` dollars`", new Map());
    expect(result).toEqual({ type: "string", value: "100 dollars" });
  });

  test("format function with date", () => {
    const vars = new Map();
    evaluate("d = today", vars);
    const result = evaluate("format(d, `yyyy-MM-dd`)", vars);
    expect(result.type).toBe("string");
    expect(result.value).toMatch(DATE_FORMAT_REGEX);
  });

  test("format function with datetime", () => {
    const vars = new Map();
    evaluate("dt = 25.12.2023T14:30", vars);
    const result = evaluate("format(dt, `dd/MM/yyyy HH:mm`)", vars);
    expect(result).toEqual({ type: "string", value: "25/12/2023 14:30" });
  });

  test("string multiplication with units", () => {
    const vars = new Map();
    evaluate("separator = `=`", vars);
    evaluate("width = 50", vars);
    const result = evaluate("separator * width", vars);
    expect(result).toEqual({ type: "string", value: `=${"=".repeat(49)}` });
  });

  test("string in variables", () => {
    const vars = new Map();
    evaluate("name = `John`", vars);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing template string interpolation
    evaluate("greeting = `Hello, ${name}!`", vars);
    const result = vars.get("greeting");
    expect(result).toEqual({ type: "string", value: "Hello, John!" });
  });

  test("single quote strings without interpolation", () => {
    const result = evaluate("'hello world'", new Map());
    expect(result).toEqual({ type: "string", value: "hello world" });
  });

  test("double quote strings without interpolation", () => {
    const result = evaluate('"hello world"', new Map());
    expect(result).toEqual({ type: "string", value: "hello world" });
  });

  test("single quote strings do not interpolate", () => {
    const vars = new Map();
    evaluate("x = 10", vars);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing that single quotes don't interpolate
    const result = evaluate("'Value: ${x}'", vars);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing that single quotes don't interpolate
    expect(result).toEqual({ type: "string", value: "Value: ${x}" });
  });

  test("double quote strings do not interpolate", () => {
    const vars = new Map();
    evaluate("x = 10", vars);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing that double quotes don't interpolate
    const result = evaluate('"Value: ${x}"', vars);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing that double quotes don't interpolate
    expect(result).toEqual({ type: "string", value: "Value: ${x}" });
  });

  test("escape sequences in single quotes", () => {
    const result = evaluate("'line1\\\\nline2'", new Map());
    expect(result).toEqual({ type: "string", value: "line1\nline2" });
  });

  test("escape sequences in double quotes", () => {
    const result = evaluate('"line1\\\\nline2"', new Map());
    expect(result).toEqual({ type: "string", value: "line1\nline2" });
  });

  test("mixed quotes and backticks", () => {
    const vars = new Map();
    evaluate("x = 5", vars);
    evaluate("msg1 = 'Static text'", vars);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing template string interpolation
    evaluate("msg2 = `Dynamic: ${x}`", vars);
    evaluate('msg3 = "Also static"', vars);

    expect(vars.get("msg1")).toEqual({ type: "string", value: "Static text" });
    expect(vars.get("msg2")).toEqual({ type: "string", value: "Dynamic: 5" });
    expect(vars.get("msg3")).toEqual({ type: "string", value: "Also static" });
  });
});
