import { describe, expect, test } from "bun:test";
import type { DimensionMap } from "../src/evaluator/dimensions";
import { formatQuantity } from "../src/evaluator/unit-formatter";

describe("formatQuantity for time units", () => {
  test("fractional hours display as compound format", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "hours" },
    };
    const result = formatQuantity(2.5, dimensions);
    expect(result).toBe("2h 30min");
  });

  test("whole hours stay as hours", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "hours" },
    };
    const result = formatQuantity(3, dimensions);
    expect(result).toBe("3 hours");
  });

  test("fractional days show months and days", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "days" },
    };
    // 35.5 days = 1 month + 5.5 days (using 30.4375 days/month average)
    const result = formatQuantity(35.5, dimensions);
    expect(result).toBe("1mo 5d 1h 30min");
  });

  test("fractional weeks show weeks and days", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "weeks" },
    };
    const result = formatQuantity(2.5, dimensions);
    expect(result).toBe("2w 3d 12h");
  });

  test("fractional months show months and days", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "months" },
    };
    const result = formatQuantity(2.5, dimensions);
    expect(result).toBe("2mo 15d 5h 15min");
  });

  test("very small time values show seconds with precision", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "seconds" },
    };
    const result = formatQuantity(0.123, dimensions);
    expect(result).toBe("0.123s");
  });

  test("compound format skips zero components", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "hours" },
    };
    // Exactly 2 days in hours
    const result = formatQuantity(48.0, dimensions);
    expect(result).toBe("48 hours"); // Whole number stays in original unit

    // 2 days + 30 minutes
    const result2 = formatQuantity(48.5, dimensions);
    expect(result2).toBe("2d 30min");
  });

  test("negative durations work correctly", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "hours" },
    };
    const result = formatQuantity(-2.5, dimensions);
    expect(result).toBe("-2h 30min");
  });

  test("150 minutes stays as minutes", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "minutes" },
    };
    const result = formatQuantity(150, dimensions);
    expect(result).toBe("150 minutes");
  });

  test("2.5 minutes shows compound format", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "minutes" },
    };
    const result = formatQuantity(2.5, dimensions);
    expect(result).toBe("2min 30s");
  });

  test("100 days shows as months and days", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "days" },
    };
    // 100 days = 3 months + ~9.6 days (using 30.4375 days/month)
    const result = formatQuantity(100, dimensions);
    expect(result).toBe("100 days"); // Whole number stays in original unit

    // But 100.5 days would show compound
    const result2 = formatQuantity(100.5, dimensions);
    expect(result2).toBe("3mo 9d 4h 30min");
  });

  test("handles floating-point precision issues", () => {
    const dimensions: DimensionMap = {
      time: { exponent: 1, unit: "minutes" },
    };

    // 14.999999999999996 minutes should display as 15min, not 14min 60s
    const result = formatQuantity(14.999_999_999_999_996, dimensions);
    expect(result).toBe("15min");

    // 89.99999999 minutes should display as 1h 30min
    const result2 = formatQuantity(89.999_999_99, dimensions);
    expect(result2).toBe("1h 30min");

    // 2.999999999 hours should display as 3h
    const dimensions2: DimensionMap = {
      time: { exponent: 1, unit: "hours" },
    };
    const result3 = formatQuantity(2.999_999_999, dimensions2);
    expect(result3).toBe("3h");
  });
});
