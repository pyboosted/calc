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

  test("Constants in expressions", () => {
    const result1 = evaluate("2 * pi", variables);
    expect(result1.value).toBeCloseTo(2 * Math.PI, 10);

    const result2 = evaluate("pi + e", variables);
    expect(result2.value).toBeCloseTo(Math.PI + Math.E, 10);

    const result3 = evaluate("pi^2", variables);
    expect(result3.value).toBeCloseTo(Math.PI ** 2, 10);
  });

  test("Constants with functions", () => {
    const result1 = evaluate("sin(pi)", variables);
    expect(result1.value).toBeCloseTo(0, 10);

    const result2 = evaluate("cos(pi)", variables);
    expect(result2.value).toBeCloseTo(-1, 10);

    const result3 = evaluate("ln(e)", variables);
    expect(result3.value).toBeCloseTo(1, 10);
  });

  test("Scientific notation still works", () => {
    const result1 = evaluate("1e10", variables);
    expect(result1.value).toBe(1e10);

    const result2 = evaluate("2.5E-5", variables);
    expect(result2.value).toBe(2.5e-5);

    const result3 = evaluate("1.6e+10", variables);
    expect(result3.value).toBe(1.6e10);
  });

  test("Scientific notation with E doesn't conflict with constant", () => {
    // These should be parsed as scientific notation, not E constant
    const result1 = evaluate("1e2", variables);
    expect(result1.value).toBe(100);

    const result2 = evaluate("5E3", variables);
    expect(result2.value).toBe(5000);

    // E by itself should be the constant
    const result3 = evaluate("E", variables);
    expect(result3.value).toBeCloseTo(Math.E, 10);

    // E in expression
    const result4 = evaluate("E * 2", variables);
    expect(result4.value).toBeCloseTo(Math.E * 2, 10);
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

  test("Constants cannot be assigned", () => {
    expect(() => evaluate("pi = 3", variables)).toThrow();
    expect(() => evaluate("e = 2", variables)).toThrow();
  });
});
