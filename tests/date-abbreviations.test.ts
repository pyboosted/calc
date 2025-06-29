import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Date Arithmetic with Abbreviations", () => {
  describe.each([
    [
      "hour",
      [
        ["testDate + 2h", 2, 1000 * 60 * 60],
        ["testDate + 3hr", 3, 1000 * 60 * 60],
      ],
    ],
    [
      "minute",
      [
        ["testDate + 30min", 30, 1000 * 60],
        ["testDate + 15m", 15, 1000 * 60],
      ],
    ],
    [
      "second",
      [
        ["testDate + 30s", 30, 1000],
        ["testDate + 45sec", 45, 1000],
      ],
    ],
  ])("%s abbreviations", (_unit, cases) => {
    test.each(cases as [string, number, number][])(
      "%s",
      (expression, expectedValue, divisor) => {
        const vars = new Map();
        const now = new Date();
        vars.set("testDate", {
          type: "date" as const,
          value: now,
        });

        const result = evaluate(expression, vars);
        expect(result.type === "date").toBe(true);
        if (result.type !== "date") {
          throw new Error("Result should be a date");
        }
        const diff = (result.value.getTime() - now.getTime()) / divisor;
        expect(diff).toBeCloseTo(expectedValue, 1);
      }
    );
  });

  test.each([
    ["today + 1d", "today", 1, "day"],
    ["today + 2w", "today", 14, "week"],
  ])(
    "%s (%s abbreviation)",
    (expression, baseExpression, expectedDays, _abbr) => {
      const vars = new Map();
      const base = evaluate(baseExpression, vars);
      const result = evaluate(expression, vars);

      if (!(result.type === "date" && base.type === "date")) {
        throw new Error("Results should be dates");
      }
      const dayDiff =
        (result.value.getTime() - base.value.getTime()) / (1000 * 60 * 60 * 24);
      expect(dayDiff).toBeCloseTo(expectedDays, 1);
    }
  );

  test("context determines m as minutes vs meters", () => {
    const vars = new Map();

    // In date context, 'm' should be minutes
    const now = new Date();
    vars.set("testDate", {
      type: "date" as const,
      value: now,
    });
    const dateResult = evaluate("testDate + 5m", vars);
    if (dateResult.type !== "date") {
      throw new Error("Result should be a date");
    }
    const minDiff = (dateResult.value.getTime() - now.getTime()) / (1000 * 60);
    expect(minDiff).toBeCloseTo(5, 1);

    // In unit conversion context, 'm' should be meters
    const unitResult = evaluate("100 cm to m", vars);
    expect(unitResult.type).toBe("quantity");
    if (unitResult.type === "quantity") {
      expect(fromDecimal(unitResult.value)).toBe(1);
      expect(unitResult.dimensions.length?.unit).toBe("m");
    }
  });

  test.each([
    "now + 1h",
    "now + 30min",
    "now + 5m",
    "now + 10s",
    "now - 1d",
    "now + 1w",
  ])("parses %s without errors", (expression) => {
    const vars = new Map();
    expect(() => evaluate(expression, vars)).not.toThrow();
  });
});
