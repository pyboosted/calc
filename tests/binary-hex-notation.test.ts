import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import { formatResultWithUnit } from "../src/evaluator/unit-formatter";
import type { CalculatedValue } from "../src/types";

// Helper function to evaluate expressions
function evaluateExpression(input: string, variables = new Map()) {
  try {
    const result = evaluate(input, variables);
    return { result, error: null };
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

describe("Binary and Hex Notation", () => {
  describe("Binary Literals", () => {
    test.each([
      { input: "0b1010", expected: 10 },
      { input: "0B1111", expected: 15 },
      { input: "0b0", expected: 0 },
      { input: "0b1", expected: 1 },
      { input: "0b11111111", expected: 255 },
      { input: "0b100000000", expected: 256 },
    ])(
      "should parse binary literal $input as $expected",
      ({ input, expected }) => {
        const { result } = evaluateExpression(input);
        expect(result).toBeTruthy();
        expect(result?.type).toBe("number");
        if (result?.type === "number") {
          expect(result.value.toNumber()).toBe(expected);
          expect(result.format).toBe("binary");
        }
      }
    );

    test.each([
      { input: "0b1010", expected: "0b1010" },
      { input: "0B1111", expected: "0b1111" },
      { input: "0b11111111", expected: "0b11111111" },
    ])("should display $input as $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      if (result) {
        const formatted = formatResultWithUnit(result);
        expect(formatted).toBe(expected);
      }
    });

    test.each([
      { input: "0b1010 + 0b0101", expected: 15 },
      { input: "0b1111 - 0b0011", expected: 12 },
      { input: "0b0100 * 0b0010", expected: 8 },
      { input: "0b1000 / 0b0010", expected: 4 },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("number");
      if (result?.type === "number") {
        expect(result.value.toNumber()).toBe(expected);
      }
    });

    test.each(["0b", "0b2", "0b1012", "0bG"])(
      "should error on invalid binary literal %s",
      (input) => {
        const { error } = evaluateExpression(input);
        expect(error).toBeTruthy();
      }
    );
  });

  describe("Hex Literals", () => {
    test.each([
      { input: "0xFF", expected: 255 },
      { input: "0xff", expected: 255 },
      { input: "0xA", expected: 10 },
      { input: "0xa", expected: 10 },
      { input: "0x0", expected: 0 },
      { input: "0x100", expected: 256 },
      { input: "0xDEADBEEF", expected: 3_735_928_559 },
    ])(
      "should parse hex literal $input as $expected",
      ({ input, expected }) => {
        const { result } = evaluateExpression(input);
        expect(result).toBeTruthy();
        expect(result?.type).toBe("number");
        if (result?.type === "number") {
          expect(result.value.toNumber()).toBe(expected);
          expect(result.format).toBe("hex");
        }
      }
    );

    test.each([
      { input: "0xFF", expected: "0xff" },
      { input: "0x10", expected: "0x10" },
      { input: "0xABCD", expected: "0xabcd" },
    ])("should display $input as $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      if (result) {
        const formatted = formatResultWithUnit(result);
        expect(formatted).toBe(expected);
      }
    });

    test.each([
      { input: "0xFF + 0x01", expected: 256 },
      { input: "0x100 - 0xFF", expected: 1 },
      { input: "0x10 * 0x10", expected: 256 },
      { input: "0x100 / 0x10", expected: 16 },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("number");
      if (result?.type === "number") {
        expect(result.value.toNumber()).toBe(expected);
      }
    });

    test.each(["0x", "0xG", "0xZZ", "0xG1"])(
      "should error on invalid hex literal %s",
      (input) => {
        const { error } = evaluateExpression(input);
        expect(error).toBeTruthy();
      }
    );
  });

  describe("Base Conversions", () => {
    test.each([
      { input: "10 to binary", expected: "0b1010" },
      { input: "255 to bin", expected: "0b11111111" },
      { input: "0 to binary", expected: "0b0" },
      { input: "1 to bin", expected: "0b1" },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("string");
      if (result?.type === "string") {
        expect(result.value).toBe(expected);
      }
    });

    test.each([
      { input: "255 to hex", expected: "0xff" },
      { input: "16 to hexadecimal", expected: "0x10" },
      { input: "0 to hex", expected: "0x0" },
      { input: "4095 to hex", expected: "0xfff" },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("string");
      if (result?.type === "string") {
        expect(result.value).toBe(expected);
      }
    });

    test.each([
      { input: "0b1010 to decimal", expected: 10 },
      { input: "0b1111 to dec", expected: 15 },
      { input: "0b11111111 to decimal", expected: 255 },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("number");
      if (result?.type === "number") {
        expect(result.value.toNumber()).toBe(expected);
        expect(result.format).toBe("decimal");
      }
    });

    test.each([
      { input: "0xFF to decimal", expected: 255 },
      { input: "0x10 to dec", expected: 16 },
      { input: "0xABC to decimal", expected: 2748 },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("number");
      if (result?.type === "number") {
        expect(result.value.toNumber()).toBe(expected);
        expect(result.format).toBe("decimal");
      }
    });

    test.each([
      { input: "0b11111111 to hex", expected: "0xff" },
      { input: "0xFF to binary", expected: "0b11111111" },
      { input: "0b10101010 to hex", expected: "0xaa" },
      { input: "0xF0 to binary", expected: "0b11110000" },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("string");
      if (result?.type === "string") {
        expect(result.value).toBe(expected);
      }
    });

    test.each([
      { input: "-10 to binary", expected: "-0b1010" },
      { input: "-255 to hex", expected: "-0xff" },
      { input: "-15 to bin", expected: "-0b1111" },
      { input: "-16 to hexadecimal", expected: "-0x10" },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("string");
      if (result?.type === "string") {
        expect(result.value).toBe(expected);
      }
    });

    test.each([
      {
        input: "10.7 to binary",
        error: "Cannot convert non-integer value 10.7 to binary",
      },
      {
        input: "255.9 to hex",
        error: "Cannot convert non-integer value 255.9 to hex",
      },
      {
        input: "15.1 to bin",
        error: "Cannot convert non-integer value 15.1 to bin",
      },
      {
        input: "16.5 to hexadecimal",
        error: "Cannot convert non-integer value 16.5 to hexadecimal",
      },
    ])("should error on $input", ({ input, error }) => {
      const { result, error: evalError } = evaluateExpression(input);
      expect(result).toBeNull();
      expect(evalError).toBeTruthy();
      expect(evalError).toBe(error);
    });

    test.each([
      '"hello" to binary',
      "true to hex",
      "[1, 2, 3] to bin",
      "{a: 1} to decimal",
    ])("should error on %s", (input) => {
      const { error } = evaluateExpression(input);
      expect(error).toBeTruthy();
    });
  });

  describe("Mixed Operations", () => {
    test.each([
      { input: "0xFF + 10", expected: 265 },
      { input: "0b1010 * 5", expected: 50 },
      { input: "100 - 0x10", expected: 84 },
      { input: "0b1000 + 0x08", expected: 16 },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      expect(result?.type).toBe("number");
      if (result?.type === "number") {
        expect(result.value.toNumber()).toBe(expected);
      }
    });

    test.each([
      {
        inputs: ["a = 0xFF", "b = 0b1111", "a + b"],
        expected: 270,
      },
      {
        inputs: ["x = 0x10", "y = 16", "x == y"],
        expected: true,
      },
    ])("evaluates $inputs.2 to $expected", ({ inputs, expected }) => {
      const variables = new Map();
      let lastResult: CalculatedValue | null = null;

      for (const input of inputs) {
        const { result } = evaluateExpression(input, variables);
        lastResult = result;
      }

      expect(lastResult).toBeTruthy();
      if (typeof expected === "boolean") {
        expect(lastResult?.type).toBe("boolean");
        if (lastResult?.type === "boolean") {
          expect(lastResult.value).toBe(expected);
        }
      } else {
        expect(lastResult?.type).toBe("number");
        if (lastResult?.type === "number") {
          expect(lastResult.value.toNumber()).toBe(expected);
        }
      }
    });

    test.each([
      { input: "0xFF m", expected: "255 m" },
      { input: "0b1010 kg", expected: "10 kg" },
      { input: "0x10 km/h", expected: "16 km/h" },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      if (result) {
        const formatted = formatResultWithUnit(result);
        expect(formatted).toBe(expected);
      }
    });
  });

  describe("Edge Cases", () => {
    test.each([
      { input: "0b0", expected: 0 },
      { input: "0x0", expected: 0 },
      { input: "0 to binary", expected: "0b0" },
      { input: "0 to hex", expected: "0x0" },
    ])("$input = $expected", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      if (typeof expected === "number") {
        expect(result?.type).toBe("number");
        if (result?.type === "number") {
          expect(result.value.toNumber()).toBe(expected);
        }
      } else {
        expect(result?.type).toBe("string");
        if (result?.type === "string") {
          expect(result.value).toBe(expected);
        }
      }
    });

    test.each([
      { input: "0xFFFFFFFF", expected: 4_294_967_295 },
      { input: "4294967295 to hex", expected: "0xffffffff" },
      {
        input: "0b11111111111111111111111111111111",
        expected: 4_294_967_295,
      },
    ])("handles large numbers: $input", ({ input, expected }) => {
      const { result } = evaluateExpression(input);
      expect(result).toBeTruthy();
      if (typeof expected === "number") {
        expect(result?.type).toBe("number");
        if (result?.type === "number") {
          expect(result.value.toNumber()).toBe(expected);
        }
      } else {
        expect(result?.type).toBe("string");
        if (result?.type === "string") {
          expect(result.value).toBe(expected);
        }
      }
    });
  });
});
