#!/usr/bin/env bun
import { readdirSync } from "node:fs";
import { Terminal } from "../src/index.ts";

// List all examples
const term = Terminal.open();
term.clear();
term.hideCursor();

// Title
term.putText(1, 2, "@boosted/tui Examples", { bold: true, underline: true });
term.putText(3, 2, "Available examples:", { bold: true });

// Get all example files
const examplesDir = new URL(".", import.meta.url).pathname;
const files = readdirSync(examplesDir)
  .filter((f) => f.endsWith(".ts") && f !== "index.ts")
  .sort();

// Example descriptions
const descriptions: Record<string, string> = {
  "animation.ts": "Smooth animations and moving elements",
  "basic.ts": "Basic terminal operations and borders",
  "benchmark.ts": "Performance testing and metrics",
  "box-drawing.ts": "Box drawing characters and tables",
  "charts.ts": "Simple data visualization",
  "colors.ts": "Color palettes and gradients",
  "layout.ts": "Complex dashboard layout",
  "menu.ts": "Menu and dialog components",
  "progress-bar.ts": "Progress bars and spinners",
  "text-attributes.ts": "Text styling and attributes",
};

// List examples
let row = 5;
files.forEach((file, i) => {
  const num = (i + 1).toString().padStart(2);
  const name = file.replace(".ts", "");
  const desc = descriptions[file] || "";

  term.putText(row, 4, `${num}. ${name}`, {
    bold: true,
    fg: "#00aaff",
  });

  if (desc) {
    term.putText(row, 25, desc, { dim: true });
  }

  row++;
});

// Instructions
row += 2;
term.putText(row++, 2, "To run an example:", { bold: true });
term.putText(row++, 4, "bun run packages/tui/examples/<name>.ts", {
  fg: "#00ff00",
});

// Example
row++;
term.putText(row++, 2, "For example:", { dim: true });
term.putText(row++, 4, "bun run packages/tui/examples/animation.ts", {
  fg: "#ffaa00",
});

// Footer
term.putText(term.rows - 1, 2, "Press Ctrl+C to exit", { dim: true });

// Render
term.render();
term.showCursor();
term.flush();

// Keep running
process.stdin.resume();
