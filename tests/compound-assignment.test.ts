import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";

describe("Compound Assignment Operators", () => {
  describe("+= operator", () => {
    test.each([
      {
        name: "number += number",
        setup: "x = 10",
        operation: "x += 5",
        expectedType: "number",
        expectedValue: 15,
        checkVariable: true,
      },
      {
        name: "string += string",
        setup: 'msg = "Hello"',
        operation: 'msg += " World"',
        expectedType: "string",
        expectedValue: "Hello World",
        checkVariable: true,
      },
      {
        name: "string += number",
        setup: 'text = "Value: "',
        operation: "text += 42",
        expectedType: "string",
        expectedValue: "Value: 42",
      },
      {
        name: "number += percentage",
        setup: "price = 100",
        operation: "price += 10%",
        expectedType: "number",
        expectedValue: 110,
      },
    ])(
      "$name",
      ({ setup, operation, expectedType, expectedValue, checkVariable }) => {
        const variables = new Map<string, CalculatedValue>();
        evaluate(setup, variables);
        const result = evaluate(operation, variables);
        expect(result.type).toBe(
          expectedType as
            | "number"
            | "string"
            | "date"
            | "boolean"
            | "null"
            | "array"
            | "object"
        );
        expect(result.value).toBe(expectedValue);

        if (checkVariable) {
          const varName = operation.split(" ")[0];
          if (varName) {
            const storedVar = variables.get(varName);
            expect(storedVar).toBeDefined();
            if (storedVar) {
              expect(storedVar.value).toBe(expectedValue);
            }
          }
        }
      }
    );

    test("array += number (append single item)", () => {
      const variables = new Map<string, CalculatedValue>();
      evaluate("arr = [1, 2, 3]", variables);
      const result = evaluate("arr += 4", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(4);
        const item = result.value[3];
        if (item && item.type === "number") {
          expect(item.value).toBe(4);
        }
      }
    });

    test("array += array (concatenate arrays)", () => {
      const variables = new Map<string, CalculatedValue>();
      evaluate("a = [1, 2]", variables);
      const result = evaluate("a += [3, 4]", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(4);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4]);
      }
    });

    test("array += nested array", () => {
      const variables = new Map<string, CalculatedValue>();
      evaluate("a = [1, 2, 3, 4, 5]", variables);
      const result = evaluate("a += [[6, 7]]", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(6);
        const lastItem = result.value[5];
        expect(lastItem).toBeDefined();
        if (lastItem && lastItem.type === "array") {
          expect(lastItem.value.map((v) => v.value)).toEqual([6, 7]);
        }
      }
    });

    test("date += time period", () => {
      const variables = new Map<string, CalculatedValue>();
      evaluate("d = today", variables);
      const originalDateVal = variables.get("d");
      if (originalDateVal && originalDateVal.type === "date") {
        const originalDate = originalDateVal.value;
        const result = evaluate("d += 5 days", variables);
        expect(result.type).toBe("date");
        if (result.type === "date") {
          expect(result.value.getTime()).toBeGreaterThan(
            originalDate.getTime()
          );
        }
      }
    });
  });

  describe("-= operator", () => {
    test.each([
      {
        name: "number -= number",
        setup: "x = 20",
        operation: "x -= 8",
        expectedType: "number",
        expectedValue: 12,
        checkVariable: true,
      },
      {
        name: "string -= suffix",
        setup: 'filename = "document.txt"',
        operation: 'filename -= ".txt"',
        expectedType: "string",
        expectedValue: "document",
      },
    ])(
      "$name",
      ({ setup, operation, expectedType, expectedValue, checkVariable }) => {
        const variables = new Map<string, CalculatedValue>();
        evaluate(setup, variables);
        const result = evaluate(operation, variables);
        expect(result.type).toBe(
          expectedType as
            | "number"
            | "string"
            | "date"
            | "boolean"
            | "null"
            | "array"
            | "object"
        );
        expect(result.value).toBe(expectedValue);

        if (checkVariable) {
          const varName = operation.split(" ")[0];
          if (varName) {
            const storedVar = variables.get(varName);
            expect(storedVar).toBeDefined();
            if (storedVar) {
              expect(storedVar.value).toBe(expectedValue);
            }
          }
        }
      }
    );

    test("array -= single value (remove all occurrences)", () => {
      const variables = new Map<string, CalculatedValue>();
      evaluate("arr = [1, 2, 3, 2, 4]", variables);
      const result = evaluate("arr -= 2", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value.map((v) => v.value)).toEqual([1, 3, 4]);
      }
    });

    test("array -= array (remove all matching elements)", () => {
      const variables = new Map<string, CalculatedValue>();
      evaluate("arr = [1, 2, 3, 4, 5]", variables);
      const result = evaluate("arr -= [2, 4]", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value.map((v) => v.value)).toEqual([1, 3, 5]);
      }
    });

    test("date -= time period", () => {
      const variables = new Map<string, CalculatedValue>();
      evaluate("d = today", variables);
      const originalDateVal = variables.get("d");
      if (originalDateVal && originalDateVal.type === "date") {
        const originalDate = originalDateVal.value;
        const result = evaluate("d -= 3 days", variables);
        expect(result.type).toBe("date");
        if (result.type === "date") {
          expect(result.value.getTime()).toBeLessThan(originalDate.getTime());
        }
      }
    });
  });

  describe("Chained compound assignments", () => {
    test("multiple += operations", () => {
      const variables = new Map<string, CalculatedValue>();
      evaluate("sum = 0", variables);
      evaluate("sum += 10", variables);
      evaluate("sum += 20", variables);
      evaluate("sum += 30", variables);
      const result = variables.get("sum");
      expect(result).toBeDefined();
      if (result) {
        expect(result.type).toBe("number");
        expect(result.value).toBe(60);
      }
    });

    test("mixed compound assignments", () => {
      const variables = new Map<string, CalculatedValue>();
      evaluate("val = 100", variables);
      evaluate("val += 50", variables);
      evaluate("val -= 30", variables);
      const result = variables.get("val");
      expect(result).toBeDefined();
      if (result) {
        expect(result.type).toBe("number");
        expect(result.value).toBe(120);
      }
    });
  });

  describe("Edge cases", () => {
    test("undefined variable += value should throw", () => {
      const variables = new Map<string, CalculatedValue>();
      expect(() => evaluate("nonexistent += 5", variables)).toThrow();
    });

    test("array with mixed types", () => {
      const variables = new Map<string, CalculatedValue>();
      evaluate('arr = [1, "hello", true]', variables);
      const result = evaluate("arr += null", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(4);
        const lastItem = result.value[3];
        expect(lastItem).toBeDefined();
        if (lastItem) {
          expect(lastItem.type).toBe("null");
        }
      }
    });
  });
});

describe("Array + operator", () => {
  test.each([
    {
      expression: "[1, 2, 3] + 4",
      expectedLength: 4,
      expectedValues: [1, 2, 3, 4],
    },
    {
      expression: "[1, 2] + [3, 4]",
      expectedLength: 4,
      expectedValues: [1, 2, 3, 4],
    },
  ])("$expression", ({ expression, expectedLength, expectedValues }) => {
    const variables = new Map<string, CalculatedValue>();
    const result = evaluate(expression, variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(expectedLength);
      expect(result.value.map((v) => v.value)).toEqual(expectedValues);
    }
  });

  test("array + string", () => {
    const variables = new Map<string, CalculatedValue>();
    const result = evaluate('[1, 2, 3] + "hello"', variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(4);
      const item = result.value[3];
      if (item && item.type === "string") {
        expect(item.value).toBe("hello");
      }
    }
  });

  test("array + nested array", () => {
    const variables = new Map<string, CalculatedValue>();
    const result = evaluate("[1, 2] + [[3, 4]]", variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(3);
      const item = result.value[2];
      if (item && item.type === "array") {
        expect(item.value.map((v) => v.value)).toEqual([3, 4]);
      }
    }
  });
});

describe("Array - operator", () => {
  test.each([
    {
      expression: "[1, 2, 3, 2, 4] - 2",
      expectedLength: 3,
      expectedValues: [1, 3, 4],
    },
    {
      expression: "[1, 2, 3, 4, 5] - [2, 4]",
      expectedLength: 3,
      expectedValues: [1, 3, 5],
    },
    {
      expression: "[1, 2, 3] - 4",
      expectedLength: 3,
      expectedValues: [1, 2, 3],
    },
  ])("$expression", ({ expression, expectedLength, expectedValues }) => {
    const variables = new Map<string, CalculatedValue>();
    const result = evaluate(expression, variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(expectedLength);
      expect(result.value.map((v) => v.value)).toEqual(expectedValues);
    }
  });

  test("array - with mixed types", () => {
    const variables = new Map<string, CalculatedValue>();
    const result = evaluate('[1, "hello", 2, "world", 1] - 1', variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(3);
      const item0 = result.value[0];
      const item1 = result.value[1];
      const item2 = result.value[2];
      if (item0 && item0.type === "string") {
        expect(item0.value).toBe("hello");
      }
      if (item1 && item1.type === "number") {
        expect(item1.value).toBe(2);
      }
      if (item2 && item2.type === "string") {
        expect(item2.value).toBe("world");
      }
    }
  });
});
