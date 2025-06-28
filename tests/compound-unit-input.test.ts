import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Compound Unit Input", () => {
  describe("Time units", () => {
    test("1h 30min equals 90 minutes", () => {
      const vars = new Map();
      const result = evaluate("1h 30min", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(1.5); // 1.5 hours (unit is preserved from first component)
        expect(result.dimensions.time?.exponent).toBe(1);
        expect(result.dimensions.time?.unit).toBe("h");
      }
    });

    test("2h 45min 30s", () => {
      const vars = new Map();
      const result = evaluate("2h 45min 30s", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBeCloseTo(2.758_333_3, 4); // 2h 45min 30s in hours
        expect(result.dimensions.time?.exponent).toBe(1);
        expect(result.dimensions.time?.unit).toBe("h");
      }
    });

    test("0h 30min equals 30 minutes", () => {
      const vars = new Map();
      const result = evaluate("0h 30min", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(0.5); // 0.5 hours
        expect(result.dimensions.time?.unit).toBe("h");
      }
    });

    test("time calculation with compound units", () => {
      const vars = new Map();
      const result = evaluate("100m / (1min 30s)", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        // 100m / 1.5min = 66.67 m/min
        expect(result.value).toBeCloseTo(66.667, 2);
        expect(result.dimensions.length?.exponent).toBe(1);
        expect(result.dimensions.time?.exponent).toBe(-1);
      }
    });
  });

  describe("Mass units", () => {
    test("2kg 300g equals 2.3kg", () => {
      const vars = new Map();
      const result = evaluate("2kg 300g", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(2.3); // 2.3 kg (unit preserved from first component)
        expect(result.dimensions.mass?.exponent).toBe(1);
        expect(result.dimensions.mass?.unit).toBe("kg");
      }
    });

    test("5kg 0g equals 5kg", () => {
      const vars = new Map();
      const result = evaluate("5kg 0g", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(5); // 5 kg
        expect(result.dimensions.mass?.unit).toBe("kg");
      }
    });

    test("1kg 500g 250mg", () => {
      const vars = new Map();
      const result = evaluate("1kg 500g 250mg", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBeCloseTo(1.500_25, 5); // 1.50025 kg
        expect(result.dimensions.mass?.unit).toBe("kg");
      }
    });
  });

  describe("Length units", () => {
    test("4m 20cm equals 4.2m", () => {
      const vars = new Map();
      const result = evaluate("4m 20cm", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(4.2); // 4.2 meters
        expect(result.dimensions.length?.exponent).toBe(1);
      }
    });

    test("1km 500m equals 1.5km", () => {
      const vars = new Map();
      const result = evaluate("1km 500m", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(1.5); // 1.5 km (unit is preserved from first component)
        expect(result.dimensions.length?.unit).toBe("km");
      }
    });

    test("5ft 6in", () => {
      const vars = new Map();
      const result = evaluate("5ft 6in", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        // 5ft + 6in = 5.5 ft (unit is preserved from first component)
        expect(result.value).toBe(5.5);
        expect(result.dimensions.length?.unit).toBe("ft");
      }
    });
  });

  describe("Mixed operations", () => {
    test("compound units in expressions", () => {
      const vars = new Map();
      const result = evaluate("(2h 30min) + (1h 45min)", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(4.25); // 4h 15min = 4.25 hours
        expect(result.dimensions.time?.unit).toBe("h");
      }
    });

    test("compound units with variables", () => {
      const vars = new Map();
      evaluate("duration = 1h 30min", vars);
      const result = evaluate("duration * 2", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(3); // 3 hours
        expect(result.dimensions.time?.unit).toBe("h");
      }
    });

    test("conversion with compound units", () => {
      const vars = new Map();
      const result = evaluate("(2h 30min) to minutes", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(150); // 150 minutes
        expect(result.dimensions.time?.unit).toBe("minutes");
      }
    });
  });

  describe("Dimension validation", () => {
    test("incompatible units should not combine", () => {
      const vars = new Map();
      // 1h + 2kg should error due to incompatible units
      expect(() => evaluate("1h + 2kg", vars)).toThrow(
        "Cannot add quantities with incompatible dimensions"
      );
    });

    test("same dimension different base units work", () => {
      const vars = new Map();
      const result = evaluate("1m 50cm 200mm", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(1.7); // 1 + 0.5 + 0.2 = 1.7 meters
      }
    });
  });

  describe("Edge cases", () => {
    test("reverse order compound units", () => {
      const vars = new Map();
      const result = evaluate("30min 1h", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(90); // 30min + 1h = 90 minutes (unit preserved from first component)
        expect(result.dimensions.time?.unit).toBe("min");
      }
    });

    test("single unit with space", () => {
      const vars = new Map();
      const result = evaluate("5 m", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBe(5);
        expect(result.dimensions.length?.exponent).toBe(1);
      }
    });

    test("compound units with parentheses", () => {
      const vars = new Map();
      const result = evaluate("distance = 100m / (1min 30s)", vars);
      expect(result.type).toBe("quantity");
      if (result.type === "quantity") {
        expect(result.value).toBeCloseTo(66.667, 2); // 100m / 1.5min = 66.67 m/min
        expect(result.dimensions.length?.unit).toBe("m");
        expect(result.dimensions.time?.unit).toBe("min");
        expect(result.dimensions.time?.exponent).toBe(-1);
      }
    });
  });
});
