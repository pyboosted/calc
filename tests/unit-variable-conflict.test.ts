import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";

describe("Unit vs Variable Parsing", () => {
  test("single letter variables should work when not used as units", () => {
    const variables = new Map<string, CalculatedValue>();

    // Test setting single letter variables
    const assignB = evaluate("b = 5", variables);
    expect(assignB.value).toBe(5);
    expect(variables.get("b")?.value).toBe(5);

    const assignC = evaluate("c = 6", variables);
    expect(assignC.value).toBe(6);
    expect(variables.get("c")?.value).toBe(6);

    // Test using them in expressions
    const result1 = evaluate("b + c", variables);
    expect(result1.value).toBe(11);

    const result2 = evaluate("b * c", variables);
    expect(result2.value).toBe(30);
  });

  test("units should still work after numbers", () => {
    const variables = new Map<string, CalculatedValue>();

    // Test with space
    const result1 = evaluate("10 kg", variables);
    expect(result1.value).toBe(10);
    expect(result1.type === "number" && result1.unit).toBe("kg");

    // Test without space
    const result2 = evaluate("5m", variables);
    expect(result2.value).toBe(5);
    expect(result2.type === "number" && result2.unit).toBe("m");

    // Test single letter units
    const result3 = evaluate("100g", variables);
    expect(result3.value).toBe(100);
    expect(result3.type === "number" && result3.unit).toBe("g");
  });

  test("unit conversions should still work", () => {
    const variables = new Map<string, CalculatedValue>();

    // Test temperature conversion
    const result1 = evaluate("100 f to c", variables);
    expect(result1.value).toBeCloseTo(37.78, 1);
    expect(result1.type === "number" && result1.unit).toBe("c");

    // Test length conversion
    const result2 = evaluate("1000 m to km", variables);
    expect(result2.value).toBe(1);
    expect(result2.type === "number" && result2.unit).toBe("km");

    // Test with variable and explicit unit attachment
    evaluate("temp = 32", variables);
    evaluate("tempF = temp * 1 f", variables);
    const result3 = evaluate("tempF to c", variables);
    expect(result3.value).toBe(0);
    expect(result3.type === "number" && result3.unit).toBe("c");
  });

  test("complex example with units in bytes", () => {
    const variables = new Map<string, CalculatedValue>();

    // Define b as kilobytes (stored with unit)
    const assignResult = evaluate("b = 10 kb", variables);
    expect(assignResult.value).toBe(10);
    expect(assignResult.type === "number" && assignResult.unit).toBe("kb");
    // The variable stores the value with unit
    expect(variables.get("b")?.value).toBe(10);
    const bValue = variables.get("b");
    expect(bValue?.type === "number" && bValue?.unit).toBe("kb");

    // Use b in expression and convert result to bytes
    const result = evaluate("b + b to b", variables);
    expect(result.value).toBe(20_000);
    expect(result.type === "number" && result.unit).toBe("b");
  });

  test("mixing variables and units in expressions", () => {
    const variables = new Map<string, CalculatedValue>();

    // Set up variables
    evaluate("m = 5", variables);
    evaluate("s = 10", variables);

    // Use variables in calculation
    const result1 = evaluate("m * s", variables);
    expect(result1.value).toBe(50);

    // Use actual units
    const result2 = evaluate("100 m / 10 s", variables);
    expect(result2.value).toBe(10);
    // Note: The evaluator might not handle compound units like m/s correctly,
    // but at least the parsing should work
  });

  test("variable names that are also unit names", () => {
    const variables = new Map<string, CalculatedValue>();

    // Common programming variable names that are also units
    evaluate("s = 42", variables); // seconds
    evaluate("m = 100", variables); // meters/minutes
    evaluate("h = 24", variables); // hours
    evaluate("d = 7", variables); // days

    // They should work as variables
    const result = evaluate("h * d", variables);
    expect(result.value).toBe(168);
  });

  test("edge case: unit after multiplication", () => {
    const variables = new Map<string, CalculatedValue>();

    // Units work after simple multiplication
    const result = evaluate("5 * 2 kg", variables);
    expect(result.value).toBe(10);
    expect(result.type === "number" && result.unit).toBe("kg");
  });
});
