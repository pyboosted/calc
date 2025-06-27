import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Derived Units", () => {
  test("Hz (Hertz) - frequency", () => {
    const result = evaluate("1 Hz", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 1,
      dimensions: {
        time: { exponent: -1, unit: "s" },
      },
    });
  });

  test("N (Newton) - force", () => {
    const result = evaluate("10 N", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 10,
      dimensions: {
        mass: { exponent: 1, unit: "kg" },
        length: { exponent: 1, unit: "m" },
        time: { exponent: -2, unit: "s" },
      },
    });
  });

  test("Pa (Pascal) - pressure", () => {
    const result = evaluate("101325 Pa", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 101_325,
      dimensions: {
        mass: { exponent: 1, unit: "kg" },
        length: { exponent: -1, unit: "m" },
        time: { exponent: -2, unit: "s" },
      },
    });
  });

  test("J (Joule) - energy", () => {
    const result = evaluate("100 J", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 100,
      dimensions: {
        mass: { exponent: 1, unit: "kg" },
        length: { exponent: 2, unit: "m" },
        time: { exponent: -2, unit: "s" },
      },
    });
  });

  test("W (Watt) - power", () => {
    const result = evaluate("60 W", new Map());
    expect(result).toEqual({
      type: "quantity",
      value: 60,
      dimensions: {
        mass: { exponent: 1, unit: "kg" },
        length: { exponent: 2, unit: "m" },
        time: { exponent: -3, unit: "s" },
      },
    });
  });

  test("frequency * time = dimensionless", () => {
    const result = evaluate("50 Hz * 2 s", new Map());
    expect(result).toEqual({
      type: "number",
      value: 100,
    });
  });

  test("Hz comparison with s^-1", () => {
    const hz = evaluate("1 Hz", new Map());
    const perSecond = evaluate("1 s^-1", new Map());
    expect(hz).toEqual(perSecond);
  });
});
