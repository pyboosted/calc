import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Percentage as Unit", () => {
  test("stores percentage as unit in variables", () => {
    const vars = new Map();

    // Assign percentage to variable
    const discount = evaluate("discount = 10%", vars);
    expect(discount.value).toBe(10);
    expect(discount.unit).toBe("%");

    // Verify it's stored correctly
    const stored = vars.get("discount");
    expect(stored.value).toBe(10);
    expect(stored.unit).toBe("%");
  });

  test("subtracts percentage from numeric value", () => {
    const vars = new Map();

    // price = 100
    evaluate("price = 100", vars);

    // discount = 10%
    evaluate("discount = 10%", vars);

    // price - discount should be 90 (100 - 10% of 100)
    const result = evaluate("price - discount", vars);
    expect(result.value).toBe(90);
    expect(result.unit).toBeUndefined();
  });

  test("subtracts percentage from value with unit", () => {
    const vars = new Map();

    // price = 100 EUR
    evaluate("price = 100 eur", vars);

    // discount = 10%
    evaluate("discount = 10%", vars);

    // price - discount should be 90 EUR
    const result = evaluate("price - discount", vars);
    expect(result.value).toBe(90);
    expect(result.unit).toBe("EUR");
  });

  test("adds percentage to numeric value", () => {
    const vars = new Map();

    // price = 100
    evaluate("price = 100", vars);

    // tax = 8%
    evaluate("tax = 8%", vars);

    // price + tax should be 108 (100 + 8% of 100)
    const result = evaluate("price + tax", vars);
    expect(result.value).toBe(108);
    expect(result.unit).toBeUndefined();
  });

  test("adds percentage to value with unit", () => {
    const vars = new Map();

    // price = 100 USD
    evaluate("price = 100 usd", vars);

    // tax = 8%
    evaluate("tax = 8%", vars);

    // price + tax should be 108 USD
    const result = evaluate("price + tax", vars);
    expect(result.value).toBe(108);
    expect(result.unit).toBe("USD");
  });

  test("handles complex percentage calculations", () => {
    const vars = new Map();

    // Original price with currency
    evaluate("original = 1000 rub", vars);

    // Multiple discounts
    evaluate("discount1 = 10%", vars);
    evaluate("discount2 = 5%", vars);

    // Apply first discount
    const afterFirst = evaluate("original - discount1", vars);
    expect(afterFirst.value).toBe(900);
    expect(afterFirst.unit).toBe("RUB");

    // Store intermediate result
    evaluate("afterDiscount1 = original - discount1", vars);

    // Apply second discount to the discounted price
    const final = evaluate("afterDiscount1 - discount2", vars);
    expect(final.value).toBe(855); // 900 - 5% of 900 = 900 - 45 = 855
    expect(final.unit).toBe("RUB");
  });

  test("inline percentage still works", () => {
    const vars = new Map();

    // Direct inline percentage calculation
    const result = evaluate("100 - 10%", vars);
    expect(result.value).toBe(90);

    // With currency
    const resultCurrency = evaluate("100 eur - 10%", vars);
    expect(resultCurrency.value).toBe(90);
    expect(resultCurrency.unit).toBe("EUR");
  });

  // TODO: The "of" syntax with percentage variables would require parser changes
  // test('percentage of syntax with variables', () => {
  //   const vars = new Map();
  //
  //   evaluate('discount = 20%', vars);
  //   evaluate('price = 500', vars);
  //
  //   // 20% of 500 should be 100
  //   const result = evaluate('discount of price', vars);
  //   expect(result.value).toBe(100);
  // });
});
