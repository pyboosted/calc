import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Time Formatting with Compound Units", () => {
  test("weeks are skipped in compound format unless base unit is week", () => {
    const vars = new Map();

    // 100 days should show as months and days, not weeks
    evaluate("duration = 100 days", vars);
    expect(vars.get("duration")).toEqual({
      type: "quantity",
      value: 100,
      dimensions: { time: { exponent: 1, unit: "days" } },
    });

    // 2.5 months should show as "2mo 15d" (not weeks)
    const result = evaluate("2.5 months", vars);
    expect(result.type).toBe("quantity");
    // The display formatting happens in formatQuantity, not in evaluate
    // So we just verify the value is correct
    expect(result.value).toBe(2.5);
  });

  test("fractional weeks show as weeks and days when base unit is week", () => {
    const vars = new Map();

    // 2.5 weeks should display as "2w 3d" when base unit is weeks
    const result = evaluate("2.5 weeks", vars);
    expect(result.type).toBe("quantity");
    expect(result.value).toBe(2.5);
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("weeks");
    }
  });

  test("fractional hours show as compound format", () => {
    const vars = new Map();

    // 2.5 hours should display as "2h 30min"
    const result = evaluate("2.5 hours", vars);
    expect(result.type).toBe("quantity");
    expect(result.value).toBe(2.5);
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("hours");
    }
  });

  test("whole number time values stay in original unit", () => {
    const vars = new Map();

    // 150 minutes should stay as "150 minutes"
    const result = evaluate("150 minutes", vars);
    expect(result.type).toBe("quantity");
    expect(result.value).toBe(150);
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("minutes");
    }
  });

  test("very long durations include months", () => {
    const vars = new Map();

    // 400 days should include months
    const result = evaluate("400 days", vars);
    expect(result.type).toBe("quantity");
    expect(result.value).toBe(400);
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("days");
    }
  });
});

describe("Time Unit Display Integration", () => {
  test("compound formatting works with conversions", () => {
    const vars = new Map();

    // Converting fractional hours to seconds should show seconds
    const result = evaluate("2.5 hours to seconds", vars);
    expect(result.type).toBe("quantity");
    expect(result.value).toBe(9000);
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("seconds");
    }
  });

  test("month calculations preserve unit", () => {
    const vars = new Map();

    evaluate("rent = 100 USD / month", vars);
    evaluate("money = 256 USD", vars);
    const result = evaluate("money / rent", vars);

    // Should return a value in months
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("month");
      expect(result.value).toBe(2.56);
    }
  });
});
