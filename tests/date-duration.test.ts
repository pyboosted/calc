import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Date Duration Operations", () => {
  test("date - date returns quantity with time dimension", () => {
    const vars = new Map();
    evaluate("d1 = 01.01.2025", vars);
    evaluate("d2 = 25.12.2024", vars);

    const result = evaluate("d1 - d2", vars);
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(604_800); // 7 days in seconds
      expect(result.dimensions).toEqual({
        time: { exponent: 1, unit: "s" },
      });
    }
  });

  test("duration can be converted to different time units", () => {
    const vars = new Map();
    evaluate("future = 01.01.2025", vars);
    evaluate("past = 25.12.2024", vars);

    // Days
    const days = evaluate("future - past in days", vars);
    expect(days.type).toBe("quantity");
    if (days.type === "quantity") {
      expect(fromDecimal(days.value)).toBe(7);
      expect(days.dimensions).toEqual({
        time: { exponent: 1, unit: "days" },
      });
    }

    // Hours
    const hours = evaluate("future - past in hours", vars);
    expect(hours.type).toBe("quantity");
    if (hours.type === "quantity") {
      expect(fromDecimal(hours.value)).toBe(168);
      expect(hours.dimensions).toEqual({
        time: { exponent: 1, unit: "hours" },
      });
    }

    // Weeks
    const weeks = evaluate("future - past in weeks", vars);
    expect(weeks.type).toBe("quantity");
    if (weeks.type === "quantity") {
      expect(fromDecimal(weeks.value)).toBe(1);
      expect(weeks.dimensions).toEqual({
        time: { exponent: 1, unit: "weeks" },
      });
    }
  });

  test("duration arithmetic operations", () => {
    const vars = new Map();
    evaluate("d1 = 10.01.2025", vars);
    evaluate("d2 = 01.01.2025", vars);
    evaluate("duration = d1 - d2", vars);

    // Multiply duration
    const doubled = evaluate("duration * 2", vars);
    expect(doubled.type).toBe("quantity");
    if (doubled.type === "quantity") {
      expect(fromDecimal(doubled.value)).toBe(1_555_200); // 18 days in seconds
    }

    // Divide duration
    const halved = evaluate("duration / 2", vars);
    expect(halved.type).toBe("quantity");
    if (halved.type === "quantity") {
      expect(fromDecimal(halved.value)).toBe(388_800); // 4.5 days in seconds
    }
  });

  test("adding duration to date", () => {
    const vars = new Map();
    evaluate("start = 01.01.2025", vars);
    evaluate("end = 08.01.2025", vars);
    evaluate("week = end - start", vars);

    // Add duration to date should give us the same date as end
    const result = evaluate("start + week", vars);
    expect(result.type).toBe("date");

    // Check that start + (end - start) = end
    const endDate = vars.get("end");
    if (result.type === "date" && endDate?.type === "date") {
      expect(result.value.getTime()).toBe(endDate.value.getTime());
    }
  });

  test("negative durations work correctly", () => {
    const vars = new Map();
    evaluate("past = 01.01.2024", vars);
    evaluate("future = 01.01.2025", vars);

    const result = evaluate("past - future in days", vars);
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(fromDecimal(result.value)).toBe(-366); // 2024 is a leap year
      expect(result.dimensions).toEqual({
        time: { exponent: 1, unit: "days" },
      });
    }
  });
});
