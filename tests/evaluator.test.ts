import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Basic Arithmetic", () => {
  test("addition", () => {
    const result = evaluate("2 + 2", new Map());
    expect(result.value).toBe(4);
  });

  test("subtraction", () => {
    const result = evaluate("10 - 5", new Map());
    expect(result.value).toBe(5);
  });

  test("multiplication", () => {
    const result = evaluate("3 * 4", new Map());
    expect(result.value).toBe(12);
  });

  test("division", () => {
    const result = evaluate("20 / 4", new Map());
    expect(result.value).toBe(5);
  });

  test("exponentiation", () => {
    const result = evaluate("2 ^ 3", new Map());
    expect(result.value).toBe(8);
  });

  test("modulo", () => {
    const result = evaluate("10 % 3", new Map());
    expect(result.value).toBe(1);
  });
});

describe("Mathematical Functions", () => {
  test("sqrt", () => {
    const result = evaluate("sqrt(16)", new Map());
    expect(result.value).toBe(4);
  });

  test("abs", () => {
    const result = evaluate("abs(-5)", new Map());
    expect(result.value).toBe(5);
  });

  test("round", () => {
    const result = evaluate("round(3.14159)", new Map());
    expect(result.value).toBe(3);
  });

  test("ceil", () => {
    const result = evaluate("ceil(3.1)", new Map());
    expect(result.value).toBe(4);
  });

  test("floor", () => {
    const result = evaluate("floor(3.9)", new Map());
    expect(result.value).toBe(3);
  });
});

describe("Percentage Calculations", () => {
  test("simple percentage", () => {
    const result = evaluate("20%", new Map());
    expect(result.value).toBe(20);
    expect(result.unit).toBe("%");
  });

  test("percentage addition", () => {
    const result = evaluate("100 + 10%", new Map());
    expect(result.value).toBe(110);
  });

  test("percentage subtraction", () => {
    const result = evaluate("100 - 10%", new Map());
    expect(result.value).toBe(90);
  });

  test("percentage of", () => {
    const result = evaluate("20% of 100", new Map());
    expect(result.value).toBe(20);
  });
});

describe("Variables", () => {
  test("variable assignment and usage", () => {
    const vars = new Map();
    const result1 = evaluate("x = 10", vars);
    expect(result1.value).toBe(10);

    const result2 = evaluate("x + 5", vars);
    expect(result2.value).toBe(15);
  });

  test("prev variable with value", () => {
    const vars = new Map([["prev", { value: 42 }]]);
    const result = evaluate("prev * 2", vars);
    expect(result.value).toBe(84);
  });

  test("prev variable without value throws error", () => {
    const vars = new Map();
    expect(() => evaluate("prev", vars)).toThrow("Unknown variable: prev");
  });
});

describe("Inline Comments", () => {
  test("simple expression with comment", () => {
    const result = evaluate("2 + 3 # this is a comment", new Map());
    expect(result.value).toBe(5);
  });

  test("multiplication with comment", () => {
    const result = evaluate("5 * 4 # multiply five by four", new Map());
    expect(result.value).toBe(20);
  });

  test("variable assignment with comment", () => {
    const vars = new Map();
    const result = evaluate("price = 100 # base price", vars);
    expect(result.value).toBe(100);
    expect(vars.get("price").value).toBe(100);
  });

  test("expression with comment containing operators", () => {
    const result = evaluate("10 + 5 # 10 + 5 = 15", new Map());
    expect(result.value).toBe(15);
  });

  test("percentage calculation with comment", () => {
    const result = evaluate("100 - 10% # apply discount", new Map());
    expect(result.value).toBe(90);
  });

  test("function call with comment", () => {
    const result = evaluate("sqrt(16) # square root of 16", new Map());
    expect(result.value).toBe(4);
  });

  test("comment with special characters", () => {
    const result = evaluate(
      "2 * 3 # result: 6! (factorial notation in comment)",
      new Map()
    );
    expect(result.value).toBe(6);
  });

  test("unit conversion with comment", () => {
    const result = evaluate("5 m # five meters", new Map());
    expect(result.value).toBe(5);
    expect(result.unit).toBe("m");
  });
});
