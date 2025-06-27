import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Date Literals", () => {
  test("parses DD.MM.YYYY format", () => {
    const result = evaluate("25.10.1988", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.value.getDate()).toBe(25);
      expect(result.value.getMonth()).toBe(9); // October is month 9 (0-indexed)
      expect(result.value.getFullYear()).toBe(1988);
    }
  });

  test("parses DD/MM/YYYY format", () => {
    const result = evaluate("25/07/2025", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.value.getDate()).toBe(25);
      expect(result.value.getMonth()).toBe(6); // July is month 6 (0-indexed)
      expect(result.value.getFullYear()).toBe(2025);
    }
  });

  test("date subtraction in days", () => {
    const futureDate = new Date(2025, 6, 25); // July 25, 2025
    const today = new Date();
    const expectedDays = Math.floor(
      (futureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const result = evaluate("25/07/2025 - today in days", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("days");
      // Allow for a day difference due to time zones and execution time
      expect(Math.abs(result.value - expectedDays)).toBeLessThanOrEqual(1);
    }
  });

  test("date arithmetic with literal dates", () => {
    const result = evaluate("25.12.2024 + 10 days", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.value.getDate()).toBe(4);
      expect(result.value.getMonth()).toBe(0); // January
      expect(result.value.getFullYear()).toBe(2025);
    }
  });

  test("decimal number is not parsed as date", () => {
    // This should be parsed as a decimal number, not a date
    const result = evaluate("25.13", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value).toBeCloseTo(25.13);
    }
  });

  test("date with single digit day and month", () => {
    const result = evaluate("5/3/2024", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.value.getDate()).toBe(5);
      expect(result.value.getMonth()).toBe(2); // March
      expect(result.value.getFullYear()).toBe(2024);
    }
  });

  test("complex date expression", () => {
    const result = evaluate("(25.07.2025 - 01.01.2025) in days", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("days");
      expect(result.value).toBe(205); // Days between Jan 1 and July 25
    }
  });

  test("date literal with variables", () => {
    const variables = new Map();
    evaluate("birthday = 25.10.1988", variables);
    const result = evaluate("today - birthday in days", variables);
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("days");
      expect(result.value).toBeGreaterThan(12_000); // At least 12000 days old
    }
  });
});
