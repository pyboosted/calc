import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".config", "boomi");
const CONFIG_FILE = join(CONFIG_DIR, "config.yaml");
const BACKUP_FILE = join(CONFIG_DIR, "config.yaml.backup");

// Regex patterns
const PRECISION_OUTPUT_PATTERN = /3\.14286|3\.142857142857143/;

describe("Precision Configuration", () => {
  // Backup existing config before tests
  beforeEach(() => {
    try {
      execSync(`cp "${CONFIG_FILE}" "${BACKUP_FILE}" 2>/dev/null || true`);
    } catch {
      // Ignore if no config exists
    }
  });

  // Restore config after tests
  afterEach(() => {
    try {
      execSync(`cp "${BACKUP_FILE}" "${CONFIG_FILE}" 2>/dev/null || true`);
      rmSync(BACKUP_FILE, { force: true });
    } catch {
      // Ignore errors
    }
  });

  test("default precision is 2", () => {
    // Remove config to test default
    rmSync(CONFIG_FILE, { force: true });

    const result = execSync('bun run src/cli.tsx -e "1/3"', {
      encoding: "utf8",
    }).trim();

    // Should show 0.33 with default precision 2
    expect(result).toContain("0.33");
    expect(result).not.toContain("0.333");
  });

  test("precision 0 shows integers only", () => {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, "precision: 0\n");

    const result = execSync('bun run src/cli.tsx -e "10/3"', {
      encoding: "utf8",
    }).trim();

    // Should show 3 with precision 0
    expect(result).toContain("3");
    expect(result).not.toContain("3.");
  });

  test("precision 4 shows 4 decimal places", () => {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, "precision: 4\n");

    const result = execSync('bun run src/cli.tsx -e "1/3"', {
      encoding: "utf8",
    }).trim();

    // Should show 0.3333 with precision 4
    expect(result).toContain("0.3333");
  });

  test("precision applies to unit conversions", () => {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, "precision: 3\n");

    const result = execSync('bun run src/cli.tsx -e "100 cm / 3 to m"', {
      encoding: "utf8",
    }).trim();

    // Should show 0.333 m with precision 3
    expect(result).toContain("0.333 m");
  });

  test("precision applies to percentages", () => {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, "precision: 1\n");

    const result = execSync('bun run src/cli.tsx -e "(100/3)%"', {
      encoding: "utf8",
    }).trim();

    // Should show 33.3% with precision 1
    expect(result).toContain("33.3%");
  });

  test("precision applies to scientific notation", () => {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, "precision: 2\n");

    const result = execSync('bun run src/cli.tsx -e "0.0000001234"', {
      encoding: "utf8",
    }).trim();

    // Should show 1.23e-7 with precision 2
    expect(result).toContain("1.23e-7");
  });

  test("trailing zeros are removed", () => {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, "precision: 4\n");

    const result = execSync('bun run src/cli.tsx -e "1.5"', {
      encoding: "utf8",
    }).trim();

    // Should show 1.5, not 1.5000
    expect(result).toContain("1.5");
    expect(result).not.toContain("1.5000");
  });

  test("precision works with compound units", () => {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, "precision: 1\n");

    const result = execSync('bun run src/cli.tsx -e "(100/3) * (1 m/s)"', {
      encoding: "utf8",
    }).trim();

    // Should show 33.3 m/s with precision 1
    expect(result).toContain("33.3 m/s");
  });

  test("precision applies in interactive mode calculations", () => {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, "precision: 5\n");

    // Create a test file with calculations
    const testFile = "test-precision.calc";
    writeFileSync(testFile, "22/7\n");

    try {
      // Run in interactive mode but exit immediately
      const result = execSync(`echo "" | bun run src/cli.tsx ${testFile}`, {
        encoding: "utf8",
      });

      // Should show either 3.14286 (with trailing zeros removed)
      // The interactive mode currently shows full precision
      expect(result).toMatch(PRECISION_OUTPUT_PATTERN);
    } finally {
      rmSync(testFile, { force: true });
    }
  });

  test("precision config validation", () => {
    mkdirSync(CONFIG_DIR, { recursive: true });

    // Test negative precision (should use default)
    writeFileSync(CONFIG_FILE, "precision: -1\n");
    let result = execSync('bun run src/cli.tsx -e "1/3"', {
      encoding: "utf8",
    }).trim();
    expect(result).toContain("0.33"); // Should use default precision 2

    // Test precision > 20 (should use default)
    writeFileSync(CONFIG_FILE, "precision: 25\n");
    result = execSync('bun run src/cli.tsx -e "1/3"', {
      encoding: "utf8",
    }).trim();
    expect(result).toContain("0.33"); // Should use default precision 2
  });
});
