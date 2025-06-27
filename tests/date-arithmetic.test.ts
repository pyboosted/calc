import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Date Arithmetic with Variables", () => {
  test("variable * time period + date", () => {
    const vars = new Map();

    // Set test = 2
    evaluate("test = 2", vars);

    // test * 1 day should be 2 days
    const result1 = evaluate("test * 1 day", vars);
    expect(result1.value).toBe(2);
    expect(result1.type).toBe("quantity");
    if (result1.type === "quantity") {
      expect(result1.dimensions.time?.unit).toBe("day");
    }

    // test * 1 day + today should add 2 days to today
    const result2 = evaluate("test * 1 day + today", vars);
    expect(result2.type === "date").toBe(true);

    // Verify it's 2 days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() + 2);

    if (result2.type === "date") {
      const resultDate = new Date(result2.value);
      resultDate.setHours(0, 0, 0, 0);

      expect(resultDate.getTime()).toBe(expectedDate.getTime());
    }
  });

  test("date + variable * time period", () => {
    const vars = new Map();

    // Set x = 3
    evaluate("x = 3", vars);

    // today + x * 1 week should add 3 weeks to today
    const result = evaluate("today + x * 1 week", vars);
    expect(result.type === "date").toBe(true);

    // Verify it's 3 weeks from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() + 21); // 3 weeks = 21 days

    if (result.type === "date") {
      const resultDate = new Date(result.value);
      resultDate.setHours(0, 0, 0, 0);

      expect(resultDate.getTime()).toBe(expectedDate.getTime());
    }
  });

  test("complex date arithmetic expressions", () => {
    const vars = new Map();

    // Set num = 5
    evaluate("num = 5", vars);

    // tomorrow + num * 1 day - 2 days
    const result = evaluate("tomorrow + num * 1 day - 2 days", vars);
    expect(result.type === "date").toBe(true);

    // Should be: tomorrow + 5 days - 2 days = tomorrow + 3 days = 4 days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() + 4);

    if (result.type === "date") {
      const resultDate = new Date(result.value);
      resultDate.setHours(0, 0, 0, 0);

      expect(resultDate.getTime()).toBe(expectedDate.getTime());
    }
  });

  test("time period + time period without dates", () => {
    const vars = new Map();

    evaluate("x = 2", vars);

    // x * 1 hour + 30 minutes should be 2.5 hours
    const result = evaluate("x * 1 hour + 30 minutes", vars);
    expect(result.value).toBe(2.5);
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("hour");
    }
  });
});
