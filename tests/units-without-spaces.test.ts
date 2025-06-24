import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Units Without Spaces", () => {
  test("currency codes attached to numbers", () => {
    const result1 = evaluate("10usd", new Map());
    expect(result1.value).toBe(10);
    expect(result1.unit).toBe("USD");

    const result2 = evaluate("10eur", new Map());
    expect(result2.value).toBe(10);
    expect(result2.unit).toBe("EUR");

    const result3 = evaluate("25.50gbp", new Map());
    expect(result3.value).toBe(25.5);
    expect(result3.unit).toBe("GBP");
  });

  test("unit abbreviations attached to numbers", () => {
    const result1 = evaluate("5kg", new Map());
    expect(result1.value).toBe(5);
    expect(result1.unit).toBe("kg");

    const result2 = evaluate("10m", new Map());
    expect(result2.value).toBe(10);
    expect(result2.unit).toBe("m");

    const result3 = evaluate("3.5l", new Map());
    expect(result3.value).toBe(3.5);
    expect(result3.unit).toBe("l");
  });

  test("full unit names attached to numbers", () => {
    const result1 = evaluate("10meters", new Map());
    expect(result1.value).toBe(10);
    expect(result1.unit).toBe("meters");

    const result2 = evaluate("5kilograms", new Map());
    expect(result2.value).toBe(5);
    expect(result2.unit).toBe("kilograms");
  });

  test("compound expressions without spaces", () => {
    const result1 = evaluate("1d+1h", new Map());
    expect(result1.value).toBeCloseTo(1.041_666_666_666_666_7);
    expect(result1.unit).toBe("d");

    const result2 = evaluate("2kg+500g", new Map());
    expect(result2.value).toBe(2.5);
    expect(result2.unit).toBe("kg");

    const result3 = evaluate("5m+20cm", new Map());
    expect(result3.value).toBe(5.2);
    expect(result3.unit).toBe("m");
  });

  test("scientific notation not confused with units", () => {
    const result1 = evaluate("1e5", new Map());
    expect(result1.value).toBe(100_000);
    expect(result1.unit).toBeUndefined();

    const result2 = evaluate("1.5e10", new Map());
    expect(result2.value).toBe(15_000_000_000);
    expect(result2.unit).toBeUndefined();

    const result3 = evaluate("2e-3", new Map());
    expect(result3.value).toBe(0.002);
    expect(result3.unit).toBeUndefined();
  });

  test("units starting with 'e' work correctly", () => {
    const result = evaluate("10eur", new Map());
    expect(result.value).toBe(10);
    expect(result.unit).toBe("EUR");
  });
});
