import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Compound Units with / notation", () => {
  test("basic flow rate kg/s", () => {
    const result = evaluate("1 kg/s", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 1,
      dimensions: {
        mass: { exponent: 1, unit: "kg" },
        time: { exponent: -1, unit: "s" },
      },
    });
  });

  test("convert kg/s to kg/h", () => {
    const result = evaluate("1 kg/s to kg/h", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 3600,
      dimensions: {
        mass: { exponent: 1, unit: "kg" },
        time: { exponent: -1, unit: "h" },
      },
    });
  });

  test("velocity m/s", () => {
    const result = evaluate("10 m/s", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 10,
      dimensions: {
        length: { exponent: 1, unit: "m" },
        time: { exponent: -1, unit: "s" },
      },
    });
  });

  test("acceleration m/s^2", () => {
    const result = evaluate("9.8 m/s^2", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 9.8,
      dimensions: {
        length: { exponent: 1, unit: "m" },
        time: { exponent: -2, unit: "s" },
      },
    });
  });

  test("compound with multiplication kg*m/s^2", () => {
    const result = evaluate("100 kg*m/s^2", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 100,
      dimensions: {
        mass: { exponent: 1, unit: "kg" },
        length: { exponent: 1, unit: "m" },
        time: { exponent: -2, unit: "s" },
      },
    });
  });

  test("convert between different notations", () => {
    const result = evaluate("1 kg*s^-1 to kg/s", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 1,
      dimensions: {
        mass: { exponent: 1, unit: "kg" },
        time: { exponent: -1, unit: "s" },
      },
    });
  });

  test("variable with compound unit", () => {
    const vars = new Map();
    evaluate("flow = 5 kg/s", vars);
    const result = evaluate("flow to g/min", vars);
    expect(result).toEqual({
      type: "quantity",
      value: 300_000,
      dimensions: {
        mass: { exponent: 1, unit: "g" },
        time: { exponent: -1, unit: "min" },
      },
    });
  });

  test("convert velocity km/h to m/s", () => {
    const result = evaluate("60 km/h to m/s", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.value).toBeCloseTo(16.6667, 4);
      expect(result.dimensions).toEqual({
        length: { exponent: 1, unit: "m" },
        time: { exponent: -1, unit: "s" },
      });
    }
  });
});
