import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Unit vs Variable Parsing", () => {
  test("single letter variables should work when not used as units", () => {
    const variables = new Map<string, CalculatedValue>();

    // Test setting single letter variables
    const assignB = evaluate("b = 5", variables);
    expect(assignB.type).toBe("number");
    if (assignB.type === "number") {
      expect(fromDecimal(assignB.value)).toBe(5);
    }
    const bVar = variables.get("b");
    if (bVar?.type === "number") {
      expect(fromDecimal(bVar.value)).toBe(5);
    }

    const assignC = evaluate("c = 6", variables);
    expect(assignC.type).toBe("number");
    if (assignC.type === "number") {
      expect(fromDecimal(assignC.value)).toBe(6);
    }
    const cVar = variables.get("c");
    if (cVar?.type === "number") {
      expect(fromDecimal(cVar.value)).toBe(6);
    }

    // Test using them in expressions
    const result1 = evaluate("b + c", variables);
    expect(result1.type).toBe("number");
    if (result1.type === "number") {
      expect(fromDecimal(result1.value)).toBe(11);
    }

    const result2 = evaluate("b * c", variables);
    expect(result2.type).toBe("number");
    if (result2.type === "number") {
      expect(fromDecimal(result2.value)).toBe(30);
    }
  });

  test("units should still work after numbers", () => {
    const variables = new Map<string, CalculatedValue>();

    // Test with space
    const result1 = evaluate("10 kg", variables);
    expect(result1.type).toBe("quantity");
    if (result1.type === "quantity") {
      expect(fromDecimal(result1.value)).toBe(10);
      expect(result1.dimensions.mass?.unit).toBe("kg");
    }

    // Test without space
    const result2 = evaluate("5m", variables);
    expect(result2.type).toBe("quantity");
    if (result2.type === "quantity") {
      expect(fromDecimal(result2.value)).toBe(5);
      expect(result2.dimensions.length?.unit).toBe("m");
    }

    // Test single letter units
    const result3 = evaluate("100g", variables);
    expect(result3.type).toBe("quantity");
    if (result3.type === "quantity") {
      expect(fromDecimal(result3.value)).toBe(100);
      expect(result3.dimensions.mass?.unit).toBe("g");
    }
  });

  test("unit conversions should still work", () => {
    const variables = new Map<string, CalculatedValue>();

    // Test temperature conversion
    const result1 = evaluate("100 f to c", variables);
    expect(result1.type).toBe("quantity");
    if (result1.type === "quantity") {
      expect(fromDecimal(result1.value)).toBeCloseTo(37.78, 1);
      expect(result1.dimensions.temperature?.unit).toBe("c");
    }

    // Test length conversion
    const result2 = evaluate("1000 m to km", variables);
    expect(result2.type).toBe("quantity");
    if (result2.type === "quantity") {
      expect(fromDecimal(result2.value)).toBe(1);
      expect(result2.dimensions.length?.unit).toBe("km");
    }

    // Test with variable and explicit unit attachment
    evaluate("temp = 32", variables);
    evaluate("tempF = temp * 1 f", variables);
    const result3 = evaluate("tempF to c", variables);
    expect(result3.type).toBe("quantity");
    if (result3.type === "quantity") {
      expect(fromDecimal(result3.value)).toBeCloseTo(0, 10);
      expect(result3.dimensions.temperature?.unit).toBe("c");
    }
  });

  test("complex example with units in bytes", () => {
    const variables = new Map<string, CalculatedValue>();

    // Define b as kilobytes (stored with unit)
    const assignResult = evaluate("b = 10 kb", variables);
    expect(assignResult.type).toBe("quantity");
    if (assignResult.type === "quantity") {
      expect(fromDecimal(assignResult.value)).toBe(10);
      expect(assignResult.dimensions.data?.unit).toBe("kb");
    }
    // The variable stores the value with unit
    const bValue = variables.get("b");
    expect(bValue?.type).toBe("quantity");
    if (bValue?.type === "quantity") {
      expect(fromDecimal(bValue.value)).toBe(10);
      expect(bValue.dimensions.data?.unit).toBe("kb");
    }

    // Use b in expression and convert result to bytes
    const result = evaluate("b + b to b", variables);
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(20_000);
      expect(result.dimensions.data?.unit).toBe("b");
    }
  });

  test("mixing variables and units in expressions", () => {
    const variables = new Map<string, CalculatedValue>();

    // Set up variables
    evaluate("m = 5", variables);
    evaluate("s = 10", variables);

    // Use variables in calculation
    const result1 = evaluate("m * s", variables);
    expect(result1.type).toBe("number");
    if (result1.type === "number") {
      expect(fromDecimal(result1.value)).toBe(50);
    }

    // Use actual units
    const result2 = evaluate("100 m / 10 s", variables);
    expect(result2.type).toBe("quantity");
    if (result2.type === "quantity") {
      expect(fromDecimal(result2.value)).toBe(10);
      // Now we handle compound units correctly - m/s
      expect(result2.dimensions.length?.unit).toBe("m");
      expect(result2.dimensions.length?.exponent).toBe(1);
      expect(result2.dimensions.time?.unit).toBe("s");
      expect(result2.dimensions.time?.exponent).toBe(-1);
    }
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
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(168);
    }
  });

  test("edge case: unit after multiplication", () => {
    const variables = new Map<string, CalculatedValue>();

    // Units work after simple multiplication
    const result = evaluate("5 * 2 kg", variables);
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(10);
      expect(result.dimensions.mass?.unit).toBe("kg");
    }
  });
});
