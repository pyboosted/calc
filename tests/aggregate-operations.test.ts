import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";

describe("Aggregate Operations", () => {
  test("total sums previous numeric values", () => {
    const vars = new Map();

    // Simulate previous results: 10, 20, 30
    const previousResults = [{ value: 10 }, { value: 20 }, { value: 30 }];

    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBe(60); // 10 + 20 + 30
  });

  test("average calculates mean of previous values", () => {
    const vars = new Map();

    // Simulate previous results: 10, 20, 30
    const previousResults = [{ value: 10 }, { value: 20 }, { value: 30 }];

    const result = evaluate("average", vars, { previousResults });
    expect(result.value).toBe(20); // (10 + 20 + 30) / 3
  });

  test("ignores non-numeric values", () => {
    const vars = new Map();

    // Mix of numeric and non-numeric results
    const previousResults: CalculatedValue[] = [
      { value: 10 },
      { value: 0, date: new Date(), unit: "timestamp" }, // Date result
      { value: 20 },
      { value: NaN }, // Non-numeric value
      { value: 30 },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBe(60); // Only sums 10 + 20 + 30
  });

  test("works with decimal values", () => {
    const vars = new Map();

    const previousResults = [{ value: 10.5 }, { value: 20.25 }, { value: 30.75 }];

    const result = evaluate("average", vars, { previousResults });
    expect(result.value).toBe(20.5); // (10.5 + 20.25 + 30.75) / 3
  });

  test("throws error when no previous values", () => {
    const vars = new Map();

    expect(() => evaluate("total", vars, { previousResults: [] })).toThrow("No values to total");

    expect(() => evaluate("average", vars, { previousResults: [] })).toThrow(
      "No values to average",
    );
  });

  test("throws error when no numeric values", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { value: NaN, date: new Date(), unit: "timestamp" },
    ];

    expect(() => evaluate("total", vars, { previousResults })).toThrow(
      "No numeric values to total",
    );
  });

  test("works with values that have units", () => {
    const vars = new Map();

    const previousResults = [
      { value: 100, unit: "meters" },
      { value: 200, unit: "meters" },
      { value: 300, unit: "meters" },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBe(600);
    expect(result.unit).toBe("meters");
  });

  test("total with target unit conversion", () => {
    const vars = new Map();

    const previousResults = [
      { value: 1, unit: "km" },
      { value: 500, unit: "m" },
      { value: 100, unit: "cm" },
    ];

    const result = evaluate("total in m", vars, { previousResults });
    expect(result.value).toBe(1501); // 1000m + 500m + 1m
    expect(result.unit).toBe("m");
  });

  test("average with target unit conversion", () => {
    const vars = new Map();

    const previousResults = [
      { value: 100, unit: "km" },
      { value: 50, unit: "km" },
      { value: 30, unit: "km" },
    ];

    const result = evaluate("average in miles", vars, { previousResults });
    expect(result.value).toBeCloseTo(37.282, 2); // Average of 60 km in miles
    expect(result.unit).toBe("miles");
  });

  test("handles mixed compatible units without target", () => {
    const vars = new Map();

    const previousResults = [
      { value: 100, unit: "km" },
      { value: 50, unit: "miles" },
      { value: 30, unit: "km" },
    ];

    // With mixed compatible units and no target, converts to first unit
    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBeCloseTo(210.47, 1); // 100km + 80.47km + 30km
    expect(result.unit).toBe("km");
  });

  test("handles incompatible units without target", () => {
    const vars = new Map();

    const previousResults = [
      { value: 100, unit: "km" },
      { value: 50, unit: "kg" }, // Weight - incompatible with length
      { value: 30, unit: "seconds" }, // Time - incompatible with both
    ];

    // With incompatible units and no target, just sums raw values
    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBe(180);
    expect(result.unit).toBeUndefined();
  });

  test("handles values with and without units", () => {
    const vars = new Map();

    const previousResults = [{ value: 100 }, { value: 50, unit: "km" }, { value: 25 }];

    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBe(175);
    expect(result.unit).toBe("km"); // Takes the first unit found
  });

  test("ignores incompatible units in conversion", () => {
    const vars = new Map();

    const previousResults = [
      { value: 100, unit: "km" },
      { value: 50, unit: "kg" }, // Weight - can't convert to km
      { value: 30, unit: "km" },
    ];

    const result = evaluate("total in km", vars, { previousResults });
    expect(result.value).toBe(130); // Only sums compatible units
    expect(result.unit).toBe("km");
  });

  test("parses total in unit syntax", () => {
    const vars = new Map();

    const previousResults = [
      { value: 100, unit: "cm" },
      { value: 200, unit: "cm" },
    ];

    // Test different syntax variations
    const result1 = evaluate("total in m", vars, { previousResults });
    expect(result1.value).toBe(3);
    expect(result1.unit).toBe("m");

    const result2 = evaluate("total to m", vars, { previousResults });
    expect(result2.value).toBe(3);
    expect(result2.unit).toBe("m");

    const result3 = evaluate("total as m", vars, { previousResults });
    expect(result3.value).toBe(3);
    expect(result3.unit).toBe("m");
  });

  test("smart total adds time periods to dates", () => {
    const vars = new Map();

    // Create a specific date for testing
    const testDate = new Date("2025-01-01T10:00:00");

    const previousResults: CalculatedValue[] = [
      { value: testDate.getTime(), unit: "timestamp", date: testDate },
      { value: 2, unit: "days" },
      { value: 1, unit: "day" },
      { value: 1, unit: "hour" },
    ];

    const result = evaluate("total", vars, { previousResults });

    // Expected: Jan 1 + 2 days + 1 day + 1 hour = Jan 4, 11:00:00
    const expectedDate = new Date("2025-01-04T11:00:00");

    expect(result.unit).toBe("timestamp");
    expect(result.date).toBeDefined();
    expect(result.date?.getTime()).toBe(expectedDate.getTime());
  });

  test("smart total handles various time units", () => {
    const vars = new Map();

    const testDate = new Date("2025-01-01T00:00:00");

    const previousResults: CalculatedValue[] = [
      { value: testDate.getTime(), unit: "timestamp", date: testDate },
      { value: 1, unit: "week" },
      { value: 3, unit: "hours" },
      { value: 30, unit: "minutes" },
      { value: 45, unit: "seconds" },
    ];

    const result = evaluate("total", vars, { previousResults });

    // Expected: Jan 1 + 1 week + 3.5 hours + 45 seconds
    const expectedDate = new Date("2025-01-08T03:30:45");

    expect(result.unit).toBe("timestamp");
    expect(result.date).toBeDefined();
    expect(result.date?.getTime()).toBe(expectedDate.getTime());
  });

  test("smart total falls back to regular behavior without date", () => {
    const vars = new Map();

    // Only time periods, no date
    const previousResults: CalculatedValue[] = [
      { value: 2, unit: "days" },
      { value: 1, unit: "day" },
      { value: 24, unit: "hours" },
    ];

    const result = evaluate("total", vars, { previousResults });

    // Should sum to 4 days total (2 + 1 + 1)
    expect(result.value).toBe(4);
    expect(result.unit).toBe("days");
  });

  test("smart total requires exactly one date", () => {
    const vars = new Map();

    const date1 = new Date("2025-01-01T00:00:00");
    const date2 = new Date("2025-02-01T00:00:00");

    // Two dates - should fall back to regular behavior
    const previousResults: CalculatedValue[] = [
      { value: date1.getTime(), unit: "timestamp", date: date1 },
      { value: date2.getTime(), unit: "timestamp", date: date2 },
      { value: 1, unit: "day" },
    ];

    const result = evaluate("total", vars, { previousResults });

    // Should sum the numeric values
    expect(result.value).toBe(date1.getTime() + date2.getTime() + 1);
    expect(result.unit).toBeUndefined();
  });

  test("smart total respects target unit specification", () => {
    const vars = new Map();

    const testDate = new Date("2025-01-01T00:00:00");

    const previousResults: CalculatedValue[] = [
      { value: testDate.getTime(), unit: "timestamp", date: testDate },
      { value: 1, unit: "day" },
      { value: 24, unit: "hours" },
    ];

    // When target unit is specified, use regular behavior
    const result = evaluate("total in hours", vars, { previousResults });

    // Should convert everything to hours
    expect(result.value).toBe(48); // 1 day + 24 hours = 48 hours
    expect(result.unit).toBe("hours");
  });
});
