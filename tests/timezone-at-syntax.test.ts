import { describe, expect, test } from "bun:test";
import { toZonedTime } from "date-fns-tz";
import { evaluate } from "../src/evaluator/evaluate";

describe("Timezone @ Syntax vs in/to Syntax", () => {
  test("now@timezone creates time in specified timezone", () => {
    const result1 = evaluate("now@ny");
    const result2 = evaluate("now in ny");

    expect(result1.type).toBe("date");
    expect(result2.type).toBe("date");

    if (result1.type === "date" && result2.type === "date") {
      expect(result1.timezone).toBe("ny");
      expect(result2.timezone).toBe("ny");

      // now@ny is the current instant labeled with NY timezone
      // now in ny is the current instant converted to NY timezone
      // They represent the same moment in time
      expect(
        Math.abs(result1.value.getTime() - result2.value.getTime())
      ).toBeLessThan(1000); // Allow 1 second difference
    }
  });

  test("today@timezone creates start of day in specified timezone", () => {
    const result = evaluate("today@tokyo");

    expect(result.type).toBe("date");
    if (result.type === "date") {
      expect(result.timezone).toBe("tokyo");

      // Should be midnight in Tokyo
      const tokyoTime = toZonedTime(result.value, "Asia/Tokyo");
      expect(tokyoTime.getHours()).toBe(0);
      expect(tokyoTime.getMinutes()).toBe(0);
      expect(tokyoTime.getSeconds()).toBe(0);
    }
  });

  test("today@timezone vs today in timezone show different times", () => {
    const result1 = evaluate("today@tokyo");
    const result2 = evaluate("today in tokyo");

    expect(result1.type).toBe("date");
    expect(result2.type).toBe("date");

    if (result1.type === "date" && result2.type === "date") {
      // today@tokyo is midnight in Tokyo
      // today in tokyo is local midnight converted to Tokyo time
      // These should be different unless you're in Tokyo timezone
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (localTz !== "Asia/Tokyo") {
        expect(result1.value.getTime()).not.toBe(result2.value.getTime());
      }
    }
  });

  test("time literals with @timezone", () => {
    const result = evaluate("15:30@paris");

    expect(result.type).toBe("date");
    if (result.type === "date") {
      expect(result.timezone).toBe("paris");

      // Should be 15:30 in Paris
      const parisTime = toZonedTime(result.value, "Europe/Paris");
      expect(parisTime.getHours()).toBe(15);
      expect(parisTime.getMinutes()).toBe(30);
    }
  });

  test("tomorrow@timezone and yesterday@timezone", () => {
    const tomorrow = evaluate("tomorrow@utc");
    const yesterday = evaluate("yesterday@utc");

    expect(tomorrow.type).toBe("date");
    expect(yesterday.type).toBe("date");

    if (tomorrow.type === "date" && yesterday.type === "date") {
      expect(tomorrow.timezone).toBe("utc");
      expect(yesterday.timezone).toBe("utc");

      // Should be exactly 2 days apart
      const diff = tomorrow.value.getTime() - yesterday.value.getTime();
      expect(diff).toBe(2 * 24 * 60 * 60 * 1000); // 2 days in milliseconds

      // Both should be at midnight UTC
      const tomorrowUTC = toZonedTime(tomorrow.value, "UTC");
      const yesterdayUTC = toZonedTime(yesterday.value, "UTC");

      expect(tomorrowUTC.getUTCHours()).toBe(0);
      expect(yesterdayUTC.getUTCHours()).toBe(0);
    }
  });
});
