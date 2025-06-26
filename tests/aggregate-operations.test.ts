import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";

describe("Aggregate Operations", () => {
  test("total sums previous numeric values", () => {
    const vars = new Map();

    // Simulate previous results: 10, 20, 30
    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 10 },
      { type: "number" as const, value: 20 },
      { type: "number" as const, value: 30 },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBe(60); // 10 + 20 + 30
  });

  test("average calculates mean of previous values", () => {
    const vars = new Map();

    // Simulate previous results: 10, 20, 30
    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 10 },
      { type: "number" as const, value: 20 },
      { type: "number" as const, value: 30 },
    ];

    const result = evaluate("average", vars, { previousResults });
    expect(result.value).toBe(20); // (10 + 20 + 30) / 3
  });

  test("ignores non-numeric values", () => {
    const vars = new Map();

    // Mix of numeric and non-numeric results
    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 10 },
      { type: "date" as const, value: new Date() }, // Date result
      { type: "number" as const, value: 20 },
      { type: "number" as const, value: Number.NaN }, // Non-numeric value
      { type: "number" as const, value: 30 },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBe(60); // Only sums 10 + 20 + 30
  });

  test("works with decimal values", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 10.5 },
      { type: "number" as const, value: 20.25 },
      { type: "number" as const, value: 30.75 },
    ];

    const result = evaluate("average", vars, { previousResults });
    expect(result.value).toBe(20.5); // (10.5 + 20.25 + 30.75) / 3
  });

  test("throws error when no previous values", () => {
    const vars = new Map();

    expect(() => evaluate("total", vars, { previousResults: [] })).toThrow(
      "No values to total"
    );

    expect(() => evaluate("average", vars, { previousResults: [] })).toThrow(
      "No values to average"
    );
  });

  test("throws error when no numeric values", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "date", value: new Date() },
    ];

    expect(() => evaluate("total", vars, { previousResults })).toThrow(
      "No numeric values to total"
    );
  });

  test("works with values that have units", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 100, unit: "meters" },
      { type: "number" as const, value: 200, unit: "meters" },
      { type: "number" as const, value: 300, unit: "meters" },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBe(600);
    expect(result.type === "number" && result.unit).toBe("meters");
  });

  test("total with target unit conversion", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 1, unit: "km" },
      { type: "number" as const, value: 500, unit: "m" },
      { type: "number" as const, value: 100, unit: "cm" },
    ];

    const result = evaluate("total in m", vars, { previousResults });
    expect(result.value).toBe(1501); // 1000m + 500m + 1m
    expect(result.type === "number" && result.unit).toBe("m");
  });

  test("average with target unit conversion", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 100, unit: "km" },
      { type: "number" as const, value: 50, unit: "km" },
      { type: "number" as const, value: 30, unit: "km" },
    ];

    const result = evaluate("average in miles", vars, { previousResults });
    expect(result.value).toBeCloseTo(37.282, 2); // Average of 60 km in miles
    expect(result.type === "number" && result.unit).toBe("miles");
  });

  test("handles mixed compatible units without target", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 100, unit: "km" },
      { type: "number" as const, value: 50, unit: "miles" },
      { type: "number" as const, value: 30, unit: "km" },
    ];

    // With mixed compatible units and no target, converts to first unit
    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBeCloseTo(210.47, 1); // 100km + 80.47km + 30km
    expect(result.type === "number" && result.unit).toBe("km");
  });

  test("handles incompatible units without target", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 100, unit: "km" },
      { type: "number" as const, value: 50, unit: "kg" }, // Weight - incompatible with length
      { type: "number" as const, value: 30, unit: "seconds" }, // Time - incompatible with both
    ];

    // With incompatible units and no target, just sums raw values
    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBe(180);
    expect(result.type === "number" && result.unit).toBeUndefined();
  });

  test("handles values with and without units", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 100 },
      { type: "number" as const, value: 50, unit: "km" },
      { type: "number" as const, value: 25 },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result.value).toBe(175);
    expect(result.type === "number" && result.unit).toBe("km"); // Takes the first unit found
  });

  test("ignores incompatible units in conversion", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 100, unit: "km" },
      { type: "number" as const, value: 50, unit: "kg" }, // Weight - can't convert to km
      { type: "number" as const, value: 30, unit: "km" },
    ];

    const result = evaluate("total in km", vars, { previousResults });
    expect(result.value).toBe(130); // Only sums compatible units
    expect(result.type === "number" && result.unit).toBe("km");
  });

  test("parses total in unit syntax", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 100, unit: "cm" },
      { type: "number" as const, value: 200, unit: "cm" },
    ];

    // Test different syntax variations
    const result1 = evaluate("total in m", vars, { previousResults });
    expect(result1.value).toBe(3);
    expect(result1.type === "number" && result1.unit).toBe("m");

    const result2 = evaluate("total to m", vars, { previousResults });
    expect(result2.value).toBe(3);
    expect(result2.type === "number" && result2.unit).toBe("m");

    const result3 = evaluate("total as m", vars, { previousResults });
    expect(result3.value).toBe(3);
    expect(result3.type === "number" && result3.unit).toBe("m");
  });

  test("smart total adds time periods to dates", () => {
    const vars = new Map();

    // Create a specific date for testing
    const testDate = new Date("2025-01-01T10:00:00");

    const previousResults: CalculatedValue[] = [
      { type: "date" as const, value: testDate },
      { type: "number" as const, value: 2, unit: "days" },
      { type: "number" as const, value: 1, unit: "day" },
      { type: "number" as const, value: 1, unit: "hour" },
    ];

    const result = evaluate("total", vars, { previousResults });

    // Expected: Jan 1 + 2 days + 1 day + 1 hour = Jan 4, 11:00:00
    const expectedDate = new Date("2025-01-04T11:00:00");

    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.value.getTime()).toBe(expectedDate.getTime());
    }
  });

  test("smart total handles various time units", () => {
    const vars = new Map();

    const testDate = new Date("2025-01-01T00:00:00");

    const previousResults: CalculatedValue[] = [
      { type: "date" as const, value: testDate },
      { type: "number" as const, value: 1, unit: "week" },
      { type: "number" as const, value: 3, unit: "hours" },
      { type: "number" as const, value: 30, unit: "minutes" },
      { type: "number" as const, value: 45, unit: "seconds" },
    ];

    const result = evaluate("total", vars, { previousResults });

    // Expected: Jan 1 + 1 week + 3.5 hours + 45 seconds
    const expectedDate = new Date("2025-01-08T03:30:45");

    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.value.getTime()).toBe(expectedDate.getTime());
    }
  });

  test("smart total falls back to regular behavior without date", () => {
    const vars = new Map();

    // Only time periods, no date
    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: 2, unit: "days" },
      { type: "number" as const, value: 1, unit: "day" },
      { type: "number" as const, value: 24, unit: "hours" },
    ];

    const result = evaluate("total", vars, { previousResults });

    // Should sum to 4 days total (2 + 1 + 1)
    expect(result.value).toBe(4);
    expect(result.type === "number" && result.unit).toBe("days");
  });

  test("smart total requires exactly one date", () => {
    const vars = new Map();

    const date1 = new Date("2025-01-01T00:00:00");
    const date2 = new Date("2025-02-01T00:00:00");

    // Two dates - should fall back to regular behavior
    const previousResults: CalculatedValue[] = [
      { type: "date" as const, value: date1 },
      { type: "date" as const, value: date2 },
      { type: "number" as const, value: 1, unit: "day" },
    ];

    const result = evaluate("total", vars, { previousResults });

    // Should only sum the numeric values (1 day), ignoring the dates
    expect(result.value).toBe(1);
    expect(result.type === "number" && result.unit).toBe("day");
  });

  test("smart total respects target unit specification", () => {
    const vars = new Map();

    const testDate = new Date("2025-01-01T00:00:00");

    const previousResults: CalculatedValue[] = [
      { type: "date" as const, value: testDate },
      { type: "number" as const, value: 1, unit: "day" },
      { type: "number" as const, value: 24, unit: "hours" },
    ];

    // When target unit is specified, use regular behavior
    const result = evaluate("total in hours", vars, { previousResults });

    // Should convert everything to hours
    expect(result.value).toBe(48); // 1 day + 24 hours = 48 hours
    expect(result.type === "number" && result.unit).toBe("hours");
  });
});
