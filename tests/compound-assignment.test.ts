import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Compound Assignment Operators", () => {
  describe("+= operator", () => {
    test("number += number", () => {
      const variables = new Map();
      evaluate("x = 10", variables);
      const result = evaluate("x += 5", variables);
      expect(result.type).toBe("number");
      expect(result.value).toBe(15);
      expect(variables.get("x").value).toBe(15);
    });

    test("string += string", () => {
      const variables = new Map();
      evaluate('msg = "Hello"', variables);
      const result = evaluate('msg += " World"', variables);
      expect(result.type).toBe("string");
      expect(result.value).toBe("Hello World");
      expect(variables.get("msg").value).toBe("Hello World");
    });

    test("string += number", () => {
      const variables = new Map();
      evaluate('text = "Value: "', variables);
      const result = evaluate("text += 42", variables);
      expect(result.type).toBe("string");
      expect(result.value).toBe("Value: 42");
    });

    test("array += number (append single item)", () => {
      const variables = new Map();
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
      const variables = new Map();
      evaluate("a = [1, 2]", variables);
      const result = evaluate("a += [3, 4]", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(4);
        expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4]);
      }
    });

    test("array += nested array", () => {
      const variables = new Map();
      evaluate("a = [1, 2, 3, 4, 5]", variables);
      const result = evaluate("a += [[6, 7]]", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(6);
        expect(result.value[5].type).toBe("array");
        if (result.value[5].type === "array") {
          expect(result.value[5].value.map((v) => v.value)).toEqual([6, 7]);
        }
      }
    });

    test("date += time period", () => {
      const variables = new Map();
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
    test("number -= number", () => {
      const variables = new Map();
      evaluate("x = 20", variables);
      const result = evaluate("x -= 8", variables);
      expect(result.type).toBe("number");
      expect(result.value).toBe(12);
      expect(variables.get("x").value).toBe(12);
    });

    test("string -= suffix", () => {
      const variables = new Map();
      evaluate('filename = "document.txt"', variables);
      const result = evaluate('filename -= ".txt"', variables);
      expect(result.type).toBe("string");
      expect(result.value).toBe("document");
    });

    test("array -= single value (remove all occurrences)", () => {
      const variables = new Map();
      evaluate("arr = [1, 2, 3, 2, 4]", variables);
      const result = evaluate("arr -= 2", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value.map((v) => v.value)).toEqual([1, 3, 4]);
      }
    });

    test("array -= array (remove all matching elements)", () => {
      const variables = new Map();
      evaluate("arr = [1, 2, 3, 4, 5]", variables);
      const result = evaluate("arr -= [2, 4]", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(3);
        expect(result.value.map((v) => v.value)).toEqual([1, 3, 5]);
      }
    });

    test("date -= time period", () => {
      const variables = new Map();
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
      const variables = new Map();
      evaluate("sum = 0", variables);
      evaluate("sum += 10", variables);
      evaluate("sum += 20", variables);
      evaluate("sum += 30", variables);
      const result = variables.get("sum");
      expect(result.type).toBe("number");
      expect(result.value).toBe(60);
    });

    test("mixed compound assignments", () => {
      const variables = new Map();
      evaluate("val = 100", variables);
      evaluate("val += 50", variables);
      evaluate("val -= 30", variables);
      const result = variables.get("val");
      expect(result.type).toBe("number");
      expect(result.value).toBe(120);
    });
  });

  describe("Edge cases", () => {
    test("undefined variable += value should throw", () => {
      const variables = new Map();
      expect(() => evaluate("nonexistent += 5", variables)).toThrow();
    });

    test("number += percentage", () => {
      const variables = new Map();
      evaluate("price = 100", variables);
      const result = evaluate("price += 10%", variables);
      expect(result.type).toBe("number");
      expect(result.value).toBe(110);
    });

    test("array with mixed types", () => {
      const variables = new Map();
      evaluate('arr = [1, "hello", true]', variables);
      const result = evaluate("arr += null", variables);
      expect(result.type).toBe("array");
      if (result.type === "array") {
        expect(result.value).toHaveLength(4);
        expect(result.value[3].type).toBe("null");
      }
    });
  });
});

describe("Array + operator", () => {
  test("array + single value", () => {
    const variables = new Map();
    const result = evaluate("[1, 2, 3] + 4", variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(4);
      expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4]);
    }
  });

  test("array + array", () => {
    const variables = new Map();
    const result = evaluate("[1, 2] + [3, 4]", variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(4);
      expect(result.value.map((v) => v.value)).toEqual([1, 2, 3, 4]);
    }
  });

  test("array + string", () => {
    const variables = new Map();
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
    const variables = new Map();
    const result = evaluate("[1, 2] + [[3, 4]]", variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(3);
      const item = result.value[2];
      if (item && item.type === "array") {
        expect(item.value.map((v: any) => v.value)).toEqual([3, 4]);
      }
    }
  });
});

describe("Array - operator", () => {
  test("array - single value", () => {
    const variables = new Map();
    const result = evaluate("[1, 2, 3, 2, 4] - 2", variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(3);
      expect(result.value.map((v) => v.value)).toEqual([1, 3, 4]);
    }
  });

  test("array - array", () => {
    const variables = new Map();
    const result = evaluate("[1, 2, 3, 4, 5] - [2, 4]", variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(3);
      expect(result.value.map((v) => v.value)).toEqual([1, 3, 5]);
    }
  });

  test("array - non-existent value", () => {
    const variables = new Map();
    const result = evaluate("[1, 2, 3] - 4", variables);
    expect(result.type).toBe("array");
    if (result.type === "array") {
      expect(result.value).toHaveLength(3);
      expect(result.value.map((v) => v.value)).toEqual([1, 2, 3]);
    }
  });

  test("array - with mixed types", () => {
    const variables = new Map();
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
