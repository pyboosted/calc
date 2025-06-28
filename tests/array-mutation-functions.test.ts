import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Array Mutation Functions", () => {
  describe("push! - mutating", () => {
    test("push! mutates the original array", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);
      const result = evaluate("push!(arr, 4)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(4);
        expect(result.value[3]?.value).toBe(4);
      }

      // Original array should be mutated
      const original = evaluate("arr", env);
      expect(original.type).toBe("array");
      if (original.type === "array") {
        expect(original.value.length).toBe(4);
        expect(original.value[3]?.value).toBe(4);
      }
    });

    test("push! can add multiple elements", () => {
      const env = new Map();
      evaluate("arr = [1, 2]", env);
      const result = evaluate("push!(arr, 3, 4, 5)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(5);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4, 5]);
      }
    });

    test("push! returns the mutated array", () => {
      const env = new Map();
      evaluate("arr = [1]", env);
      evaluate("result = push!(arr, 2)", env);

      const arr = evaluate("arr", env);
      const result = evaluate("result", env);

      // Both should reference the same array
      expect(arr.type).toBe("array");
      expect(result.type).toBe("array");
      if (arr.type === "array" && result.type === "array") {
        expect(arr.value).toEqual(result.value);
      }
    });
  });

  describe("pop! - mutating", () => {
    test("pop! mutates the original array", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);
      const result = evaluate("pop!(arr)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(2);
        expect(result.value.map((v) => v.value)).toEqual([1, 2]);
      }

      // Original array should be mutated
      const original = evaluate("arr", env);
      expect(original.type).toBe("array");
      if (original.type === "array") {
        expect(original.value.length).toBe(2);
      }
    });

    test("pop! on empty array does nothing", () => {
      const env = new Map();
      evaluate("arr = []", env);
      const result = evaluate("pop!(arr)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(0);
      }
    });
  });

  describe("slice! - mutating", () => {
    test("slice! mutates the original array", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3, 4, 5]", env);
      const result = evaluate("slice!(arr, 1, 4)", env);

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

    test("slice! without end parameter", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3, 4, 5]", env);
      const result = evaluate("slice!(arr, 2)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.map((v) => v.value)).toEqual([3, 4, 5]);
      }
    });
  });

  describe("filter! - mutating", () => {
    test("filter! mutates the original array", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3, 4, 5]", env);
      const result = evaluate("filter!(arr, x => x > 2)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(3);
        expect(result.value.map((v) => v.value)).toEqual([3, 4, 5]);
      }

      // Original array should be mutated
      const original = evaluate("arr", env);
      expect(original.type).toBe("array");
      if (original.type === "array") {
        expect(original.value.length).toBe(3);
        expect(original.value.map((v) => v.value)).toEqual([3, 4, 5]);
      }
    });

    test("filter! with no matches empties the array", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);
      const result = evaluate("filter!(arr, x => x > 10)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(0);
      }
    });

    test("filter! uses truthiness", () => {
      const env = new Map();
      evaluate('arr = [0, "", false, null, 5, "hello"]', env);
      const result = evaluate("filter!(arr, x => x)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(2);
        expect(result.value[0]?.value).toBe(5);
        expect(result.value[1]?.value).toBe("hello");
      }
    });
  });

  describe("map! - mutating", () => {
    test("map! mutates the original array", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);
      const result = evaluate("map!(arr, x => x * 2)", env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(3);
        expect(result.value.map((v) => v.value)).toEqual([2, 4, 6]);
      }

      // Original array should be mutated
      const original = evaluate("arr", env);
      expect(original.type).toBe("array");
      if (original.type === "array") {
        expect(original.value.map((v) => v.value)).toEqual([2, 4, 6]);
      }
    });

    test("map! can change types", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);
      const result = evaluate('map!(arr, x => "num: " + x)', env);

      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value.length).toBe(3);
        expect(result.value[0]?.value).toBe("num: 1");
        expect(result.value[1]?.value).toBe("num: 2");
        expect(result.value[2]?.value).toBe("num: 3");
      }
    });
  });

  describe("Comparison with non-mutating versions", () => {
    test("push vs push!", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);

      // Non-mutating push
      evaluate("new_arr = push(arr, 4)", env);
      const arr1 = evaluate("arr", env);
      const new_arr = evaluate("new_arr", env);

      expect(arr1.type).toBe("array");
      if (arr1.type === "array") {
        expect(arr1.value.length).toBe(3); // Original unchanged
      }

      expect(new_arr.type).toBe("array");
      if (new_arr.type === "array") {
        expect(new_arr.value.length).toBe(4); // New array has 4 elements
      }

      // Mutating push!
      evaluate("push!(arr, 5)", env);
      const arr2 = evaluate("arr", env);

      expect(arr2.type).toBe("array");
      if (arr2.type === "array") {
        expect(arr2.value.length).toBe(4); // Original is mutated
        expect(arr2.value[3]?.value).toBe(5);
      }
    });
  });

  describe("Error handling", () => {
    test("mutation functions require correct argument types", () => {
      const env = new Map();

      expect(() => evaluate("push!(123, 4)", env)).toThrow(
        "First argument to push! must be an array"
      );

      expect(() => evaluate('pop!("not array")', env)).toThrow(
        "Argument to pop! must be an array"
      );

      expect(() => evaluate("filter!([1, 2, 3], 123)", env)).toThrow(
        "Second argument to filter! must be a lambda function"
      );

      expect(() => evaluate("map!([1, 2, 3], true)", env)).toThrow(
        "Second argument to map! must be a lambda function"
      );
    });

    test("slice! requires valid indices", () => {
      const env = new Map();
      evaluate("arr = [1, 2, 3]", env);

      expect(() => evaluate('slice!(arr, "not number")', env)).toThrow(
        "Start index must be a number"
      );

      expect(() => evaluate('slice!(arr, 1, "not number")', env)).toThrow(
        "End index must be a number"
      );
    });
  });
});
