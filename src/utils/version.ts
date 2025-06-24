import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let cachedVersion: string | undefined;

export function getVersion(): string {
  // Return cached version if already loaded
  if (cachedVersion !== undefined) {
    return cachedVersion;
  }

  // Get the directory of the current module
  const __dirname = dirname(fileURLToPath(import.meta.url));

  // Try multiple possible locations for package.json
  const possiblePaths = [
    join(__dirname, "..", "..", "package.json"), // Development: src/utils/version.ts -> calc/package.json
    join(__dirname, "..", "package.json"), // Installed: dist/utils/version.js -> calc/package.json
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      try {
        const pkg = JSON.parse(readFileSync(path, "utf-8"));
        cachedVersion = (pkg.version as string) || "unknown";
        return cachedVersion;
      } catch (_e) {
        // Continue to next path
      }
    }
  }

  // If no package.json found, return unknown
  cachedVersion = "unknown";
  return cachedVersion;
}
