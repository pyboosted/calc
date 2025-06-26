import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Cyrillic Variable Names", () => {
  test("simple Cyrillic variable assignment and usage", () => {
    const vars = new Map();

    // переменная = 10
    const result1 = evaluate("переменная = 10", vars);
    expect(result1.value).toBe(10);
    const переменнаяValue = vars.get("переменная");
    expect(переменнаяValue?.value).toBe(10);

    // переменная + 5
    const result2 = evaluate("переменная + 5", vars);
    expect(result2.value).toBe(15);
  });

  test("multiple Cyrillic variables", () => {
    const vars = new Map();

    // Set multiple variables
    evaluate("цена = 100", vars);
    evaluate("скидка = 20", vars);
    evaluate("налог = 10", vars);

    // цена - скидка + налог
    const result = evaluate("цена - скидка + налог", vars);
    expect(result.value).toBe(90); // 100 - 20 + 10
  });

  test("mixed Latin and Cyrillic variables", () => {
    const vars = new Map();

    // Mix of Latin and Cyrillic
    evaluate("x = 5", vars);
    evaluate("у = 10", vars); // Cyrillic у
    evaluate("сумма = x + у", vars);

    const суммаValue = vars.get("сумма");
    expect(суммаValue?.value).toBe(15);
  });

  test("Cyrillic variables with mathematical functions", () => {
    const vars = new Map();

    evaluate("радиус = 4", vars);
    const result = evaluate("sqrt(радиус)", vars);
    expect(result.value).toBe(2);
  });

  test("Cyrillic variables with units", () => {
    const vars = new Map();

    evaluate("расстояние = 100", vars);
    const result = evaluate("расстояние * 1 km in meters", vars);
    expect(result.value).toBe(100_000);
    expect(result.type === "number" && result.unit).toBe("meters");
  });

  test("Cyrillic variables with date arithmetic", () => {
    const vars = new Map();

    evaluate("дни = 3", vars);
    const result = evaluate("дни * 1 day + today", vars);
    expect(result.type === "date").toBe(true);
  });
});
