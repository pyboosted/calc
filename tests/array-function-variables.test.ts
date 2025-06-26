import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Array Functions with Variables", () => {
  test("sum function with array literal", () => {
    const variables = new Map();
    const result = evaluate("sum([1, 2, 3])", variables);
    expect(result.type).toBe("number");
    expect(result.value).toBe(6);
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
    expect(sumResult.value).toBe(6);
  });

  test("avg function with array variable", () => {
    const variables = new Map();

    // First assign array to variable
    evaluate("numbers = [10, 20, 30]", variables);

    // Then use avg with the variable
    const avgResult = evaluate("avg(numbers)", variables);
    expect(avgResult.type).toBe("number");
    expect(avgResult.value).toBe(20);
  });

  test("other array functions with variables", () => {
    const variables = new Map();

    // Create test array
    evaluate("arr = [1, 2, 3, 4, 5]", variables);

    // Test various functions
    expect(evaluate("first(arr)", variables).value).toBe(1);
    expect(evaluate("last(arr)", variables).value).toBe(5);
    expect(evaluate("length(arr)", variables).value).toBe(5);

    // Test push (mutates array and returns new length)
    const pushResult = evaluate("push(arr, 6)", variables);
    expect(pushResult.type).toBe("number");
    expect(pushResult.value).toBe(6); // new length

    // Verify the array was mutated
    const arrAfterPush = variables.get("arr");
    expect(arrAfterPush.value.length).toBe(6);
    expect(arrAfterPush.value[5].value).toBe(6);
  });

  test("pop function with array variables", () => {
    const variables = new Map();

    evaluate("data = [1, 2, 3]", variables);

    // pop returns the removed element
    const popped = evaluate("pop(data)", variables);
    expect(popped.type).toBe("number");
    expect(popped.value).toBe(3);

    // Verify array was mutated
    const dataAfterPop = variables.get("data");
    expect(dataAfterPop.value.length).toBe(2);

    // Pop from empty array returns null
    evaluate("empty = []", variables);
    const poppedEmpty = evaluate("pop(empty)", variables);
    expect(poppedEmpty.type).toBe("null");
  });
});
