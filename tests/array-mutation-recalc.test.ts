import { describe, expect, test } from "bun:test";
import { CalculatorEngine } from "../src/ui/calculator-engine";

describe("Array Mutation During Recalculation", () => {
  test("push should not accumulate values on recalculation", () => {
    // Create engine with initial content
    const engine = new CalculatorEngine(
      ["arr = []", "push(arr, 1)", "arr"].join("\n")
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
    // If the bug exists, it would have 2 elements
    lines = engine.getLines();
    expect(lines[2]?.result?.type).toBe("array");
    const result2 = lines[2]?.result;
    if (result2?.type === "array") {
      expect(result2.value).toHaveLength(1);
      expect(result2.value[0]?.value).toBe(1);
    }

    // Trigger another recalculation
    engine.updateLine(0, "arr = []  # trigger recalc 2");

    // Should still have only 1 element, not 3
    lines = engine.getLines();
    expect(lines[2]?.result?.type).toBe("array");
    const result4 = lines[2]?.result;
    if (result4?.type === "array") {
      expect(result4.value).toHaveLength(1);
      expect(result4.value[0]?.value).toBe(1);
    }
  });

  test("multiple push operations should work correctly after recalculation", () => {
    const engine = new CalculatorEngine(
      [
        "numbers = []",
        "push(numbers, 10)",
        "push(numbers, 20)",
        "push(numbers, 30)",
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
    if (numbersLineAfter?.result?.type === "array") {
      expect(
        numbersLineAfter.result.value.map((v) => {
          if (v.type === "number") {
            return v.value;
          }
          return null;
        })
      ).toEqual([10, 20, 30]);
    }
  });

  test("pop operations should work correctly after recalculation", () => {
    const engine = new CalculatorEngine(
      ["items = [1, 2, 3]", "pop(items)", "items"].join("\n")
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
      ).toEqual([1, 2]);
    }

    // Trigger recalculation
    engine.updateLine(0, "items = [1, 2, 3]");

    // After recalculation, should still have 2 elements
    const linesAfter = engine.getLines();
    const itemsLineAfter = linesAfter[2];
    expect(itemsLineAfter?.result?.type).toBe("array");
    expect(itemsLineAfter?.result?.value).toHaveLength(2);
    if (itemsLineAfter?.result?.type === "array") {
      expect(
        itemsLineAfter.result.value.map((v) => {
          if (v.type === "number") {
            return v.value;
          }
          return null;
        })
      ).toEqual([1, 2]);
    }
  });

  test("nested arrays should be properly cloned", () => {
    const engine = new CalculatorEngine(
      ["matrix = [[1, 2], [3, 4]]", "push(matrix[0], 5)", "matrix"].join("\n")
    );

    // Check initial state
    const lines = engine.getLines();
    const matrixLine = lines[2];
    expect(matrixLine?.result?.type).toBe("array");
    if (matrixLine?.result?.type === "array") {
      const matrix = matrixLine.result.value;
      if (matrix[0]?.type === "array") {
        expect(matrix[0].value).toHaveLength(3);
        expect(
          matrix[0].value.map((v) => {
            if (v.type === "number") {
              return v.value;
            }
            return null;
          })
        ).toEqual([1, 2, 5]);
      }
    }

    // Trigger recalculation
    engine.updateLine(0, "matrix = [[1, 2], [3, 4]]");

    // After recalculation, should still be correctly mutated
    const linesAfter = engine.getLines();
    const matrixLineAfter = linesAfter[2];
    if (matrixLineAfter?.result?.type === "array") {
      const matrixAfter = matrixLineAfter.result.value;
      if (matrixAfter[0]?.type === "array") {
        expect(matrixAfter[0].value).toHaveLength(3);
        expect(
          matrixAfter[0].value.map((v) => {
            if (v.type === "number") {
              return v.value;
            }
            return null;
          })
        ).toEqual([1, 2, 5]);
      }
    }
  });

  test("objects with arrays should be properly cloned", () => {
    const engine = new CalculatorEngine(
      [
        'data = {nums: [1, 2, 3], name: "test"}',
        "push(data.nums, 4)",
        "data",
      ].join("\n")
    );

    // Check initial state
    const lines = engine.getLines();
    const dataLine = lines[2];
    expect(dataLine?.result?.type).toBe("object");
    if (dataLine?.result?.type === "object") {
      const nums = dataLine.result.value.get("nums");
      if (nums?.type === "array") {
        expect(nums.value).toHaveLength(4);
        expect(
          nums.value.map((v) => {
            if (v.type === "number") {
              return v.value;
            }
            return null;
          })
        ).toEqual([1, 2, 3, 4]);
      }
    }

    // Trigger recalculation
    engine.updateLine(0, 'data = {nums: [1, 2, 3], name: "test"}');

    // After recalculation, should still be correctly mutated
    const linesAfter = engine.getLines();
    const dataLineAfter = linesAfter[2];
    if (dataLineAfter?.result?.type === "object") {
      const numsAfter = dataLineAfter.result.value.get("nums");
      if (numsAfter?.type === "array") {
        expect(numsAfter.value).toHaveLength(4);
        expect(
          numsAfter.value.map((v) => {
            if (v.type === "number") {
              return v.value;
            }
            return null;
          })
        ).toEqual([1, 2, 3, 4]);
      }
    }
  });
});
