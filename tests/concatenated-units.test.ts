import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Concatenated Compound Units", () => {
  describe("Time units", () => {
    test("1h30min", () => {
      const vars = new Map();
      const result = evaluate("1h30min", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(1.5); // 1.5 hours
        expect(result.dimensions.time?.exponent).toBe(1);
        expect(result.dimensions.time?.unit).toBe("h");
      }
    });

    test("2h45min30s", () => {
      const vars = new Map();
      const result = evaluate("2h45min30s", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBeCloseTo(2.758_333_3, 4); // 2h 45min 30s in hours
        expect(result.dimensions.time?.exponent).toBe(1);
        expect(result.dimensions.time?.unit).toBe("h");
      }
    });

    test("10min30s", () => {
      const vars = new Map();
      const result = evaluate("10min30s", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(10.5); // 10.5 minutes
        expect(result.dimensions.time?.unit).toBe("min");
      }
    });
  });

  describe("Mass units", () => {
    test("2kg300g", () => {
      const vars = new Map();
      const result = evaluate("2kg300g", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(2.3); // 2.3 kg
        expect(result.dimensions.mass?.exponent).toBe(1);
        expect(result.dimensions.mass?.unit).toBe("kg");
      }
    });

    test("1kg500g250mg", () => {
      const vars = new Map();
      const result = evaluate("1kg500g250mg", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBeCloseTo(1.500_25, 5); // 1.50025 kg
        expect(result.dimensions.mass?.unit).toBe("kg");
      }
    });
  });

  describe("Length units", () => {
    test("4m20cm", () => {
      const vars = new Map();
      const result = evaluate("4m20cm", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(4.2); // 4.2 meters
        expect(result.dimensions.length?.exponent).toBe(1);
        expect(result.dimensions.length?.unit).toBe("m");
      }
    });

    test("1km500m", () => {
      const vars = new Map();
      const result = evaluate("1km500m", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(1.5); // 1.5 km
        expect(result.dimensions.length?.unit).toBe("km");
      }
    });

    test("5ft6in", () => {
      const vars = new Map();
      const result = evaluate("5ft6in", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(5.5); // 5.5 ft
        expect(result.dimensions.length?.unit).toBe("ft");
      }
    });
  });

  describe("Mixed usage", () => {
    test("concatenated units in expressions", () => {
      const vars = new Map();
      const result = evaluate("(2h30min) + (1h45min)", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(4.25); // 4.25 hours
        expect(result.dimensions.time?.unit).toBe("h");
      }
    });

    test("concatenated units with variables", () => {
      const vars = new Map();
      evaluate("duration = 1h30min", vars);
      const result = evaluate("duration * 2", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(3); // 3 hours
        expect(result.dimensions.time?.unit).toBe("h");
      }
    });

    test("concatenated units in division", () => {
      const vars = new Map();
      const result = evaluate("100m / 1min30s", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBeCloseTo(66.667, 2); // 66.67 m/min
        expect(result.dimensions.length?.unit).toBe("m");
        expect(result.dimensions.time?.unit).toBe("min");
        expect(result.dimensions.time?.exponent).toBe(-1);
      }
    });
  });

  describe("Edge cases", () => {
    test("single unit without concatenation", () => {
      const vars = new Map();
      const result = evaluate("5m", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(5);
        expect(result.dimensions.length?.unit).toBe("m");
      }
    });

    test("number followed by non-unit text", () => {
      const vars = new Map();
      // This should fail to parse because "hello" is not a unit
      expect(() => evaluate("5hello", vars)).toThrow();
    });
  });
});
