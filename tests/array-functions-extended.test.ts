import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Extended Array Functions", () => {
  describe("shift - non-mutating", () => {
    test("shift removes first element", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3, 4]", env);
      const result = evaluate("shift(arr)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(3);
        expect(result.value.map((v) => v.value)).toEqual([2, 3, 4]);
      }

      // Original array should be unchanged
      const original = evaluate("arr", env);
      expect(original.type).toBe("array");
      if (original.type === "array") {
        expect(original.value.length).toBe(4);
      }
    });

    test("shift on empty array returns empty array", () => {
      const env = new Map();
      const result = evaluate("shift([])", env);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(0);
      }
    });
  });

  describe("unshift - non-mutating", () => {
    test("unshift adds elements at beginning", () => {
      const env = new Map();
      evaluate("arr = [3, 4, 5]", env);
      const result = evaluate("unshift(arr, 1, 2)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(5);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
      }

      // Original array should be unchanged
      const original = evaluate("arr", env);
      expect(original.type).toBe("array");
      if (original.type === "array") {
        expect(original.value.length).toBe(3);
      }
    });

    test("unshift can add single element", () => {
      const env = new Map();
      const result = evaluate("unshift([2, 3], 1)", env);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3]);
      }
    });
  });

  describe("append - non-mutating", () => {
    test("append concatenates two arrays", () => {
      const env = new Map();
      evaluate("arr1 = [1, 2, 3]", env);
      evaluate("arr2 = [4, 5, 6]", env);
      const result = evaluate("append(arr1, arr2)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(6);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5, 6]);
      }

      // Original arrays should be unchanged
      const original1 = evaluate("arr1", env);
      const original2 = evaluate("arr2", env);
      expect(original1.type).toBe("array");
      expect(original2.type).toBe("array");
      if (original1.type === "array" && original2.type === "array") {
        expect(original1.value.length).toBe(3);
        expect(original2.value.length).toBe(3);
      }
    });

    test("append with empty arrays", () => {
      const env = new Map();
      const result1 = evaluate("append([], [1, 2, 3])", env);
      const result2 = evaluate("append([1, 2, 3], [])", env);
      const result3 = evaluate("append([], [])", env);

      expect(result1.type).toBe("array");
      expect(result2.type).toBe("array");
      expect(result3.type).toBe("array");
      if (
        result1.type === "array" &&
        result2.type === "array" &&
        result3.type === "array"
      ) {
        expect(result1.value.map((v) => v.value)).toEqual([1, 2, 3]);
        expect(result2.value.map((v) => v.value)).toEqual([1, 2, 3]);
        expect(result3.value).toEqual([]);
      }
    });
  });

  describe("prepend - non-mutating", () => {
    test("prepend adds second array before first", () => {
      const env = new Map();
      evaluate("arr1 = [3, 4, 5]", env);
      evaluate("arr2 = [1, 2]", env);
      const result = evaluate("prepend(arr1, arr2)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(5);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
      }
    });
  });

  describe("shift! - mutating", () => {
    test("shift! mutates the original array", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3, 4]", env);
      const result = evaluate("shift!(arr)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(3);
        expect(result.value.map((v) => v.value)).toEqual([2, 3, 4]);
      }

      // Original array should be mutated
      const original = evaluate("arr", env);
      expect(original.type).toBe("array");
      if (original.type === "array") {
        expect(original.value.length).toBe(3);
        expect(original.value.map((v) => v.value)).toEqual([2, 3, 4]);
      }
    });
  });

  describe("unshift! - mutating", () => {
    test("unshift! mutates the original array", () => {
      const env = new Map();
      evaluate("arr = [3, 4, 5]", env);
      const result = evaluate("unshift!(arr, 1, 2)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(5);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
      }

      // Original array should be mutated
      const original = evaluate("arr", env);
      expect(original.type).toBe("array");
      if (original.type === "array") {
        expect(original.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
      }
    });
  });

  describe("append! - mutating", () => {
    test("append! mutates the first array", () => {
      const env = new Map();
      evaluate("arr1 = [1, 2, 3]", env);
      evaluate("arr2 = [4, 5, 6]", env);
      const result = evaluate("append!(arr1, arr2)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(6);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5, 6]);
      }

      // First array should be mutated
      const arr1 = evaluate("arr1", env);
      expect(arr1.type).toBe("array");
      if (arr1.type === "array") {
        expect(arr1.value.length).toBe(6);
        expect(arr1.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5, 6]);
      }

      // Second array should be unchanged
      const arr2 = evaluate("arr2", env);
      expect(arr2.type).toBe("array");
      if (arr2.type === "array") {
        expect(arr2.value.length).toBe(3);
        expect(arr2.value.map((v) => v.value)).toEqual([4, 5, 6]);
      }
    });
  });

  describe("prepend! - mutating", () => {
    test("prepend! mutates the first array", () => {
      const env = new Map();
      evaluate("arr1 = [3, 4, 5]", env);
      evaluate("arr2 = [1, 2]", env);
      const result = evaluate("prepend!(arr1, arr2)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(5);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
      }

      // First array should be mutated
      const arr1 = evaluate("arr1", env);
      expect(arr1.type).toBe("array");
      if (arr1.type === "array") {
        expect(arr1.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
      }

      // Second array should be unchanged
      const arr2 = evaluate("arr2", env);
      expect(arr2.type).toBe("array");
      if (arr2.type === "array") {
        expect(arr2.value.map((v) => v.value)).toEqual([1, 2]);
      }
    });
  });

  describe("Comparison: push vs append", () => {
    test("push adds element, append concatenates arrays", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);

      // push adds the array as a single element
      const pushed = evaluate("push(arr, [4, 5, 6])", env);
      expect(pushed.type).toBe("array");
      if (pushed.type === "array") {
        expect(pushed.value.length).toBe(4);
        // The last element is itself an array
        const lastElement = pushed.value[3];
        expect(lastElement?.type).toBe("array");
        if (lastElement?.type === "array") {
          expect(lastElement.value.map((v) => v.value)).toEqual([4, 5, 6]);
        }
      }

      // append concatenates the arrays
      const appended = evaluate("append(arr, [4, 5, 6])", env);
      expect(appended.type).toBe("array");
      if (appended.type === "array") {
        expect(appended.value.length).toBe(6);
        expect(appended.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5, 6]);
      }
    });
  });

  describe("Error handling", () => {
    test("append/prepend require arrays", () => {
      const env = new Map();

      expect(() => evaluate("append(123, [1, 2])", env)).toThrow(
        "First argument to append must be an array"
      );
      expect(() => evaluate("append([1, 2], 123)", env)).toThrow(
        "Second argument to append must be an array"
      );
      expect(() => evaluate("prepend!(123, [1, 2])", env)).toThrow(
        "First argument to prepend! must be an array"
      );
      expect(() => evaluate("prepend!([1, 2], 123)", env)).toThrow(
        "Second argument to prepend! must be an array"
      );
    });

    test("shift/unshift require correct arguments", () => {
      const env = new Map();

      expect(() => evaluate("shift(123)", env)).toThrow(
        "Argument to shift must be an array"
      );
      expect(() => evaluate("unshift!(123, 1)", env)).toThrow(
        "First argument to unshift! must be an array"
      );
    });
  });
});
