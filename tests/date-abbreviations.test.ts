import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Date Arithmetic with Abbreviations", () => {
  test("supports hour abbreviations", () => {
    const vars = new Map();
    const now = new Date();

    // Test 'h' abbreviation
    vars.set("testDate", { value: now.getTime(), unit: "timestamp", date: now });
    const result1 = evaluate("testDate + 2h", vars);
    expect(result1.unit).toBe("timestamp");
    expect(result1.date).toBeDefined();
    const hourDiff1 = (result1.date?.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(hourDiff1).toBeCloseTo(2, 1);

    // Test 'hr' abbreviation
    const result2 = evaluate("testDate + 3hr", vars);
    const hourDiff2 = (result2.date?.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(hourDiff2).toBeCloseTo(3, 1);
  });

  test("supports minute abbreviations", () => {
    const vars = new Map();
    const now = new Date();
    vars.set("testDate", { value: now.getTime(), unit: "timestamp", date: now });

    // Test 'min' abbreviation
    const result1 = evaluate("testDate + 30min", vars);
    const minDiff1 = (result1.date?.getTime() - now.getTime()) / (1000 * 60);
    expect(minDiff1).toBeCloseTo(30, 1);

    // Test 'm' abbreviation (should be minutes in date context)
    const result2 = evaluate("testDate + 15m", vars);
    const minDiff2 = (result2.date?.getTime() - now.getTime()) / (1000 * 60);
    expect(minDiff2).toBeCloseTo(15, 1);
  });

  test("supports day abbreviations", () => {
    const vars = new Map();
    const today = evaluate("today", vars);

    // Test 'd' abbreviation
    const result = evaluate("today + 1d", vars);
    const dayDiff = (result.date?.getTime() - today.date?.getTime()) / (1000 * 60 * 60 * 24);
    expect(dayDiff).toBeCloseTo(1, 1);
  });

  test("supports week abbreviation", () => {
    const vars = new Map();
    const today = evaluate("today", vars);

    // Test 'w' abbreviation
    const result = evaluate("today + 2w", vars);
    const dayDiff = (result.date?.getTime() - today.date?.getTime()) / (1000 * 60 * 60 * 24);
    expect(dayDiff).toBeCloseTo(14, 1);
  });

  test("supports second abbreviations", () => {
    const vars = new Map();
    const now = new Date();
    vars.set("testDate", { value: now.getTime(), unit: "timestamp", date: now });

    // Test 's' abbreviation
    const result1 = evaluate("testDate + 30s", vars);
    const secDiff1 = (result1.date?.getTime() - now.getTime()) / 1000;
    expect(secDiff1).toBeCloseTo(30, 1);

    // Test 'sec' abbreviation
    const result2 = evaluate("testDate + 45sec", vars);
    const secDiff2 = (result2.date?.getTime() - now.getTime()) / 1000;
    expect(secDiff2).toBeCloseTo(45, 1);
  });

  test("context determines m as minutes vs meters", () => {
    const vars = new Map();

    // In date context, 'm' should be minutes
    const now = new Date();
    vars.set("testDate", { value: now.getTime(), unit: "timestamp", date: now });
    const dateResult = evaluate("testDate + 5m", vars);
    const minDiff = (dateResult.date?.getTime() - now.getTime()) / (1000 * 60);
    expect(minDiff).toBeCloseTo(5, 1);

    // In unit conversion context, 'm' should be meters
    const unitResult = evaluate("100 cm to m", vars);
    expect(unitResult.value).toBe(1);
    expect(unitResult.unit).toBe("m");
  });

  test("now works with all abbreviations", () => {
    const vars = new Map();

    // Just verify these parse without errors
    expect(() => evaluate("now + 1h", vars)).not.toThrow();
    expect(() => evaluate("now + 30min", vars)).not.toThrow();
    expect(() => evaluate("now + 5m", vars)).not.toThrow();
    expect(() => evaluate("now + 10s", vars)).not.toThrow();
    expect(() => evaluate("now - 1d", vars)).not.toThrow();
    expect(() => evaluate("now + 1w", vars)).not.toThrow();
  });
});
