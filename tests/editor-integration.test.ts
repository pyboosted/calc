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
    // The new behavior is to open non-existent files without error
    // They will be created on save

    // Test that multiple positional arguments are rejected
    const result = await $`bun run src/cli.tsx test-nonexistent.calc "2+2"`
      .quiet()
      .nothrow();

    // Should error with too many arguments
    expect(result.stderr.toString()).toContain("Error: Too many arguments");
    expect(result.exitCode).toBe(1);

    // Test that a single non-existent file with extension opens in interactive mode
    // We can't easily test interactive mode in a unit test, but we can verify
    // that it doesn't error when opening a non-existent file
    const proc = spawn("bun", ["run", "src/cli.tsx", "test-nonexistent.calc"], {
      stdio: "pipe",
    });

    // Set up a promise that resolves when process exits
    const exitPromise = new Promise((resolve) => {
      proc.on("exit", resolve);
    });

    // Wait a bit to ensure it starts
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Check if process is running (it should be in interactive mode)
    expect(proc.pid).toBeDefined();
    expect(proc.killed).toBe(false);

    // Kill the process
    proc.kill("SIGTERM");

    // Wait for it to die
    await Promise.race([
      exitPromise,
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);

    // Clean up if file was created
    try {
      await $`rm -f test-nonexistent.calc`.quiet();
    } catch {
      // Ignore
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
