import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal } from "../src/utils/decimal-math";

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
        ["0 celsius in fahrenheit", 32, "fahrenheit", 10], // Use precision for floating point
        ["32 fahrenheit in celsius", 0, "celsius", 10], // Use precision for floating point
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

        expect(result.type).toBe("quantity");
        if (result.type === "quantity") {
          if (precision > 0) {
            expect(fromDecimal(result.value)).toBeCloseTo(
              expectedValue,
              precision
            );
          } else {
            expect(fromDecimal(result.value)).toBe(expectedValue);
          }
        }
        if (result.type === "quantity") {
          // Find which dimension has the unit
          for (const [_dim, info] of Object.entries(result.dimensions)) {
            if (info && "unit" in info && info.unit === expectedUnit) {
              expect(info.unit).toBe(expectedUnit);
              return;
            }
            if (info && "code" in info && info.code === expectedUnit) {
              expect(info.code).toBe(expectedUnit);
              return;
            }
          }
          throw new Error(`Expected unit ${expectedUnit} not found in result`);
        }
      }
    );
  });
});
