import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

describe("Editor Integration", () => {
  test("loads file content from command line", async () => {
    // Create a test file
    const testFile = join(tmpdir(), "test-calc.txt");
    const content = "10 + 20\n30 * 2\ntotal";
    writeFileSync(testFile, content);

    try {
      // Start the process in interactive mode
      const proc = spawn("bun", ["run", "src/cli.tsx", `--file=${testFile}`], {
        stdio: "pipe",
      });

      // Set up a promise that resolves when process exits
      const exitPromise = new Promise((resolve) => {
        proc.on("exit", resolve);
      });

      // Wait a bit to ensure it starts
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Check if process is running
      expect(proc.pid).toBeDefined();
      expect(proc.killed).toBe(false);

      // Kill the process
      proc.kill("SIGTERM");

      // Wait for it to die (with timeout)
      await Promise.race([
        exitPromise,
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    } finally {
      try {
        unlinkSync(testFile);
      } catch {
        // Ignore error if file doesn't exist
      }
    }
  });

  test("handles missing file gracefully", async () => {
    try {
      await $`bun run src/cli.tsx --file=nonexistent.calc`.text();
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      const e = error as { exitCode: number; stderr: Buffer };
      expect(e.exitCode).toBe(1);
      expect(e.stderr.toString()).toContain("Error reading file");
    }
  });

  test("file loading with -f flag", async () => {
    // Create a test file
    const testFile = join(tmpdir(), "test-calc2.txt");
    const content = "x = 100\nx * 2";
    writeFileSync(testFile, content);

    try {
      // Start the process in interactive mode
      const proc = spawn("bun", ["run", "src/cli.tsx", "-f", testFile], {
        stdio: "pipe",
      });

      // Set up a promise that resolves when process exits
      const exitPromise = new Promise((resolve) => {
        proc.on("exit", resolve);
      });

      // Wait a bit to ensure it starts
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Check if process is running
      expect(proc.pid).toBeDefined();
      expect(proc.killed).toBe(false);

      // Kill the process
      proc.kill("SIGTERM");

      // Wait for it to die (with timeout)
      await Promise.race([
        exitPromise,
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    } finally {
      try {
        unlinkSync(testFile);
      } catch {
        // Ignore error if file doesn't exist
      }
    }
  });
});
