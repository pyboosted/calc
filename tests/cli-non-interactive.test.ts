import { describe, expect, test } from "bun:test";
import { $ } from "bun";

describe("CLI Non-Interactive Mode", () => {
  test("evaluates simple arithmetic", async () => {
    const result = await $`bun run src/cli.tsx "2 + 2"`.text();
    expect(result.trim()).toBe("4");
  });

  test("evaluates complex expression", async () => {
    const result = await $`bun run src/cli.tsx "sqrt(16) * 2"`.text();
    expect(result.trim()).toBe("8");
  });

  test("evaluates percentage calculation", async () => {
    const result = await $`bun run src/cli.tsx "100 - 10%"`.text();
    expect(result.trim()).toBe("90");
  });

  test("evaluates unit conversion", async () => {
    const result = await $`bun run src/cli.tsx "100 cm in meters"`.text();
    expect(result.trim()).toBe("1 meters");
  });

  test("handles errors gracefully", async () => {
    try {
      // Disable markdown mode to ensure invalid expressions throw errors
      await $`bun run src/cli.tsx --md=false "invalid expression"`.text();
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const e = error as { exitCode: number; stderr: Buffer };
      expect(e.exitCode).toBe(1);
      expect(e.stderr.toString()).toContain("Error:");
    }
  });

  test("no arguments starts interactive mode", async () => {
    // This test would need to be handled differently as it starts interactive mode
    // For now, we'll skip testing this case
  });
});
