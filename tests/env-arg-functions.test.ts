import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";

describe("env() function", () => {
  test("reads existing environment variable", () => {
    // Set a test environment variable
    process.env.TEST_VAR = "hello world";

    const variables = new Map<string, CalculatedValue>();
    const result = evaluate('env("TEST_VAR")', variables);

    expect(result.type).toBe("string");
    expect(result.value).toBe("hello world");

    // Clean up
    process.env.TEST_VAR = undefined;
  });

  test("returns null for non-existent environment variable", () => {
    const variables = new Map<string, CalculatedValue>();
    const result = evaluate('env("NON_EXISTENT_VAR_123456")', variables);

    expect(result.type).toBe("null");
    expect(result.value).toBe(null);
  });

  test("requires exactly one argument", () => {
    const variables = new Map<string, CalculatedValue>();

    expect(() => evaluate("env()", variables)).toThrow(
      "env() requires exactly one argument"
    );

    expect(() => evaluate('env("VAR1", "VAR2")', variables)).toThrow(
      "env() requires exactly one argument"
    );
  });

  test("requires string argument", () => {
    const variables = new Map<string, CalculatedValue>();

    expect(() => evaluate("env(123)", variables)).toThrow(
      "env() argument must be a string"
    );
  });

  test("works with variable as argument", () => {
    process.env.MY_TEST_VAR = "test value";

    const variables = new Map<string, CalculatedValue>();
    evaluate('varName = "MY_TEST_VAR"', variables);
    const result = evaluate("env(varName)", variables);

    expect(result.type).toBe("string");
    expect(result.value).toBe("test value");

    process.env.MY_TEST_VAR = undefined;
  });

  test("type conversion with env()", () => {
    process.env.PORT = "3000";
    process.env.DEBUG = "true";
    process.env.CONFIG = '{"name": "test"}';

    const variables = new Map<string, CalculatedValue>();

    // Number conversion
    const portResult = evaluate('env("PORT") as number', variables);
    expect(portResult.type).toBe("number");
    expect(portResult.value).toBe(3000);

    // Boolean conversion
    const debugResult = evaluate('env("DEBUG") as boolean', variables);
    expect(debugResult.type).toBe("boolean");
    expect(debugResult.value).toBe(true);

    // Object conversion
    const configResult = evaluate('env("CONFIG") as object', variables);
    expect(configResult.type).toBe("object");
    if (configResult.type === "object") {
      expect(configResult.value.get("name")?.value).toBe("test");
    }

    // Clean up
    process.env.PORT = undefined;
    process.env.DEBUG = undefined;
    process.env.CONFIG = undefined;
  });
});

describe("arg() function", () => {
  test("returns null when no argument provided", () => {
    const variables = new Map<string, CalculatedValue>();
    const result = evaluate("arg()", variables);

    expect(result.type).toBe("null");
    expect(result.value).toBe(null);
  });

  test("returns cliArg when provided", () => {
    const variables = new Map<string, CalculatedValue>();
    const context = { cliArg: "hello from cli" };
    const result = evaluate("arg()", variables, context);

    expect(result.type).toBe("string");
    expect(result.value).toBe("hello from cli");
  });

  test("stdin takes precedence over cliArg", () => {
    const variables = new Map<string, CalculatedValue>();
    const context = {
      stdinData: "data from stdin",
      cliArg: "data from cli arg",
    };
    const result = evaluate("arg()", variables, context);

    expect(result.type).toBe("string");
    expect(result.value).toBe("data from stdin");
  });

  test("parses JSON objects", () => {
    const variables = new Map<string, CalculatedValue>();
    const context = { cliArg: '{"name": "John", "age": 30}' };
    const result = evaluate("arg()", variables, context);

    expect(result.type).toBe("object");
    if (result.type === "object") {
      expect(result.value.get("name")?.value).toBe("John");
      expect(result.value.get("age")?.value).toBe(30);
    }
  });

  test("parses JSON arrays", () => {
    const variables = new Map<string, CalculatedValue>();
    const context = { cliArg: '[1, 2, 3, "hello"]' };
    const result = evaluate("arg()", variables, context);

    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(4);
      expect(result.value[0].value).toBe(1);
      expect(result.value[3].value).toBe("hello");
    }
  });

  test("parses JSON primitives", () => {
    const variables = new Map<string, CalculatedValue>();

    // Number
    let context = { cliArg: "42" };
    let result = evaluate("arg()", variables, context);
    expect(result.type).toBe("number");
    expect(result.value).toBe(42);

    // Boolean true
    context = { cliArg: "true" };
    result = evaluate("arg()", variables, context);
    expect(result.type).toBe("boolean");
    expect(result.value).toBe(true);

    // Boolean false
    context = { cliArg: "false" };
    result = evaluate("arg()", variables, context);
    expect(result.type).toBe("boolean");
    expect(result.value).toBe(false);

    // Null
    context = { cliArg: "null" };
    result = evaluate("arg()", variables, context);
    expect(result.type).toBe("null");
    expect(result.value).toBe(null);
  });

  test("treats non-JSON as string", () => {
    const variables = new Map<string, CalculatedValue>();
    const context = { cliArg: "not valid json" };
    const result = evaluate("arg()", variables, context);

    expect(result.type).toBe("string");
    expect(result.value).toBe("not valid json");
  });

  test("takes no arguments", () => {
    const variables = new Map<string, CalculatedValue>();

    expect(() => evaluate('arg("something")', variables)).toThrow(
      "arg() takes no arguments"
    );
  });

  test("type conversion with arg()", () => {
    const variables = new Map<string, CalculatedValue>();

    // String to number
    let context = { cliArg: "123.45" };
    let result = evaluate("arg() as number", variables, context);
    expect(result.type).toBe("number");
    expect(result.value).toBe(123.45);

    // String to boolean
    context = { cliArg: "true" };
    result = evaluate("arg() as boolean", variables, context);
    expect(result.type).toBe("boolean");
    expect(result.value).toBe(true);
  });

  test("nested JSON parsing", () => {
    const variables = new Map<string, CalculatedValue>();
    const context = {
      cliArg: '{"user": {"name": "Alice", "scores": [10, 20, 30]}}',
    };
    const result = evaluate("arg()", variables, context);

    expect(result.type).toBe("object");
    if (result.type === "object") {
      const user = result.value.get("user");
      expect(user?.type).toBe("object");
      if (user?.type === "object") {
        expect(user.value.get("name")?.value).toBe("Alice");
        const scores = user.value.get("scores");
        expect(scores?.type).toBe("array");
        if (scores?.type === "array") {
          expect(scores.value).toHaveLength(3);
          expect(scores.value[1].value).toBe(20);
        }
      }
    }
  });
});

describe("Integration with expressions", () => {
  test("env() in calculations", () => {
    process.env.BASE_PRICE = "100";
    process.env.TAX_RATE = "0.08";

    const variables = new Map<string, CalculatedValue>();
    const result = evaluate(
      '(env("BASE_PRICE") as number) * (1 + (env("TAX_RATE") as number))',
      variables
    );

    expect(result.type).toBe("number");
    expect(result.value).toBe(108);

    process.env.BASE_PRICE = undefined;
    process.env.TAX_RATE = undefined;
  });

  test("arg() with property access", () => {
    const variables = new Map<string, CalculatedValue>();
    const context = { cliArg: '{"items": [{"price": 10}, {"price": 20}]}' };

    // First store in variable
    evaluate("data = arg() as object", variables, context);

    // Then access nested property
    const result = evaluate("data.items[0].price", variables);
    expect(result.type).toBe("number");
    expect(result.value).toBe(10);
  });

  test("conditional logic with env()", () => {
    const variables = new Map<string, CalculatedValue>();

    // When env var exists
    process.env.MODE = "production";
    let result = evaluate(
      'env("MODE") ? env("MODE") : "development"',
      variables
    );
    expect(result.value).toBe("production");

    process.env.MODE = undefined;

    // When env var doesn't exist
    result = evaluate('env("MODE") ? env("MODE") : "development"', variables);
    expect(result.value).toBe("development");
  });
});
