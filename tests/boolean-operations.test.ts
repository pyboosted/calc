import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";
import type { CalculatedValue } from "../src/types";
import { fromDecimal, toDecimal } from "../src/utils/decimal-math";

describe("Boolean Operations", () => {
  test("boolean literals", () => {
    expect(evaluate("true", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("false", new Map())).toEqual({
      type: "boolean",
      value: false,
    });
  });

  test("null literal", () => {
    expect(evaluate("null", new Map())).toEqual({ type: "null", value: null });
  });

  test("comparison operators", () => {
    expect(evaluate("5 == 5", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("5 != 10", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("5 < 10", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("10 > 5", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("5 <= 5", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("10 >= 10", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
  });

  test("string comparisons", () => {
    expect(evaluate("`abc` == `abc`", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("`abc` < `def`", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("`xyz` > `abc`", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("`hello` != `world`", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
  });

  test("unit comparisons", () => {
    expect(evaluate("100 cm == 1 m", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("1000 g < 2 kg", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("32 f == 0 c", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
  });

  test("logical operators", () => {
    expect(evaluate("true and true", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("true and false", new Map())).toEqual({
      type: "boolean",
      value: false,
    });
    expect(evaluate("false or true", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("false or false", new Map())).toEqual({
      type: "boolean",
      value: false,
    });
    expect(evaluate("not true", new Map())).toEqual({
      type: "boolean",
      value: false,
    });
    expect(evaluate("not false", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
  });

  test("short-circuit evaluation", () => {
    const vars = new Map<string, CalculatedValue>();
    vars.set("x", { type: "number", value: toDecimal(5) });

    // Should not evaluate x/0 (would throw division by zero)
    expect(evaluate("false and x/0", vars)).toEqual({
      type: "boolean",
      value: false,
    });
    expect(evaluate("true or x/0", vars)).toEqual({
      type: "boolean",
      value: true,
    });
  });

  test("logical operators return last evaluated value", () => {
    const vars = new Map<string, CalculatedValue>();
    vars.set("x", { type: "number", value: toDecimal(5) });
    vars.set("y", { type: "number", value: toDecimal(10) });

    // 'and' returns first falsy or last value
    const and1 = evaluate("x and y", vars);
    expect(and1.type).toBe("number");
    if (and1.type === "number") {
      expect(fromDecimal(and1.value)).toBe(10);
    }
    const and2 = evaluate("0 and x", new Map());
    expect(and2.type).toBe("number");
    if (and2.type === "number") {
      expect(fromDecimal(and2.value)).toBe(0);
    }

    // 'or' returns first truthy or last value
    const or1 = evaluate("x or y", vars);
    expect(or1.type).toBe("number");
    if (or1.type === "number") {
      expect(fromDecimal(or1.value)).toBe(5);
    }
    const or2 = evaluate("0 or 5", new Map());
    expect(or2.type).toBe("number");
    if (or2.type === "number") {
      expect(fromDecimal(or2.value)).toBe(5);
    }
  });

  test("ternary operator", () => {
    const t1 = evaluate("true ? 10 : 20", new Map());
    expect(t1.type).toBe("number");
    if (t1.type === "number") {
      expect(fromDecimal(t1.value)).toBe(10);
    }
    const t2 = evaluate("false ? 10 : 20", new Map());
    expect(t2.type).toBe("number");
    if (t2.type === "number") {
      expect(fromDecimal(t2.value)).toBe(20);
    }
    expect(evaluate("5 > 3 ? `yes` : `no`", new Map())).toEqual({
      type: "string",
      value: "yes",
    });
    expect(evaluate("5 < 3 ? `yes` : `no`", new Map())).toEqual({
      type: "string",
      value: "no",
    });
  });

  test("nested ternary", () => {
    const result = evaluate("true ? false ? 1 : 2 : 3", new Map());
    expect(result).toEqual({ type: "number", value: toDecimal(2) });

    const result2 = evaluate("false ? 1 : true ? 2 : 3", new Map());
    expect(result2).toEqual({ type: "number", value: toDecimal(2) });
  });

  test("type conversions", () => {
    const r1 = evaluate("true as number", new Map());
    expect(r1.type).toBe("number");
    if (r1.type === "number") {
      expect(fromDecimal(r1.value)).toBe(1);
    }
    const r2 = evaluate("false as number", new Map());
    expect(r2.type).toBe("number");
    if (r2.type === "number") {
      expect(fromDecimal(r2.value)).toBe(0);
    }
    expect(evaluate("true as string", new Map())).toEqual({
      type: "string",
      value: "true",
    });
    expect(evaluate("false as string", new Map())).toEqual({
      type: "string",
      value: "false",
    });
    expect(evaluate("null as string", new Map())).toEqual({
      type: "string",
      value: "null",
    });
    expect(evaluate("0 as boolean", new Map())).toEqual({
      type: "boolean",
      value: false,
    });
    expect(evaluate("1 as boolean", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("-5 as boolean", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("`` as boolean", new Map())).toEqual({
      type: "boolean",
      value: false,
    });
    expect(evaluate("`hello` as boolean", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("null as boolean", new Map())).toEqual({
      type: "boolean",
      value: false,
    });
  });

  test("truthiness in ternary", () => {
    expect(evaluate("0 ? `true` : `false`", new Map())).toEqual({
      type: "string",
      value: "false",
    });
    expect(evaluate("1 ? `true` : `false`", new Map())).toEqual({
      type: "string",
      value: "true",
    });
    expect(evaluate("`` ? `true` : `false`", new Map())).toEqual({
      type: "string",
      value: "false",
    });
    expect(evaluate("`text` ? `true` : `false`", new Map())).toEqual({
      type: "string",
      value: "true",
    });
    expect(evaluate("null ? `true` : `false`", new Map())).toEqual({
      type: "string",
      value: "false",
    });
  });

  test("comparison precedence", () => {
    // Comparison has lower precedence than arithmetic
    expect(evaluate("2 + 3 == 5", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("2 * 3 < 4 + 3", new Map())).toEqual({
      type: "boolean",
      value: true,
    });

    // Logical operators have lower precedence than comparison
    expect(evaluate("2 < 3 and 4 < 5", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("2 > 3 or 4 < 5", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
  });

  test("not operator precedence", () => {
    expect(evaluate("not (5 > 3)", new Map())).toEqual({
      type: "boolean",
      value: false,
    });
    expect(evaluate("(not true) and false", new Map())).toEqual({
      type: "boolean",
      value: false,
    });
    expect(evaluate("not (true and false)", new Map())).toEqual({
      type: "boolean",
      value: true,
    });
  });
});

describe("Boolean Integration", () => {
  test("comparisons with variables", () => {
    const vars = new Map<string, CalculatedValue>();
    vars.set("x", { type: "number", value: toDecimal(10) });
    vars.set("y", { type: "number", value: toDecimal(20) });

    expect(evaluate("x < y", vars)).toEqual({ type: "boolean", value: true });
    expect(evaluate("x == 10", vars)).toEqual({ type: "boolean", value: true });
    expect(evaluate("x != y", vars)).toEqual({ type: "boolean", value: true });
  });

  test("logical operations with expressions", () => {
    const vars = new Map<string, CalculatedValue>();
    vars.set("x", { type: "number", value: toDecimal(5) });

    const result = evaluate("x > 3 and x < 10", vars);
    expect(result).toEqual({ type: "boolean", value: true });

    const result2 = evaluate("x < 3 or x > 10", vars);
    expect(result2).toEqual({ type: "boolean", value: false });
  });

  test("ternary with calculations", () => {
    const vars = new Map<string, CalculatedValue>();
    vars.set("price", { type: "number", value: toDecimal(100) });
    vars.set("discount", { type: "boolean", value: true });

    const result = evaluate("discount ? price * 0.9 : price", vars);
    expect(result).toEqual({ type: "number", value: toDecimal(90) });
  });

  test("mixed type operations", () => {
    const vars = new Map<string, CalculatedValue>();
    vars.set("count", { type: "number", value: toDecimal(0) });

    // biome-ignore lint/suspicious/noTemplateCurlyInString: This is intentional - testing string interpolation
    evaluate("message = count > 0 ? `Items: ${count}` : `No items`", vars);
    expect(vars.get("message")).toEqual({ type: "string", value: "No items" });

    vars.set("count", { type: "number", value: toDecimal(5) });
    // biome-ignore lint/suspicious/noTemplateCurlyInString: This is intentional - testing string interpolation
    evaluate("message = count > 0 ? `Items: ${count}` : `No items`", vars);
    expect(vars.get("message")).toEqual({ type: "string", value: "Items: 5" });
  });

  test("boolean in string interpolation", () => {
    const vars = new Map<string, CalculatedValue>();
    vars.set("active", { type: "boolean", value: true });

    // biome-ignore lint/suspicious/noTemplateCurlyInString: This is intentional - testing string interpolation
    const result = evaluate("`Status: ${active}`", vars);
    expect(result).toEqual({ type: "string", value: "Status: true" });
  });

  test("null handling", () => {
    const vars = new Map<string, CalculatedValue>();
    vars.set("value", { type: "null", value: null });

    expect(evaluate("value == null", vars)).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("value != null", vars)).toEqual({
      type: "boolean",
      value: false,
    });
    const ternary = evaluate("value ? 10 : 20", vars);
    expect(ternary.type).toBe("number");
    if (ternary.type === "number") {
      expect(fromDecimal(ternary.value)).toBe(20);
    }
  });

  test("complex boolean expressions", () => {
    const vars = new Map<string, CalculatedValue>();
    vars.set("age", { type: "number", value: toDecimal(25) });
    vars.set("member", { type: "boolean", value: true });
    vars.set("student", { type: "boolean", value: false });

    // (age >= 18 and age <= 65) and (member or student)
    const result = evaluate(
      "(age >= 18 and age <= 65) and (member or student)",
      vars
    );
    expect(result).toEqual({ type: "boolean", value: true });
  });

  test("chained comparisons with logical operators", () => {
    const vars = new Map<string, CalculatedValue>();
    vars.set("x", { type: "number", value: toDecimal(5) });

    // Simulating 0 < x < 10
    const result = evaluate("0 < x and x < 10", vars);
    expect(result).toEqual({ type: "boolean", value: true });
  });

  test("date comparisons", () => {
    const vars = new Map<string, CalculatedValue>();
    const date1 = new Date("2025-01-01");
    const date2 = new Date("2025-12-31");

    vars.set("startDate", { type: "date", value: date1 });
    vars.set("endDate", { type: "date", value: date2 });

    expect(evaluate("startDate < endDate", vars)).toEqual({
      type: "boolean",
      value: true,
    });
    expect(evaluate("startDate == endDate", vars)).toEqual({
      type: "boolean",
      value: false,
    });
  });
});
