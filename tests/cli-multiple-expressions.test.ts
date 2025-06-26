import { describe, expect, test } from "bun:test";
import { execSync } from "node:child_process";
import path from "node:path";

const CLI_PATH = path.join(__dirname, "..", "src", "cli.tsx");

describe("CLI Multiple Expressions", () => {
  test("evaluates multiple -e flags in sequence", () => {
    const output = execSync(
      `bun run ${CLI_PATH} -e "a = 5" -e "b = 10" -e "a + b"`,
      { encoding: "utf8" }
    ).trim();

    const lines = output.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("5");
    expect(lines[1]).toBe("10");
    expect(lines[2]).toBe("15");
  });

  test("array functions work with variables across multiple -e flags", () => {
    const output = execSync(
      `bun run ${CLI_PATH} -e "arr = [1, 2, 3]" -e "sum(arr)"`,
      { encoding: "utf8" }
    ).trim();

    const lines = output.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("[1, 2, 3]");
    expect(lines[1]).toBe("6");
  });

  test("complex expressions with multiple -e flags", () => {
    const output = execSync(
      `bun run ${CLI_PATH} -e "nums = [10, 20, 30]" -e "avg(nums)" -e "first(nums)" -e "last(nums)" -e "push(nums, 40)"`,
      { encoding: "utf8" }
    ).trim();

    const lines = output.split("\n");
    expect(lines).toHaveLength(5);
    expect(lines[0]).toBe("[10, 20, 30]");
    expect(lines[1]).toBe("20");
    expect(lines[2]).toBe("10");
    expect(lines[3]).toBe("30");
    expect(lines[4]).toBe("4"); // push now returns the new length
  });

  test("variables persist across multiple -e flags", () => {
    const output = execSync(
      `bun run ${CLI_PATH} -e "x = 100" -e "y = x * 2" -e "z = y + 50" -e "z"`,
      { encoding: "utf8" }
    ).trim();

    const lines = output.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe("100");
    expect(lines[1]).toBe("200");
    expect(lines[2]).toBe("250");
    expect(lines[3]).toBe("250");
  });
});
