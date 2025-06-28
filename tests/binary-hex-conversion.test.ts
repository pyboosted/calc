import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Binary and Hex Conversions", () => {
  describe("Binary Conversions", () => {
    test("converts decimal to binary", () => {
      const result = evaluate("10 to binary", new Map());
      expect(result).toEqual({
        type: "string",
        value: "0b1010",
      });
    });

    test("converts zero to binary", () => {
      const result = evaluate("0 to binary", new Map());
      expect(result).toEqual({
        type: "string",
        value: "0b0",
      });
    });

    test("converts large number to binary", () => {
      const result = evaluate("255 to binary", new Map());
      expect(result).toEqual({
        type: "string",
        value: "0b11111111",
      });
    });

    test("throws error for decimal when converting to binary", () => {
      expect(() => evaluate("10.7 to binary", new Map())).toThrow(
        "Cannot convert non-integer value 10.7 to binary"
      );
    });

    test("converts negative numbers to binary", () => {
      const result = evaluate("-5 to binary", new Map());
      expect(result).toEqual({
        type: "string",
        value: "-0b101",
      });
    });
  });

  describe("Hex Conversions", () => {
    test("converts decimal to hex", () => {
      const result = evaluate("255 to hex", new Map());
      expect(result).toEqual({
        type: "string",
        value: "0xff",
      });
    });

    test("converts zero to hex", () => {
      const result = evaluate("0 to hex", new Map());
      expect(result).toEqual({
        type: "string",
        value: "0x0",
      });
    });

    test("converts large number to hex", () => {
      const result = evaluate("4095 to hex", new Map());
      expect(result).toEqual({
        type: "string",
        value: "0xfff",
      });
    });

    test("throws error for decimal when converting to hex", () => {
      expect(() => evaluate("255.9 to hex", new Map())).toThrow(
        "Cannot convert non-integer value 255.9 to hex"
      );
    });

    test("converts negative numbers to hex", () => {
      const result = evaluate("-255 to hex", new Map());
      expect(result).toEqual({
        type: "string",
        value: "-0xff",
      });
    });
  });

  describe("Binary and Hex Literals", () => {
    test("parses binary literals", () => {
      const result = evaluate("0b1010", new Map());
      expect(result).toEqual({
        type: "number",
        value: expect.objectContaining({
          // Decimal.js object representing 10
        }),
        format: "binary",
      });
      // Check the actual value
      if (result.type === "number") {
        expect(result.value.toNumber()).toBe(10);
      }
    });

    test("parses hex literals", () => {
      const result = evaluate("0xFF", new Map());
      expect(result).toEqual({
        type: "number",
        value: expect.objectContaining({
          // Decimal.js object representing 255
        }),
        format: "hex",
      });
      // Check the actual value
      if (result.type === "number") {
        expect(result.value.toNumber()).toBe(255);
      }
    });

    test("binary literal arithmetic", () => {
      const result = evaluate("0b1010 + 0b0101", new Map());
      expect(result).toEqual({
        type: "number",
        value: expect.objectContaining({
          // Decimal.js object representing 15
        }),
        format: "binary", // Format is preserved
      });
      if (result.type === "number") {
        expect(result.value.toNumber()).toBe(15);
      }
    });

    test("hex literal arithmetic", () => {
      const result = evaluate("0xFF + 0x01", new Map());
      expect(result).toEqual({
        type: "number",
        value: expect.objectContaining({
          // Decimal.js object representing 256
        }),
        format: "hex", // Format is preserved
      });
      if (result.type === "number") {
        expect(result.value.toNumber()).toBe(256);
      }
    });

    test("mixed literal arithmetic", () => {
      const result = evaluate("0xFF + 0b1111 + 10", new Map());
      expect(result).toEqual({
        type: "number",
        value: expect.objectContaining({
          // Decimal.js object representing 280 (255 + 15 + 10)
        }),
        format: "hex", // Format from leftmost formatted operand
      });
      if (result.type === "number") {
        expect(result.value.toNumber()).toBe(280);
      }
    });
  });

  describe("Error Handling", () => {
    test("throws error for non-numeric conversion to binary", () => {
      expect(() => evaluate('"hello" to binary', new Map())).toThrow(
        "Cannot convert string to binary"
      );
    });

    test("throws error for non-numeric conversion to hex", () => {
      expect(() => evaluate("true to hex", new Map())).toThrow(
        "Cannot convert boolean to hex"
      );
    });

    test("throws error for invalid binary literal", () => {
      expect(() => evaluate("0b2", new Map())).toThrow(
        "Invalid binary literal"
      );
    });

    test("throws error for invalid hex literal", () => {
      expect(() => evaluate("0xG", new Map())).toThrow("Invalid hex literal");
    });
  });

  describe("Complex Expressions", () => {
    test("converts result of calculation to binary", () => {
      const result = evaluate("(5 + 5) to binary", new Map());
      expect(result).toEqual({
        type: "string",
        value: "0b1010",
      });
    });

    test("converts result of calculation to hex", () => {
      const result = evaluate("(100 * 2 + 55) to hex", new Map());
      expect(result).toEqual({
        type: "string",
        value: "0xff",
      });
    });

    test("uses binary literal in calculation then converts to hex", () => {
      const result = evaluate("(0b11111111 + 1) to hex", new Map());
      expect(result).toEqual({
        type: "string",
        value: "0x100",
      });
    });

    test("uses hex literal in calculation then converts to binary", () => {
      const result = evaluate("(0xF + 1) to binary", new Map());
      expect(result).toEqual({
        type: "string",
        value: "0b10000",
      });
    });
  });
});
