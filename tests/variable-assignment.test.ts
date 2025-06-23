import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/evaluator/evaluate";

describe("Variable Assignment Across Lines", () => {
  test("variable assignments persist across lines", () => {
    const vars = new Map();

    // Line 1: x = 10
    const result1 = evaluate("x = 10", vars);
    expect(result1.value).toBe(10);
    expect(vars.get("x").value).toBe(10);

    // Line 2: x + 5
    const result2 = evaluate("x + 5", vars);
    expect(result2.value).toBe(15);

    // Line 3: y = x * 2
    const result3 = evaluate("y = x * 2", vars);
    expect(result3.value).toBe(20);
    expect(vars.get("y").value).toBe(20);

    // Line 4: x + y
    const result4 = evaluate("x + y", vars);
    expect(result4.value).toBe(30);
  });

  test("prev and variable assignments work together", () => {
    const vars = new Map();

    // Line 1: x = 100
    const result1 = evaluate("x = 100", vars);
    expect(result1.value).toBe(100);

    // Line 2: x / 2
    vars.set("prev", result1);
    const result2 = evaluate("x / 2", vars);
    expect(result2.value).toBe(50);

    // Line 3: y = prev + x
    vars.set("prev", result2);
    const result3 = evaluate("y = prev + x", vars);
    expect(result3.value).toBe(150); // 50 + 100
    expect(vars.get("y").value).toBe(150);
  });
});
