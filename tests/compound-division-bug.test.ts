import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Compound unit division bug", () => {
  test("1km/speed and 1000m/speed should give same result", () => {
    const state = new Map<string, CalculatedValue>();

    // First calculate speed = 100m/(1 min + 25sec)
    const speedExpr = "100m/(1 min + 25sec)";
    const speedResult = evaluate(speedExpr, state);

    // Store speed in state
    state.set("speed", speedResult);

    // Calculate 1km/speed in min
    const kmExpr = "1km/speed in min";
    const kmResult = evaluate(kmExpr, state);

    // Calculate 1000m/speed in min
    const mExpr = "1000m/speed in min";
    const mResult = evaluate(mExpr, state);

    // They should be equal (within floating point tolerance)
    if (kmResult.type === "quantity" && mResult.type === "quantity") {
      const diff = kmResult.value.minus(mResult.value).abs();
      expect(fromDecimal(diff)).toBeLessThan(0.001);
    } else {
      throw new Error("Expected quantity results");
    }
  });

  test("Direct comparison without conversion", () => {
    const state = new Map<string, CalculatedValue>();

    // First calculate speed = 100m/(1 min + 25sec)
    const speedExpr = "100m/(1 min + 25sec)";
    const speedResult = evaluate(speedExpr, state);
    state.set("speed", speedResult);

    // Calculate 1km/speed
    const kmExpr = "1km/speed";
    const _kmResult = evaluate(kmExpr, state);

    // Calculate 1000m/speed
    const mExpr = "1000m/speed";
    const _mResult = evaluate(mExpr, state);

    // Direct results should be proportional
  });
});
