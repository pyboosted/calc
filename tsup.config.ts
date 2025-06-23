import { chmod, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.tsx",
    cli: "src/cli.tsx",
  },
  format: ["esm"],
  target: "node18",
  platform: "node",
  outDir: "dist",
  clean: true,
  dts: false,
  shims: true,
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  async onSuccess() {
    // Add shebang to CLI file and make it executable
    const cliPath = join("dist", "cli.js");
    const content = await readFile(cliPath, "utf-8");
    await writeFile(cliPath, `#!/usr/bin/env node\n${content}`);
    await chmod(cliPath, 0o755);
  },
});
