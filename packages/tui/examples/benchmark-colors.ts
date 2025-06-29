#!/usr/bin/env bun
import { DiffEngine, Terminal } from "../src/index.ts";
import type { Attributes } from "../src/types.ts";

// Benchmark configuration
const ROWS = 50;
const COLS = 100;
const ITERATIONS = 100;
const COLOR_CHANGES_PER_FRAME = 500;

// Generate random color
function randomColor(): `#${string}` {
  const hex = Math.floor(Math.random() * 0xff_ff_ff)
    .toString(16)
    .padStart(6, "0");
  return `#${hex}`;
}

// Generate random palette color
function randomPaletteColor(): number {
  return Math.floor(Math.random() * 256);
}

// Benchmark diff engine
function benchmarkDiffEngine(): { time: number; avgFrameTime: number } {
  const engine = new DiffEngine(ROWS, COLS);
  const start = performance.now();

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Clear and add random colored cells
    engine.clear();

    for (let i = 0; i < COLOR_CHANGES_PER_FRAME; i++) {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      const attrs: Attributes = {
        fg: Math.random() > 0.5 ? randomColor() : randomPaletteColor(),
        bg: Math.random() > 0.7 ? randomColor() : undefined,
        bold: Math.random() > 0.8,
      };

      engine.setCellWithAttrs(row, col, "█", attrs);
    }

    // Compute diff (this is what we're measuring)
    engine.computeDiff();
  }

  const totalTime = performance.now() - start;
  return {
    time: totalTime,
    avgFrameTime: totalTime / ITERATIONS,
  };
}

// Memory usage helper
function getMemoryUsage(): number {
  if (global.gc) {
    global.gc();
  }
  return process.memoryUsage().heapUsed / 1024 / 1024; // MB
}

console.log("🚀 TUI Color Performance Benchmark");
console.log(
  `Configuration: ${ROWS}x${COLS} terminal, ${ITERATIONS} iterations`
);
console.log(`Color changes per frame: ${COLOR_CHANGES_PER_FRAME}\n`);

// Warm up
console.log("Warming up...");
benchmarkDiffEngine();

// Run benchmarks
console.log("\n📊 Running benchmarks...\n");

// Benchmark implementation
const memBefore = getMemoryUsage();
const result = benchmarkDiffEngine();
const memAfter = getMemoryUsage();
const memUsed = memAfter - memBefore;

console.log("DiffEngine Performance:");
console.log(`  Total time: ${result.time.toFixed(2)}ms`);
console.log(`  Avg per frame: ${result.avgFrameTime.toFixed(2)}ms`);
console.log(`  Theoretical FPS: ${(1000 / result.avgFrameTime).toFixed(1)}`);
console.log(`  Memory delta: ${memUsed.toFixed(2)}MB`);

// Visual demo
console.log("\n🎨 Visual Demo (press Ctrl+C to exit):");

const term = Terminal.open();
term.hideCursor();
term.clear();

// Animation loop with FPS tracking
let frame = 0;
let frameCount = 0;
let lastFpsUpdate = Date.now();
let currentFps = 0;
let running = true;

// Frame timing stats
let minFrameTime = Number.POSITIVE_INFINITY;
let maxFrameTime = 0;
let avgFrameTime = 0;
const frameTimes: number[] = [];

// Use setImmediate for maximum frame rate
function renderFrame() {
  if (!running) {
    return;
  }

  const renderStart = performance.now();

  // Create gradient effect
  for (let row = 0; row < term.rows; row++) {
    for (let col = 0; col < term.cols; col++) {
      const hue = ((row + col + frame) % 360) / 360;
      const r = Math.floor(Math.sin(hue * Math.PI * 2) * 127 + 128);
      const g = Math.floor(Math.sin((hue + 0.33) * Math.PI * 2) * 127 + 128);
      const b = Math.floor(Math.sin((hue + 0.67) * Math.PI * 2) * 127 + 128);

      const color = `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}` as `#${string}`;

      term.putChar(row, col, "█", { fg: color });
    }
  }

  // Add performance info
  term.putText(1, 2, ` FPS: ${currentFps.toFixed(1)} `, {
    fg: "#000000",
    bg: "#ffffff",
    bold: true,
  });

  // Add render time and stats
  const renderTime = performance.now() - renderStart;
  term.putText(2, 2, ` Render: ${renderTime.toFixed(1)}ms `, {
    fg: "#000000",
    bg: "#cccccc",
  });

  // Add min/max/avg stats
  term.putText(
    3,
    2,
    ` Min: ${minFrameTime.toFixed(1)}ms Max: ${maxFrameTime.toFixed(1)}ms `,
    {
      fg: "#000000",
      bg: "#aaaaaa",
    }
  );

  term.putText(4, 2, ` Avg: ${avgFrameTime.toFixed(1)}ms `, {
    fg: "#000000",
    bg: "#888888",
  });

  term.render();
  frame++;
  frameCount++;

  // Track frame time stats
  frameTimes.push(renderTime);
  if (frameTimes.length > 100) {
    frameTimes.shift(); // Keep last 100 frames
  }

  minFrameTime = Math.min(minFrameTime, renderTime);
  maxFrameTime = Math.max(maxFrameTime, renderTime);
  avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

  // Update FPS counter every 500ms
  const now = Date.now();
  if (now - lastFpsUpdate > 500) {
    currentFps = (frameCount * 1000) / (now - lastFpsUpdate);
    frameCount = 0;
    lastFpsUpdate = now;
  }

  // Schedule next frame immediately
  setImmediate(renderFrame);
}

// Start the render loop
renderFrame();

// Cleanup on exit
process.on("SIGINT", () => {
  running = false;
  term.clear();
  term.close();
  process.exit(0);
});
