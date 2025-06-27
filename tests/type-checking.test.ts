import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Type Checking with 'is' keyword", () => {
  test("basic type checks", () => {
    const vars = new Map();

    // Number type
    expect(evaluate("100 is number", vars).value).toBe(true);
    expect(evaluate("3.14 is number", vars).value).toBe(true);
    expect(evaluate('"hello" is number', vars).value).toBe(false);

    // String type
    expect(evaluate('"hello" is string', vars).value).toBe(true);
    expect(evaluate("'world' is string", vars).value).toBe(true);
    expect(evaluate("100 is string", vars).value).toBe(false);

    // Boolean type
    expect(evaluate("true is boolean", vars).value).toBe(true);
    expect(evaluate("false is boolean", vars).value).toBe(true);
    expect(evaluate("1 is boolean", vars).value).toBe(false);

    // Null type
    expect(evaluate("null is null", vars).value).toBe(true);
    expect(evaluate("0 is null", vars).value).toBe(false);

    // Array type
    expect(evaluate("[1, 2, 3] is array", vars).value).toBe(true);
    expect(evaluate("[] is array", vars).value).toBe(true);
    expect(evaluate('"array" is array', vars).value).toBe(false);

    // Object type
    expect(evaluate("{a: 1} is object", vars).value).toBe(true);
    expect(evaluate("{} is object", vars).value).toBe(true);
    expect(evaluate("[1, 2] is object", vars).value).toBe(false);
  });

  test("date and datetime type checks", () => {
    const vars = new Map();

    // Date type (all date values)
    expect(evaluate("today is date", vars).value).toBe(true);
    expect(evaluate("now is date", vars).value).toBe(true);
    expect(evaluate("yesterday is date", vars).value).toBe(true);

    // DateTime type (only dates with time component)
    expect(evaluate("now is datetime", vars).value).toBe(true);
    expect(evaluate("today is datetime", vars).value).toBe(false);
    expect(evaluate("yesterday is datetime", vars).value).toBe(false);

    // Time literals become datetime (today at that time)
    expect(evaluate("10:30 is date", vars).value).toBe(true);
    expect(evaluate("10:30 is datetime", vars).value).toBe(true);
  });

  test("currency type checks", () => {
    const vars = new Map();

    expect(evaluate("100usd is currency", vars).value).toBe(true);
    expect(evaluate("50eur is currency", vars).value).toBe(true);
    expect(evaluate("100 is currency", vars).value).toBe(false);
    expect(evaluate("100m is currency", vars).value).toBe(false);
  });

  test("unit category type checks", () => {
    const vars = new Map();

    // Length
    expect(evaluate("100m is length", vars).value).toBe(true);
    expect(evaluate("5km is length", vars).value).toBe(true);
    expect(evaluate("10ft is length", vars).value).toBe(true);
    expect(evaluate("100kg is length", vars).value).toBe(false);

    // Weight
    expect(evaluate("5kg is weight", vars).value).toBe(true);
    expect(evaluate("100g is weight", vars).value).toBe(true);
    expect(evaluate("10lb is weight", vars).value).toBe(true);
    expect(evaluate("100m is weight", vars).value).toBe(false);

    // Volume
    expect(evaluate("1L is volume", vars).value).toBe(true);
    expect(evaluate("500ml is volume", vars).value).toBe(true);
    expect(evaluate("2gal is volume", vars).value).toBe(true);

    // Temperature
    expect(evaluate("20celsius is temperature", vars).value).toBe(true);
    expect(evaluate("32f is temperature", vars).value).toBe(true);
    expect(evaluate("273k is temperature", vars).value).toBe(true);

    // Data
    expect(evaluate("100gb is data", vars).value).toBe(true);
    expect(evaluate("512mb is data", vars).value).toBe(true);
    expect(evaluate("1tb is data", vars).value).toBe(true);

    // Time
    expect(evaluate("5minutes is time", vars).value).toBe(true);
    expect(evaluate("2hours is time", vars).value).toBe(true);
    expect(evaluate("30s is time", vars).value).toBe(true);
  });

  test("type checking with variables", () => {
    const vars = new Map();

    // Store different types in variables
    vars.set("num", { type: "number", value: 100 });
    vars.set("str", { type: "string", value: "hello" });
    vars.set("date", { type: "date", value: new Date() });
    vars.set("currency", {
      type: "quantity",
      value: 50,
      dimensions: { currency: { exponent: 1, code: "usd" } },
    });

    expect(evaluate("num is number", vars).value).toBe(true);
    expect(evaluate("str is string", vars).value).toBe(true);
    expect(evaluate("date is date", vars).value).toBe(true);
    expect(evaluate("currency is currency", vars).value).toBe(true);
  });
});

describe("Type inspection functions", () => {
  test("unit() function", () => {
    const vars = new Map();

    // Returns unit for numbers with units
    expect(evaluate("unit(100m)", vars).value).toBe("m");
    expect(evaluate("unit(50usd)", vars).value).toBe("usd");
    expect(evaluate("unit(5kg)", vars).value).toBe("kg");

    // Returns null for numbers without units
    expect(evaluate("unit(100)", vars).value).toBe(null);

    // Returns null for non-numbers
    expect(evaluate('unit("hello")', vars).value).toBe(null);
    expect(evaluate("unit(true)", vars).value).toBe(null);
    expect(evaluate("unit(today)", vars).value).toBe(null);
  });

  test("timezone() function", () => {
    const vars = new Map();

    // Returns "local" for dates without timezone
    expect(evaluate("timezone(now)", vars).value).toBe("local");
    expect(evaluate("timezone(today)", vars).value).toBe("local");

    // Returns specified timezone
    expect(evaluate("timezone(now@utc)", vars).value).toBe("utc");
    expect(evaluate("timezone(today@tokyo)", vars).value).toBe("tokyo");

    // Returns null for non-dates
    expect(evaluate("timezone(100)", vars).value).toBe(null);
    expect(evaluate('timezone("hello")', vars).value).toBe(null);
  });

  test("type() function", () => {
    const vars = new Map();

    // Returns the type as string
    expect(evaluate("type(100)", vars).value).toBe("number");
    expect(evaluate('type("hello")', vars).value).toBe("string");
    expect(evaluate("type(true)", vars).value).toBe("boolean");
    expect(evaluate("type(null)", vars).value).toBe("null");
    expect(evaluate("type([1, 2, 3])", vars).value).toBe("array");
    expect(evaluate("type({a: 1})", vars).value).toBe("object");
    expect(evaluate("type(today)", vars).value).toBe("date");
  });

  test("type functions with variables", () => {
    const vars = new Map();

    vars.set("price", {
      type: "quantity",
      value: 99.99,
      dimensions: { currency: { exponent: 1, code: "usd" } },
    });
    vars.set("meeting", { type: "date", value: new Date(), timezone: "ny" });

    expect(evaluate("unit(price)", vars).value).toBe("usd");
    expect(evaluate("timezone(meeting)", vars).value).toBe("ny");
    expect(evaluate("type(price)", vars).value).toBe("quantity");
  });
});

describe("Type checking in expressions", () => {
  test("type checking in conditional expressions", () => {
    const vars = new Map();
    vars.set("value", {
      type: "quantity",
      value: 100,
      dimensions: { currency: { exponent: 1, code: "usd" } },
    });

    // Using type checks in ternary
    const result = evaluate(
      'value is currency ? "It\'s money!" : "Not money"',
      vars
    );
    expect(result.value).toBe("It's money!");

    // Using type checks with logical operators
    const result2 = evaluate("value is quantity and value is currency", vars);
    expect(result2.value).toBe(true);
  });

  test("type checking edge cases", () => {
    const vars = new Map();

    // Unknown type returns false
    expect(evaluate("100 is unknown", vars).value).toBe(false);
    expect(evaluate('"hello" is foobar', vars).value).toBe(false);

    // Case insensitive
    expect(evaluate("100 is NUMBER", vars).value).toBe(true);
    expect(evaluate("100usd is CURRENCY", vars).value).toBe(true);
  });
});
