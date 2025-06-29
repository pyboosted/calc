#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Performance benchmark
const term = Terminal.open({ syncUpdate: true });

term.hideCursor();
term.clear();

// Benchmark configuration
const iterations = 1000;
const cellsPerFrame = 1000;

// Helper to measure performance
function benchmark(_name: string, fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
}

// Results storage
const results: { test: string; time: number; ops: number }[] = [];

term.putText(1, 2, "Terminal Performance Benchmark", {
  bold: true,
  underline: true,
});
term.putText(3, 2, "Running benchmarks...", { dim: true });
term.render();

// Test 1: Raw write performance
let row = 5;
term.putText(row++, 2, "1. Raw write performance...", { bold: true });
term.render();

const writeTime = benchmark("Raw writes", () => {
  for (let i = 0; i < iterations; i++) {
    term.write(`\x1b[${(i % 20) + 1};1HTest ${i}`);
  }
  term.flush();
});

results.push({
  test: "Raw writes",
  time: writeTime,
  ops: Math.round(iterations / (writeTime / 1000)),
});

// Test 2: Cell operations
row++;
term.putText(row++, 2, "2. Cell operations...", { bold: true });
term.render();

const cellTime = benchmark("Cell operations", () => {
  for (let i = 0; i < cellsPerFrame; i++) {
    const x = i % term.cols;
    const y = Math.floor(i / term.cols) % term.rows;
    term.putChar(y, x, String.fromCharCode(65 + (i % 26)), {
      fg: i % 2 ? "#ff0000" : "#00ff00",
    });
  }
  term.render();
});

results.push({
  test: "Cell operations",
  time: cellTime,
  ops: Math.round(cellsPerFrame / (cellTime / 1000)),
});

// Test 3: Full screen updates
row++;
term.putText(row++, 2, "3. Full screen updates...", { bold: true });
term.render();

const frames = 10;
const screenTime = benchmark("Full screen", () => {
  for (let frame = 0; frame < frames; frame++) {
    // Fill entire screen
    for (let y = 0; y < term.rows; y++) {
      for (let x = 0; x < term.cols; x++) {
        const char = frame % 2 ? "█" : "░";
        term.putChar(y, x, char, {
          fg: `#${((frame * 20) % 256).toString(16).padStart(2, "0")}0000`,
        });
      }
    }
    term.render();
  }
});

const totalCells = frames * term.rows * term.cols;
results.push({
  test: "Full screen updates",
  time: screenTime,
  ops: Math.round(totalCells / (screenTime / 1000)),
});

// Test 4: Diff efficiency (minimal changes)
row++;
term.putText(row++, 2, "4. Diff efficiency...", { bold: true });
term.render();

// First, fill screen
for (let y = 0; y < term.rows; y++) {
  for (let x = 0; x < term.cols; x++) {
    term.putChar(y, x, " ");
  }
}
term.render();

const diffTime = benchmark("Minimal diffs", () => {
  for (let i = 0; i < iterations; i++) {
    // Change only a few cells
    const y = i % term.rows;
    const x = (i * 7) % term.cols;
    term.putChar(y, x, "*", { fg: "#ffff00" });
    term.render();
  }
});

results.push({
  test: "Minimal diffs",
  time: diffTime,
  ops: Math.round(iterations / (diffTime / 1000)),
});

// Clear and show results
term.clear();
term.putText(1, 2, "Benchmark Results", { bold: true, underline: true });

// System info
term.putText(3, 2, `Terminal: ${term.cols}×${term.rows}`, { dim: true });
term.putText(4, 2, `Platform: ${process.platform} ${process.arch}`, {
  dim: true,
});

// Results table
row = 6;
term.putText(row++, 2, `${"Test".padEnd(25) + "Time (ms)".padEnd(15)}Ops/sec`, {
  bold: true,
});
term.putText(row++, 2, "─".repeat(50), { dim: true });

for (const result of results) {
  let color: string;
  if (result.ops > 100_000) {
    color = "#00ff00";
  } else if (result.ops > 10_000) {
    color = "#ffaa00";
  } else {
    color = "#ff0000";
  }

  term.putText(row, 2, result.test.padEnd(25));
  term.putText(row, 27, result.time.toFixed(2).padEnd(15));
  term.putText(row, 42, result.ops.toLocaleString(), { fg: color, bold: true });
  row++;
}

// Summary
row += 2;
const avgOps = Math.round(
  results.reduce((sum, r) => sum + r.ops, 0) / results.length
);
term.putText(row++, 2, "Performance Summary:", { bold: true, underline: true });
term.putText(row++, 2, `• Average ops/sec: ${avgOps.toLocaleString()}`);
term.putText(
  row++,
  2,
  `• Full screen FPS: ${Math.round(1000 / (screenTime / frames))}`
);
term.putText(
  row++,
  2,
  `• Cell throughput: ${(totalCells / (screenTime / 1000)).toLocaleString()} cells/sec`
);

// Render time analysis
const singleRenderStart = performance.now();
term.render();
const singleRenderTime = performance.now() - singleRenderStart;
term.putText(row++, 2, `• Single render: ${singleRenderTime.toFixed(3)}ms`);

// Footer
term.putText(term.rows - 1, 2, "Press Ctrl+C to exit", { dim: true });

term.render();
term.showCursor();
term.flush();

// Keep running
process.stdin.resume();
