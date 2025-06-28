import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Array Functions with Variables", () => {
  test("sum function with array literal", () => {
    const variables = new Map();
    const result = evaluate("sum([1, 2, 3])", variables);
    expect(result.type).toBe("number");
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(fromDecimal(result.value)).toBe(6);
    }
  });

  test("sum function with array variable", () => {
    const variables = new Map();

    // First assign array to variable
    const arrayResult = evaluate("a = [1, 2, 3]", variables);
    expect(arrayResult.type).toBe("array");
    expect(variables.has("a")).toBe(true);

    // Then use sum with the variable
    const sumResult = evaluate("sum(a)", variables);
    expect(sumResult.type).toBe("number");
    expect(sumResult.type).toBe("number");
    if (sumResult.type === "number") {
      expect(fromDecimal(sumResult.value)).toBe(6);
    }
  });

  test("avg function with array variable", () => {
    const variables = new Map();

    // First assign array to variable
    evaluate("numbers = [10, 20, 30]", variables);

    // Then use avg with the variable
    const avgResult = evaluate("avg(numbers)", variables);
    expect(avgResult.type).toBe("number");
    expect(avgResult.type).toBe("number");
    if (avgResult.type === "number") {
      expect(fromDecimal(avgResult.value)).toBe(20);
    }
  });

  test("other array functions with variables", () => {
    const variables = new Map();

    // Create test array
    evaluate("arr = [1, 2, 3, 4, 5]", variables);

    // Test various functions
    const first = evaluate("first(arr)", variables);
    expect(first.type).toBe("number");
    if (first.type === "number") {
      expect(fromDecimal(first.value)).toBe(1);
    }

    const last = evaluate("last(arr)", variables);
    expect(last.type).toBe("number");
    if (last.type === "number") {
      expect(fromDecimal(last.value)).toBe(5);
    }

    const length = evaluate("length(arr)", variables);
    expect(length.type).toBe("number");
    if (length.type === "number") {
      expect(fromDecimal(length.value)).toBe(5);
    }

    // Test push (returns new array without mutating original)
    const pushResult = evaluate("push(arr, 6)", variables);
    expect(pushResult.type).toBe("array");
    if (pushResult.type === "array") {
      expect(pushResult.value.length).toBe(6);
      expect(pushResult.value[5]?.type).toBe("number");
      if (pushResult.value[5]?.type === "number") {
        expect(fromDecimal(pushResult.value[5]?.value)).toBe(6);
      }
    }

    // Verify the original array was NOT mutated
    const arrAfterPush = variables.get("arr");
    if (arrAfterPush?.type === "array") {
      expect(arrAfterPush.value.length).toBe(5);
    }
  });

  test("pop function with array variables", () => {
    const variables = new Map();

    evaluate("data = [1, 2, 3]", variables);

    // pop returns new array without last element
    const popped = evaluate("pop(data)", variables);
    expect(popped.type).toBe("array");
    if (popped.type === "array") {
      expect(popped.value.length).toBe(2);
      expect(popped.value[0]?.type).toBe("number");
      if (popped.value[0]?.type === "number") {
        expect(fromDecimal(popped.value[0]?.value)).toBe(1);
      }
      expect(popped.value[1]?.type).toBe("number");
      if (popped.value[1]?.type === "number") {
        expect(fromDecimal(popped.value[1]?.value)).toBe(2);
      }
    }

    // Verify original array was NOT mutated
    const dataAfterPop = variables.get("data");
    expect(dataAfterPop.value.length).toBe(3);

    // Pop from empty array returns empty array
    evaluate("empty = []", variables);
    const poppedEmpty = evaluate("pop(empty)", variables);
    expect(poppedEmpty.type).toBe("array");
    if (poppedEmpty.type === "array") {
      expect(poppedEmpty.value.length).toBe(0);
    }
  });
});
