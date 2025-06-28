import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Binary/Hex Conversion - Decimal Validation", () => {
  test("should throw error when converting decimal to binary", () => {
    expect(() => evaluate("3.14 to binary")).toThrow(
      "Cannot convert non-integer value 3.14 to binary"
    );
    expect(() => evaluate("2.5 to bin")).toThrow(
      "Cannot convert non-integer value 2.5 to bin"
    );
    expect(() => evaluate("10.1 to binary")).toThrow(
      "Cannot convert non-integer value 10.1 to binary"
    );
  });

  test("should throw error when converting decimal to hex", () => {
    expect(() => evaluate("3.14 to hex")).toThrow(
      "Cannot convert non-integer value 3.14 to hex"
    );
    expect(() => evaluate("2.5 to hexadecimal")).toThrow(
      "Cannot convert non-integer value 2.5 to hexadecimal"
    );
    expect(() => evaluate("15.7 to hex")).toThrow(
      "Cannot convert non-integer value 15.7 to hex"
    );
  });

  test("should work with integer values", () => {
    expect(evaluate("10 to binary").value).toBe("0b1010");
    expect(evaluate("255 to hex").value).toBe("0xff");
    expect(evaluate("16 to binary").value).toBe("0b10000");
    expect(evaluate("15 to hex").value).toBe("0xf");
  });

  test("should work with negative integers", () => {
    expect(evaluate("-10 to binary").value).toBe("-0b1010");
    expect(evaluate("-255 to hex").value).toBe("-0xff");
  });

  test("should work with zero", () => {
    expect(evaluate("0 to binary").value).toBe("0b0");
    expect(evaluate("0 to hex").value).toBe("0x0");
  });

  test("should throw error for very small decimals", () => {
    expect(() => evaluate("0.1 to binary")).toThrow(
      "Cannot convert non-integer value 0.1 to binary"
    );
    expect(() => evaluate("0.01 to hex")).toThrow(
      "Cannot convert non-integer value 0.01 to hex"
    );
  });

  test("should throw error for results of division that are non-integer", () => {
    expect(() => evaluate("10 / 3 to binary")).toThrow(
      "Cannot convert non-integer value"
    );
    expect(() => evaluate("7 / 2 to hex")).toThrow(
      "Cannot convert non-integer value"
    );
  });

  test("should work for results of division that are integer", () => {
    expect(evaluate("10 / 2 to binary").value).toBe("0b101");
    expect(evaluate("16 / 4 to hex").value).toBe("0x4");
  });
});
