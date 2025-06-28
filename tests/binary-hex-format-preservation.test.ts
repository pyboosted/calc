import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { formatResultWithUnit } from "../src/evaluator/unit-formatter";

describe("Binary and Hex Format Preservation", () => {
  test("preserves hex format for integer addition", () => {
    const result = evaluate("0xFF + 2", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(257);
      expect(result.format).toBe("hex");
      expect(formatResultWithUnit(result)).toBe("0x101");
    }
  });

  test("preserves binary format for integer addition", () => {
    const result = evaluate("0b1010 + 0b0101", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(15);
      expect(result.format).toBe("binary");
      expect(formatResultWithUnit(result)).toBe("0b1111");
    }
  });

  test("preserves hex format for integer subtraction", () => {
    const result = evaluate("0xFF - 0xF", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(240);
      expect(result.format).toBe("hex");
      expect(formatResultWithUnit(result)).toBe("0xf0");
    }
  });

  test("preserves format for integer multiplication", () => {
    const result = evaluate("0x10 * 2", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(32);
      expect(result.format).toBe("hex");
      expect(formatResultWithUnit(result)).toBe("0x20");
    }
  });

  test("loses format for non-integer division", () => {
    const result = evaluate("0xFF / 2", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(127.5);
      expect(result.format).toBeUndefined();
      expect(formatResultWithUnit(result)).toBe("127.5");
    }
  });

  test("preserves format for integer division", () => {
    const result = evaluate("0x100 / 2", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(128);
      expect(result.format).toBe("hex");
      expect(formatResultWithUnit(result)).toBe("0x80");
    }
  });

  test("preserves format for modulo operation", () => {
    const result = evaluate("0xFF % 0x10", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(15);
      expect(result.format).toBe("hex");
      expect(formatResultWithUnit(result)).toBe("0xf");
    }
  });

  // Note: Bitwise operations (&, |, <<, >>) are not currently fully supported in the calculator
  // The pipe operator (|) conflicts with bitwise OR
  // Shift operators (<<, >>) are tokenized as comparison operators

  test("preserves format for power operation when result is integer", () => {
    const result = evaluate("0x10 ^ 2", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(256);
      expect(result.format).toBe("hex");
      expect(formatResultWithUnit(result)).toBe("0x100");
    }
  });

  test("loses format for power operation when result is non-integer", () => {
    const result = evaluate("0x03 ^ 0.5", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBeCloseTo(1.732, 3);
      expect(result.format).toBeUndefined();
      // Check that it's formatted as a regular decimal
      const formatted = formatResultWithUnit(result);
      expect(formatted).not.toContain("0x");
      expect(formatted).not.toContain("0b");
    }
  });

  test("mixed format operations prefer left operand format", () => {
    const result = evaluate("0xFF + 0b1111", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(270);
      expect(result.format).toBe("hex"); // Left operand's format
      expect(formatResultWithUnit(result)).toBe("0x10e");
    }
  });

  test("format is lost when converting to decimal explicitly", () => {
    const result = evaluate("0xFF to decimal", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(255);
      expect(result.format).toBe("decimal");
      expect(formatResultWithUnit(result)).toBe("255");
    }
  });

  test("format is lost when combined with units", () => {
    const result = evaluate("0xFF m", new Map());
    expect(result.type).toBe("quantity");
    if (result.type === "quantity") {
      expect(result.value.toNumber()).toBe(255);
      expect(formatResultWithUnit(result)).toBe("255 m");
    }
  });

  test("complex expressions preserve format appropriately", () => {
    const result = evaluate("(0xFF + 1) * 2 - 0x10", new Map());
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(496);
      expect(result.format).toBe("hex");
      expect(formatResultWithUnit(result)).toBe("0x1f0");
    }
  });

  test("variables preserve format", () => {
    const variables = new Map();

    // Set a hex variable
    evaluate("a = 0xFF", variables);

    // Use it in calculation
    const result = evaluate("a + 1", variables);
    expect(result.type).toBe("number");
    if (result.type === "number") {
      expect(result.value.toNumber()).toBe(256);
      expect(result.format).toBe("hex");
      expect(formatResultWithUnit(result)).toBe("0x100");
    }
  });
});
