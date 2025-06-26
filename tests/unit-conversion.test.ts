import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Unit Conversions", () => {
  describe.each([
    [
      "Length",
      [
        ["100 cm in meters", 1, "meters", 0],
        ["1 km in miles", 0.621_371, "miles", 5],
        ["10 feet in meters", 3.048, "meters", 3],
      ],
    ],
    [
      "Weight",
      [
        ["1 kg in pounds", 2.204_62, "pounds", 5],
        ["1000 grams in kg", 1, "kg", 0],
      ],
    ],
    [
      "Temperature",
      [
        ["0 celsius in fahrenheit", 32, "fahrenheit", 0],
        ["32 fahrenheit in celsius", 0, "celsius", 0],
      ],
    ],
    [
      "Time",
      [
        ["2 hours in minutes", 120, "minutes", 0],
        ["1 day in hours", 24, "hours", 0],
      ],
    ],
    [
      "Data",
      [
        ["1 gb in mb", 1000, "mb", 0],
        ["1 kb in bytes", 1000, "bytes", 0],
      ],
    ],
  ])("%s", (_category, conversions) => {
    test.each(conversions as [string, number, string, number][])(
      "%s",
      (expression, expectedValue, expectedUnit, precision) => {
        const result = evaluate(expression, new Map());

        if (precision > 0) {
          expect(result.value).toBeCloseTo(expectedValue, precision);
        } else {
          expect(result.value).toBe(expectedValue);
        }

        expect(result.type === "number" && result.unit).toBe(expectedUnit);
      }
    );
  });
});
