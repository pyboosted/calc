import { describe, expect, test } from "bun:test";
import { CalculatorEngine } from "../src/ui/calculator-engine";

describe("Compound Assignment Mutation During Recalculation", () => {
  test("+= should not accumulate values on recalculation", () => {
    // Create engine with initial content
    const engine = new CalculatorEngine(
      ["arr = []", "arr += [1]", "arr"].join("\n")
    );

    // Initial evaluation - array should have 1 element
    let lines = engine.getLines();
    expect(lines[2]?.result?.type).toBe("array");
    const result1 = lines[2]?.result;
    if (result1?.type === "array") {
      expect(result1.value).toHaveLength(1);
      expect(result1.value[0]?.value).toBe(1);
    }

    // Trigger recalculation by updating the first line
    engine.updateLine(0, "arr = []  # trigger recalc");

    // After recalculation, array should STILL have only 1 element
    lines = engine.getLines();
    expect(lines[2]?.result?.type).toBe("array");
    const result2 = lines[2]?.result;
    if (result2?.type === "array") {
      expect(result2.value).toHaveLength(1);
      expect(result2.value[0]?.value).toBe(1);
    }
  });

  test("multiple += operations should work correctly after recalculation", () => {
    const engine = new CalculatorEngine(
      [
        "numbers = []",
        "numbers += [10]",
        "numbers += [20]",
        "numbers += [30]",
        "numbers",
      ].join("\n")
    );

    // Check initial state
    const lines = engine.getLines();
    const numbersLine = lines[4];
    expect(numbersLine?.result?.type).toBe("array");
    expect(numbersLine?.result?.value).toHaveLength(3);
    if (numbersLine?.result?.type === "array") {
      expect(
        numbersLine.result.value.map((v) => {
          if (v.type === "number") {
            return v.value;
          }
          return null;
        })
      ).toEqual([10, 20, 30]);
    }

    // Trigger recalculation
    engine.updateLine(0, "numbers = []");

    // After recalculation, should still have 3 elements
    const linesAfter = engine.getLines();
    const numbersLineAfter = linesAfter[4];
    expect(numbersLineAfter?.result?.type).toBe("array");
    expect(numbersLineAfter?.result?.value).toHaveLength(3);
  });

  test("-= operations should work correctly after recalculation", () => {
    const engine = new CalculatorEngine(
      ["items = [1, 2, 3, 2]", "items -= 2", "items"].join("\n")
    );

    // Check initial state
    const lines = engine.getLines();
    const itemsLine = lines[2];
    expect(itemsLine?.result?.type).toBe("array");
    expect(itemsLine?.result?.value).toHaveLength(2);
    if (itemsLine?.result?.type === "array") {
      expect(
        itemsLine.result.value.map((v) => {
          if (v.type === "number") {
            return v.value;
          }
          return null;
        })
      ).toEqual([1, 3]);
    }

    // Trigger recalculation
    engine.updateLine(0, "items = [1, 2, 3, 2]");

    // After recalculation, should still have 2 elements
    const linesAfter = engine.getLines();
    const itemsLineAfter = linesAfter[2];
    expect(itemsLineAfter?.result?.type).toBe("array");
    expect(itemsLineAfter?.result?.value).toHaveLength(2);
  });
});
