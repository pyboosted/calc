import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";
import { fromDecimal, toDecimal } from "../src/utils/decimal-math";

describe("Aggregate Operations", () => {
  test("total sums previous numeric values", () => {
    const vars = new Map();

    // Simulate previous results: 10, 20, 30
    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: toDecimal(10) },
      { type: "number" as const, value: toDecimal(20) },
      { type: "number" as const, value: toDecimal(30) },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(60);
    } // 10 + 20 + 30
  });

  test("ignores non-numeric values", () => {
    const vars = new Map();

    // Mix of numeric and non-numeric results
    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: toDecimal(10) },
      { type: "date" as const, value: new Date() }, // Date result
      { type: "number" as const, value: toDecimal(20) },
      { type: "number" as const, value: toDecimal(Number.NaN) }, // Non-numeric value
      { type: "number" as const, value: toDecimal(30) },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(60);
    } // Only sums 10 + 20 + 30
  });

  test("throws error when no previous values", () => {
    const vars = new Map();

    expect(() => evaluate("total", vars, { previousResults: [] })).toThrow(
      "No values to total"
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
      {
        type: "quantity" as const,
        value: toDecimal(100),
        dimensions: { length: { exponent: 1, unit: "meters" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(200),
        dimensions: { length: { exponent: 1, unit: "meters" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(300),
        dimensions: { length: { exponent: 1, unit: "meters" } },
      },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(600);
      expect(result.dimensions.length?.unit).toBe("meters");
    }
  });

  test("total with target unit conversion", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      {
        type: "quantity" as const,
        value: toDecimal(1),
        dimensions: { length: { exponent: 1, unit: "km" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(500),
        dimensions: { length: { exponent: 1, unit: "m" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(100),
        dimensions: { length: { exponent: 1, unit: "cm" } },
      },
    ];

    const result = evaluate("total in m", vars, { previousResults });
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(1501); // 1000m + 500m + 1m
      expect(result.dimensions.length?.unit).toBe("m");
    }
  });

  test("handles mixed compatible units without target", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      {
        type: "quantity" as const,
        value: toDecimal(100),
        dimensions: { length: { exponent: 1, unit: "km" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(50),
        dimensions: { length: { exponent: 1, unit: "miles" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(30),
        dimensions: { length: { exponent: 1, unit: "km" } },
      },
    ];

    // With mixed compatible units and no target, converts to first unit
    const result = evaluate("total", vars, { previousResults });
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBeCloseTo(210.47, 1); // 100km + 80.47km + 30km
      expect(result.dimensions.length?.unit).toBe("km");
    }
  });

  test("handles incompatible units without target", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      {
        type: "quantity" as const,
        value: toDecimal(100),
        dimensions: { length: { exponent: 1, unit: "km" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(50),
        dimensions: { mass: { exponent: 1, unit: "kg" } },
      }, // Weight - incompatible with length
      {
        type: "quantity" as const,
        value: toDecimal(30),
        dimensions: { time: { exponent: 1, unit: "seconds" } },
      }, // Time - incompatible with both
    ];

    // With incompatible units and no target, just sums raw values
    const result = evaluate("total", vars, { previousResults });
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(180);
    }
  });

  test("handles values with and without units", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: toDecimal(100) },
      {
        type: "quantity" as const,
        value: toDecimal(50),
        dimensions: { length: { exponent: 1, unit: "km" } },
      },
      { type: "number" as const, value: toDecimal(25) },
    ];

    const result = evaluate("total", vars, { previousResults });
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(175);
      expect(result.dimensions.length?.unit).toBe("km"); // Takes the first unit found
    }
  });

  test("ignores incompatible units in conversion", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      {
        type: "quantity" as const,
        value: toDecimal(100),
        dimensions: { length: { exponent: 1, unit: "km" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(50),
        dimensions: { mass: { exponent: 1, unit: "kg" } },
      }, // Weight - can't convert to km
      {
        type: "quantity" as const,
        value: toDecimal(30),
        dimensions: { length: { exponent: 1, unit: "km" } },
      },
    ];

    const result = evaluate("total in km", vars, { previousResults });
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(130); // Only sums compatible units
      expect(result.dimensions.length?.unit).toBe("km");
    }
  });

  test("parses total in unit syntax", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      {
        type: "quantity" as const,
        value: toDecimal(100),
        dimensions: { length: { exponent: 1, unit: "cm" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(200),
        dimensions: { length: { exponent: 1, unit: "cm" } },
      },
    ];

    // Test different syntax variations
    const result1 = evaluate("total in m", vars, { previousResults });
    expect(result1.type).toBe("quantity");
    if (result1.type === "quantity") {
      expect(fromDecimal(result1.value)).toBe(3);
      expect(result1.dimensions.length?.unit).toBe("m");
    }

    const result2 = evaluate("total to m", vars, { previousResults });
    expect(result2.type).toBe("quantity");
    if (result2.type === "quantity") {
      expect(fromDecimal(result2.value)).toBe(3);
      expect(result2.dimensions.length?.unit).toBe("m");
    }

    const result3 = evaluate("total as m", vars, { previousResults });
    expect(result3.type).toBe("quantity");
    if (result3.type === "quantity") {
      expect(fromDecimal(result3.value)).toBe(3);
      expect(result3.dimensions.length?.unit).toBe("m");
    }
  });

  test("smart total adds time periods to dates", () => {
    const vars = new Map();

    // Create a specific date for testing
    const testDate = new Date("2025-01-01T10:00:00");

    const previousResults: CalculatedValue[] = [
      { type: "date" as const, value: testDate },
      {
        type: "quantity" as const,
        value: toDecimal(2),
        dimensions: { time: { exponent: 1, unit: "days" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(1),
        dimensions: { time: { exponent: 1, unit: "day" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(1),
        dimensions: { time: { exponent: 1, unit: "hour" } },
      },
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
      {
        type: "quantity" as const,
        value: toDecimal(1),
        dimensions: { time: { exponent: 1, unit: "week" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(3),
        dimensions: { time: { exponent: 1, unit: "hours" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(30),
        dimensions: { time: { exponent: 1, unit: "minutes" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(45),
        dimensions: { time: { exponent: 1, unit: "seconds" } },
      },
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
      {
        type: "quantity" as const,
        value: toDecimal(2),
        dimensions: { time: { exponent: 1, unit: "days" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(1),
        dimensions: { time: { exponent: 1, unit: "day" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(24),
        dimensions: { time: { exponent: 1, unit: "hours" } },
      },
    ];

    const result = evaluate("total", vars, { previousResults });

    // Should sum to 4 days total (2 + 1 + 1)
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(4);
      expect(result.dimensions.time?.unit).toBe("days");
    }
  });

  test("smart total requires exactly one date", () => {
    const vars = new Map();

    const date1 = new Date("2025-01-01T00:00:00");
    const date2 = new Date("2025-02-01T00:00:00");

    // Two dates - should fall back to regular behavior
    const previousResults: CalculatedValue[] = [
      { type: "date" as const, value: date1 },
      { type: "date" as const, value: date2 },
      {
        type: "quantity" as const,
        value: toDecimal(1),
        dimensions: { time: { exponent: 1, unit: "day" } },
      },
    ];

    const result = evaluate("total", vars, { previousResults });

    // Should only sum the numeric values (1 day), ignoring the dates
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(1);
      expect(result.dimensions.time?.unit).toBe("day");
    }
  });

  test("smart total respects target unit specification", () => {
    const vars = new Map();

    const testDate = new Date("2025-01-01T00:00:00");

    const previousResults: CalculatedValue[] = [
      { type: "date" as const, value: testDate },
      {
        type: "quantity" as const,
        value: toDecimal(1),
        dimensions: { time: { exponent: 1, unit: "day" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(24),
        dimensions: { time: { exponent: 1, unit: "hours" } },
      },
    ];

    // When target unit is specified, use regular behavior
    const result = evaluate("total in hours", vars, { previousResults });

    // Should convert everything to hours
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(48); // 1 day + 24 hours = 48 hours
      expect(result.dimensions.time?.unit).toBe("hours");
    }
  });

  test("agg collects values into array", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      {
        type: "quantity" as const,
        value: toDecimal(100),
        dimensions: { currency: { exponent: 1, code: "EUR" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(200),
        dimensions: { currency: { exponent: 1, code: "RUB" } },
      },
      {
        type: "quantity" as const,
        value: toDecimal(1),
        dimensions: { length: { exponent: 1, unit: "km" } },
      },
      { type: "string" as const, value: "hello" },
      { type: "number" as const, value: toDecimal(42) },
    ];

    const result = evaluate("agg", vars, { previousResults });
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(5);
      expect(result.value[0]?.type).toBe("quantity");
      expect(result.value[3]?.type).toBe("string");
      expect(result.value[4]?.type).toBe("number");
    }
  });

  test("aggregate is alias for agg", () => {
    const vars = new Map();

    const previousResults: CalculatedValue[] = [
      { type: "number" as const, value: toDecimal(1) },
      { type: "number" as const, value: toDecimal(2) },
      { type: "number" as const, value: toDecimal(3) },
    ];

    const result = evaluate("aggregate", vars, { previousResults });
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(3);
      expect(
        result.value.map((el: CalculatedValue) =>
          el.type === "number" ? fromDecimal(el.value) : null
        )
      ).toEqual([1, 2, 3]);
    }
  });
});
