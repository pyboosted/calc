import { describe, expect, test } from "bun:test";
import { CalculatorEngine } from "../src/ui/calculator-engine";

describe("Markdown and Aggregation", () => {
  test("prev ignores markdown results", () => {
    // Enable markdown mode
    const engine = new CalculatorEngine("", false, true);

    // Add a valid calculation
    engine.updateLine(0, "10 + 5");

    // Add lines to have proper indices
    engine.insertLine(1);
    engine.insertLine(2);

    // Add a markdown line (invalid expression)
    engine.updateLine(1, "This is **bold** text");

    // Use prev - should refer to the calculation, not the markdown
    engine.updateLine(2, "prev * 2");

    const lines = engine.getLines();
    expect(lines[0]?.result?.type).toBe("number");
    expect(lines[0]?.result?.value?.toString()).toBe("15");

    expect(lines[1]?.result?.type).toBe("markdown");

    expect(lines[2]?.result?.type).toBe("number");
    expect(lines[2]?.result?.value?.toString()).toBe("30"); // 15 * 2
  });

  test("agg ignores markdown results", () => {
    const engine = new CalculatorEngine("", false, true);

    // Add some calculations
    engine.updateLine(0, "10");
    engine.insertLine(1);
    engine.updateLine(1, "20");
    engine.insertLine(2);
    engine.updateLine(2, "Some **markdown** text");
    engine.insertLine(3);
    engine.updateLine(3, "30");
    engine.insertLine(4);
    engine.updateLine(4, "More *italic* text");
    engine.insertLine(5);
    engine.updateLine(5, "agg");

    const lines = engine.getLines();
    const aggResult = lines[5]?.result;

    expect(aggResult?.type).toBe("array");
    if (aggResult?.type === "array") {
      // Should only contain the numbers, not markdown
      expect(aggResult.value.length).toBe(3);
      expect(aggResult.value[0]?.type).toBe("number");
      expect(aggResult.value[0]?.value?.toString()).toBe("10");
      expect(aggResult.value[1]?.type).toBe("number");
      expect(aggResult.value[1]?.value?.toString()).toBe("20");
      expect(aggResult.value[2]?.type).toBe("number");
      expect(aggResult.value[2]?.value?.toString()).toBe("30");
    }
  });

  test("agg | sum ignores markdown results", () => {
    const engine = new CalculatorEngine("", false, true);

    // Add some calculations with markdown in between
    engine.updateLine(0, "100");
    engine.insertLine(1);
    engine.updateLine(1, "**Bold heading**");
    engine.insertLine(2);
    engine.updateLine(2, "200");
    engine.insertLine(3);
    engine.updateLine(3, "`code block`");
    engine.insertLine(4);
    engine.updateLine(4, "300");
    engine.insertLine(5);
    engine.updateLine(5, "agg | sum");

    const lines = engine.getLines();
    const sumResult = lines[5]?.result;

    expect(sumResult?.type).toBe("number");
    expect(sumResult?.value?.toString()).toBe("600"); // 100 + 200 + 300
  });

  test("total ignores markdown results", () => {
    const engine = new CalculatorEngine("", false, true);

    // Add calculations with markdown
    engine.updateLine(0, "5");
    engine.insertLine(1);
    engine.updateLine(1, "This is [a link](http://example.com)");
    engine.insertLine(2);
    engine.updateLine(2, "10");
    engine.insertLine(3);
    engine.updateLine(3, "~~strikethrough~~");
    engine.insertLine(4);
    engine.updateLine(4, "15");
    engine.insertLine(5);
    engine.updateLine(5, "total");

    const lines = engine.getLines();
    const totalResult = lines[5]?.result;

    expect(totalResult?.type).toBe("number");
    expect(totalResult?.value?.toString()).toBe("30"); // 5 + 10 + 15
  });

  test("markdown does not break empty line separation", () => {
    const engine = new CalculatorEngine("", false, true);

    // First group
    engine.updateLine(0, "10");
    engine.insertLine(1);
    engine.updateLine(1, "20");
    engine.insertLine(2);
    engine.updateLine(2, ""); // Empty line

    // Second group with markdown
    engine.insertLine(3);
    engine.updateLine(3, "30");
    engine.insertLine(4);
    engine.updateLine(4, "**Some text**");
    engine.insertLine(5);
    engine.updateLine(5, "40");
    engine.insertLine(6);
    engine.updateLine(6, "agg | sum");

    const lines = engine.getLines();
    const sumResult = lines[6]?.result;

    // Should only sum values after the empty line, ignoring markdown
    expect(sumResult?.type).toBe("number");
    expect(sumResult?.value?.toString()).toBe("70"); // 30 + 40
  });
});
