import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Derived Units", () => {
  test("Hz (Hertz) - frequency", () => {
    const result = evaluate("1 Hz", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(1);
      expect(result.dimensions).toEqual({
        time: { exponent: -1, unit: "s" },
      });
    }
  });

  test("N (Newton) - force", () => {
    const result = evaluate("10 N", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(10);
      expect(result.dimensions).toEqual({
        mass: { exponent: 1, unit: "kg" },
        length: { exponent: 1, unit: "m" },
        time: { exponent: -2, unit: "s" },
      });
    }
  });

  test("Pa (Pascal) - pressure", () => {
    const result = evaluate("101325 Pa", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(101_325);
      expect(result.dimensions).toEqual({
        mass: { exponent: 1, unit: "kg" },
        length: { exponent: -1, unit: "m" },
        time: { exponent: -2, unit: "s" },
      });
    }
  });

  test("J (Joule) - energy", () => {
    const result = evaluate("100 J", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(100);
      expect(result.dimensions).toEqual({
        mass: { exponent: 1, unit: "kg" },
        length: { exponent: 2, unit: "m" },
        time: { exponent: -2, unit: "s" },
      });
    }
  });

  test("W (Watt) - power", () => {
    const result = evaluate("60 W", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(60);
      expect(result.dimensions).toEqual({
        mass: { exponent: 1, unit: "kg" },
        length: { exponent: 2, unit: "m" },
        time: { exponent: -3, unit: "s" },
      });
    }
  });

  test("frequency * time = dimensionless", () => {
    const result = evaluate("50 Hz * 2 s", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(100);
    }
  });

  test("Hz comparison with s^-1", () => {
    const hz = evaluate("1 Hz", new Map());
    const perSecond = evaluate("1 s^-1", new Map());
    expect(hz.type).toBe(perSecond.type);
    if (hz.type === "quantity" && perSecond.type === "quantity") {
      expect(hz.value.equals(perSecond.value)).toBe(true);
      expect(hz.dimensions).toEqual(perSecond.dimensions);
    }
  });
});
