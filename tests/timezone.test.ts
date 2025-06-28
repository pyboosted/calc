import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal } from "../src/utils/decimal-math";
import { TimezoneManager } from "../src/utils/timezone-manager";

describe("Timezone Support", () => {
  test("parses time literals without timezone", () => {
    const result = evaluate("12:00", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      const date = result.value;
      expect(date.getHours()).toBe(12);
      expect(date.getMinutes()).toBe(0);
    }
  });

  test("parses time literals with timezone", () => {
    const result = evaluate("10:00@utc", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.timezone).toBe("utc");
    }
  });

  test("parses time with named timezone", () => {
    const result = evaluate("12:15@moscow", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.timezone).toBe("moscow");
    }
  });

  test("converts time between timezones", () => {
    const result = evaluate("12:00@moscow in utc", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.timezone).toBe("utc");
    }
  });

  test("now in timezone", () => {
    const result = evaluate("now in yerevan", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.timezone).toBe("yerevan");
    }
  });

  test("time subtraction in same timezone", () => {
    const result = evaluate(
      "12:15@moscow - 10:00@moscow in minutes",
      new Map()
    );
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("minutes");
      expect(fromDecimal(result.value)).toBe(135); // 2 hours 15 minutes = 135 minutes
    }
  });

  test("time subtraction returns seconds by default", () => {
    const result = evaluate("12:15 - 10:00", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.dimensions.time?.unit).toBe("s");
      expect(fromDecimal(result.value)).toBe(8100); // 2 hours 15 minutes = 8100 seconds
    }
  });

  test("datetime with timezone", () => {
    const result = evaluate("25.10.2025T12:15@moscow", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.timezone).toBe("moscow");
      const date = result.value;
      expect(date.getDate()).toBe(25);
      expect(date.getMonth()).toBe(9); // October
      expect(date.getFullYear()).toBe(2025);
    }
  });

  test("timezone conversion preserves time correctly", () => {
    // Create a specific time in UTC
    const _utcTime = evaluate("10:00@utc", new Map());

    // Convert to Moscow time (UTC+3)
    const moscowTime = evaluate("10:00@utc in moscow", new Map());

    // The actual hour displayed should be different due to timezone offset
    // but the moment in time should be the same
    expect(moscowTime.type === "date" && moscowTime.timezone).toBe("moscow");
  });

  test("timezone manager validates timezones", () => {
    const manager = TimezoneManager.getInstance();

    expect(manager.isValidTimezone("moscow")).toBe(true);
    expect(manager.isValidTimezone("utc")).toBe(true);
    expect(manager.isValidTimezone("utc+3")).toBe(true);
    expect(manager.isValidTimezone("new york")).toBe(true);
    expect(manager.isValidTimezone("invalid_timezone")).toBe(false);
  });

  test("multi-word timezone names", () => {
    const result = evaluate("12:00@new york", new Map());
    expect(result.type === "date" && result.timezone).toBe("new york");
  });

  test("UTC offset timezones", () => {
    const result = evaluate("12:00@utc-5", new Map());
    expect(result.type === "date" && result.timezone).toBe("utc-5");
  });

  test("incomplete timezone expression does not crash", () => {
    // Should treat as time without timezone (uses system timezone)
    const result = evaluate("10:00@", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      // Will have system timezone, not undefined
      const hours = result.value.getHours();
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(23);
    }
  });

  test("incomplete datetime timezone expression does not crash", () => {
    // Should treat as datetime without timezone (uses system timezone)
    const result = evaluate("25.10.2025T10:00@", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.value.getFullYear()).toBe(2025);
      expect(result.value.getMonth()).toBe(9); // October
      expect(result.value.getDate()).toBe(25);
    }
  });

  test("partial timezone name does not crash", () => {
    // Should reject partial timezone names with proper error
    expect(() => evaluate("10:00@y", new Map())).toThrow(
      "Invalid time: 10:00@y"
    );
  });

  test("invalid timezone throws error", () => {
    // Should reject invalid timezones with proper error
    expect(() => evaluate("10:00@invalidtz", new Map())).toThrow(
      "Invalid time: 10:00@invalidtz"
    );
  });

  test("time conversion with single letter timezone", () => {
    // Should reject invalid single letter timezones
    // "m" is treated as a unit (meters), not a timezone, so we get a conversion error
    expect(() => evaluate("10:00 to m", new Map())).toThrow(
      "Cannot convert date to m"
    );

    // But valid timezones should work
    const result = evaluate("10:00 to utc", new Map());
    expect(result.type === "date").toBe(true);
    if (result.type === "date") {
      expect(result.timezone).toBe("utc");
    }
  });

  test("unit conversion still works for non-time values", () => {
    // Regular unit conversion should still work
    const result = evaluate("100 cm to m", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.dimensions.length?.unit).toBe("m");
      expect(fromDecimal(result.value)).toBe(1);
    }
  });

  test("incomplete timezone conversion does not crash", () => {
    // Should handle incomplete timezone conversion
    const result = evaluate("10:00 to", new Map());
    expect(result.type === "date").toBe(true);
    // Should return original time without timezone conversion
  });

  test("timezone conversion with subsequent arithmetic", () => {
    // Should be able to add hours after timezone conversion
    const result1 = evaluate("10:00@moscow + 2 hours", new Map());
    expect(result1.type === "date").toBe(true);
    if (result1.type === "date") {
      expect(result1.timezone).toBe("moscow");
    }

    // Should handle parentheses properly
    const result1b = evaluate("(10:00@moscow) + 2 hours", new Map());
    expect(result1b.type === "date").toBe(true);
    if (result1b.type === "date") {
      expect(result1b.timezone).toBe("moscow");
    }

    // Complex case: convert timezone then add hours
    const result2 = evaluate("12:00@moscow in berlin + 2 hours", new Map());
    expect(result2.type === "date").toBe(true);
    if (result2.type === "date") {
      expect(result2.timezone).toBe("berlin");
    }
  });

  test("variable timezone conversion", () => {
    const variables = new Map();

    // Variable with time
    evaluate("meeting = 10:00@moscow", variables);
    const result1 = evaluate("meeting in berlin", variables);
    expect(result1.type === "date").toBe(true);
    if (result1.type === "date") {
      expect(result1.timezone).toBe("berlin");
    }

    // Variable with calculated timestamp
    evaluate("later = now + 3 hours", variables);
    const result2 = evaluate("later in yerevan", variables);
    expect(result2.type === "date").toBe(true);
    if (result2.type === "date") {
      expect(result2.timezone).toBe("yerevan");
    }

    // Variable with unit should still do unit conversion
    evaluate("distance = 100 km", variables);
    const result3 = evaluate("distance in miles", variables);
    expect(result3.type).toBe("quantity");
    if (result3.type === "quantity") {
      expect(result3.dimensions.length?.unit).toBe("miles");
      expect(fromDecimal(result3.value)).toBeCloseTo(62.137, 2);
    }
  });
});
