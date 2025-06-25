import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Mathematical Constants", () => {
  const variables = new Map();

  test("PI constant", () => {
    const result = evaluate("pi", variables);
    expect(result.value).toBeCloseTo(Math.PI, 10);
  });

  test("PI constant is case-insensitive", () => {
    const pi1 = evaluate("pi", variables);
    const pi2 = evaluate("PI", variables);
    const pi3 = evaluate("Pi", variables);

    expect(pi1.value).toBe(pi2.value);
    expect(pi2.value).toBe(pi3.value);
  });

  test("E constant", () => {
    const result = evaluate("e", variables);
    expect(result.value).toBeCloseTo(Math.E, 10);
  });

  test("E constant is case-insensitive", () => {
    const e1 = evaluate("e", variables);
    const e2 = evaluate("E", variables);

    expect(e1.value).toBe(e2.value);
  });

  test.each([
    ["2 * pi", 2 * Math.PI],
    ["pi + e", Math.PI + Math.E],
    ["pi^2", Math.PI ** 2],
  ])("Constants in expressions: %s", (expression, expected) => {
    const result = evaluate(expression, variables);
    expect(result.value).toBeCloseTo(expected, 10);
  });

  test.each([
    ["sin(pi)", 0],
    ["cos(pi)", -1],
    ["ln(e)", 1],
  ])("Constants with functions: %s", (expression, expected) => {
    const result = evaluate(expression, variables);
    expect(result.value).toBeCloseTo(expected, 10);
  });

  test.each([
    ["1e10", 1e10],
    ["2.5E-5", 2.5e-5],
    ["1.6e+10", 1.6e10],
  ])("Scientific notation: %s", (expression, expected) => {
    const result = evaluate(expression, variables);
    expect(result.value).toBe(expected);
  });

  describe("Scientific notation with E doesn't conflict with constant", () => {
    test.each([
      ["1e2", 100, false],
      ["5E3", 5000, false],
      ["E", Math.E, true],
      ["E * 2", Math.E * 2, true],
    ])("%s", (expression, expected, useCloseTo) => {
      const result = evaluate(expression, variables);
      if (useCloseTo) {
        expect(result.value).toBeCloseTo(expected, 10);
      } else {
        expect(result.value).toBe(expected);
      }
    });
  });

  test("Constants are available when no variable with same name exists", () => {
    const vars = new Map();

    // Before setting variables, constants should work
    const e1 = evaluate("e", vars);
    expect(e1.value).toBeCloseTo(Math.E, 10);

    const pi1 = evaluate("pi", vars);
    expect(pi1.value).toBeCloseTo(Math.PI, 10);

    // After setting variables, they override constants
    vars.set("e", { value: 10 });
    vars.set("pi", { value: 3 });

    const e2 = evaluate("e", vars);
    expect(e2.value).toBe(10);

    const pi2 = evaluate("pi", vars);
    expect(pi2.value).toBe(3);
  });

  test("Complex expressions with constants", () => {
    const result = evaluate("(pi * e) / 2 + sin(pi/2)", variables);
    const expected = (Math.PI * Math.E) / 2 + Math.sin(Math.PI / 2);
    expect(result.value).toBeCloseTo(expected, 10);
  });

  test.each(["pi = 3", "e = 2"])(
    "Constants cannot be assigned: %s",
    (expression) => {
      expect(() => evaluate(expression, variables)).toThrow();
    }
  );
});
