import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";
import { fromDecimal } from "../src/utils/decimal-math";

// Top-level regex for performance
const TIME_FORMAT_REGEX = /^\d{2}:\d{2}$/;

describe("Timezone Keywords", () => {
  describe("now@timezone", () => {
    test("now@tokyo returns current time with Tokyo timezone", () => {
      const variables = new Map<string, CalculatedValue>();
      const result = evaluate("now@tokyo", variables);

      expect(result.type).toBe("date");
      if (result.type === "date") {
        expect(result.timezone).toBe("tokyo");
        // The time should be within a few seconds of now
        const now = new Date();
        expect(Math.abs(result.value.getTime() - now.getTime())).toBeLessThan(
          1000
        );
      }
    });

    test("now@utc returns current time with UTC timezone", () => {
      const variables = new Map<string, CalculatedValue>();
      const result = evaluate("now@utc", variables);

      expect(result.type).toBe("date");
      if (result.type === "date") {
        expect(result.timezone).toBe("utc");
      }
    });

    test("now@timezone displays in correct timezone", () => {
      const variables = new Map<string, CalculatedValue>();
      const result = evaluate("format(now@utc, 'HH:mm')", variables);

      expect(result.type).toBe("string");
      if (result.type === "string") {
        // The formatted time should be a valid time string
        expect(result.value).toMatch(TIME_FORMAT_REGEX);
      }
    });
  });

  describe("today@timezone", () => {
    test("today@tokyo returns start of day in Tokyo", () => {
      const variables = new Map<string, CalculatedValue>();
      const result = evaluate("today@tokyo", variables);

      expect(result.type).toBe("date");
      if (result.type === "date") {
        expect(result.timezone).toBe("tokyo");

        // Should be midnight in the specified timezone
        // We can't easily test the exact time without knowing the timezone offset
        // But we can verify it's a valid date
        expect(result.value instanceof Date).toBe(true);
      }
    });

    test("today@utc returns start of day in UTC", () => {
      const variables = new Map<string, CalculatedValue>();
      const result = evaluate("today@utc", variables);

      expect(result.type).toBe("date");
      if (result.type === "date") {
        expect(result.timezone).toBe("utc");
      }
    });

    test("today@timezone differs from today in local timezone", () => {
      const variables = new Map<string, CalculatedValue>();
      const localToday = evaluate("today", variables);
      const tokyoToday = evaluate("today@tokyo", variables);

      // They should be different timestamps (unless you're in Tokyo timezone)
      // We can't assert they're different because the test might run in Tokyo
      expect(localToday.type).toBe("date");
      expect(tokyoToday.type).toBe("date");
      if (tokyoToday.type === "date") {
        expect(tokyoToday.timezone).toBe("tokyo");
      }
    });
  });

  describe("tomorrow@timezone and yesterday@timezone", () => {
    test("tomorrow@utc returns start of tomorrow in UTC", () => {
      const variables = new Map<string, CalculatedValue>();
      const result = evaluate("tomorrow@utc", variables);

      expect(result.type).toBe("date");
      if (result.type === "date") {
        expect(result.timezone).toBe("utc");
      }
    });

    test("yesterday@utc returns start of yesterday in UTC", () => {
      const variables = new Map<string, CalculatedValue>();
      const result = evaluate("yesterday@utc", variables);

      expect(result.type).toBe("date");
      if (result.type === "date") {
        expect(result.timezone).toBe("utc");
      }
    });
  });

  describe("Timezone comparisons", () => {
    test("comparing times in different timezones", () => {
      const variables = new Map<string, CalculatedValue>();

      // 12:00 UTC is later than 12:00 Tokyo (which is 03:00 UTC)
      const result = evaluate("12:00@utc > 12:00@tokyo", variables);
      expect(result.type).toBe("boolean");
      if (result.type === "boolean") {
        expect(result.value).toBe(true);
      }
    });

    test("now is the same instant regardless of timezone", () => {
      const variables = new Map<string, CalculatedValue>();

      // now@tokyo and now@utc represent the same instant
      const result = evaluate("now@tokyo == now@utc", variables);
      expect(result.type).toBe("boolean");
      if (result.type === "boolean") {
        expect(result.value).toBe(true);
      }
    });

    test("today in different timezones are different", () => {
      const variables = new Map<string, CalculatedValue>();

      // today@tokyo and today@utc are different timestamps
      const result = evaluate("today@tokyo != today@utc", variables);
      expect(result.type).toBe("boolean");
      if (result.type === "boolean") {
        expect(result.value).toBe(true);
      }
    });
  });

  describe("Time arithmetic with timezones", () => {
    test("subtracting times in different timezones returns seconds", () => {
      const variables = new Map<string, CalculatedValue>();

      const result = evaluate("12:00@tokyo - 12:00@utc", variables);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.dimensions.time?.unit).toBe("s");
        // Tokyo is ahead of UTC, so 12:00 Tokyo is earlier than 12:00 UTC
        expect(fromDecimal(result.value)).toBeLessThan(0);
      }
    });

    test("subtracting now in different timezones returns 0", () => {
      const variables = new Map<string, CalculatedValue>();

      const result = evaluate("now@tokyo - now@moscow", variables);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(fromDecimal(result.value)).toBe(0);
        expect(result.dimensions.time?.unit).toBe("s");
      }
    });

    test("time difference can be converted to hours", () => {
      const variables = new Map<string, CalculatedValue>();

      const result = evaluate("(12:00@tokyo - 12:00@utc) in hours", variables);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.dimensions.time?.unit).toBe("hours");
        // Tokyo is UTC+9, so 12:00 Tokyo is 9 hours before 12:00 UTC
        expect(fromDecimal(result.value)).toBe(-9);
      }
    });
  });

  describe("Timezone preservation", () => {
    test("timezone is preserved through variable assignment", () => {
      const variables = new Map<string, CalculatedValue>();

      evaluate("tokyo_time = now@tokyo", variables);
      const result = variables.get("tokyo_time");

      expect(result?.type).toBe("date");
      if (result?.type === "date") {
        expect(result.timezone).toBe("tokyo");
      }
    });

    test("timezone is preserved in arithmetic results", () => {
      const variables = new Map<string, CalculatedValue>();

      const result = evaluate("now@tokyo + 1 hour", variables);
      expect(result.type).toBe("date");
      if (result.type === "date") {
        expect(result.timezone).toBe("tokyo");
      }
    });
  });

  describe("Invalid timezone handling", () => {
    test("invalid timezone throws an error", () => {
      const variables = new Map<string, CalculatedValue>();

      // The system should reject invalid timezones
      expect(() => evaluate("now@invalidtimezone123", variables)).toThrow(
        "Invalid date: now@invalidtimezone123"
      );
    });
  });

  describe("Format function with timezones", () => {
    test("format uses the date's timezone", () => {
      const variables = new Map<string, CalculatedValue>();

      // Create a specific time to test
      evaluate("test_time = 12:00@utc", variables);
      const formatted = evaluate("format(test_time, 'HH:mm')", variables);

      expect(formatted.type).toBe("string");
      if (formatted.type === "string") {
        // Should format as 12:00 since it's using UTC timezone
        expect(formatted.value).toBe("12:00");
      }
    });
  });
});

describe("Timezone Display", () => {
  test("time literals display in their specified timezone", () => {
    const variables = new Map<string, CalculatedValue>();

    const tokyo = evaluate("12:00@tokyo", variables);
    const utc = evaluate("12:00@utc", variables);

    expect(tokyo.type).toBe("date");
    if (tokyo.type === "date") {
      expect(tokyo.timezone).toBe("tokyo");
    }
    expect(utc.type).toBe("date");
    if (utc.type === "date") {
      expect(utc.timezone).toBe("utc");
    }

    // They should represent different absolute times
    if (tokyo.type === "date" && utc.type === "date") {
      expect(tokyo.value.getTime()).not.toBe(utc.value.getTime());
    }
  });

  test("date keywords with timezone display correctly", () => {
    const variables = new Map<string, CalculatedValue>();

    const nowTokyo = evaluate("now@tokyo", variables);
    const todayTokyo = evaluate("today@tokyo", variables);

    if (nowTokyo.type === "date") {
      expect(nowTokyo.timezone).toBe("tokyo");
    }
    if (todayTokyo.type === "date") {
      expect(todayTokyo.timezone).toBe("tokyo");
    }
  });
});
