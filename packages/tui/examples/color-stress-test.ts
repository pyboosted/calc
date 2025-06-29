#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Parse command line args
const showStats = process.argv.includes("--stats");

console.log("🎨 Color Stress Test");
console.log("Press Ctrl+C to exit\n");

// Wait a moment for user to read
await new Promise((resolve) => setTimeout(resolve, 1000));

// Open terminal
const term = Terminal.open({ syncUpdate: true });

term.hideCursor();
term.clear();

// Performance tracking
let frameCount = 0;
let totalRenderTime = 0;
let lastFpsUpdate = Date.now();
let currentFps = 0;

// Color palette for plasma effect
function plasma(x: number, y: number, t: number): `#${string}` {
  const v1 = Math.sin(x * 10 + t);
  const v2 = Math.sin(10 * (x * Math.sin(t / 2) + y * Math.cos(t / 3)) + t);
  const cx = x + 0.5 * Math.sin(t / 5);
  const cy = y + 0.5 * Math.cos(t / 3);
  const v3 = Math.sin(Math.sqrt(100 * (cx * cx + cy * cy) + 1) + t);

  const v = (v1 + v2 + v3) / 3;
  const r = Math.floor((Math.sin(v * Math.PI) + 1) * 127);
  const g = Math.floor((Math.cos(v * Math.PI) + 1) * 127);
  const b = Math.floor((Math.sin(v * Math.PI + Math.PI / 2) + 1) * 127);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Animation variables
let time = 0;
const chars = ["█", "▓", "▒", "░", " "];

// Main render loop
function render() {
  const renderStart = performance.now();

  // Calculate normalized coordinates
  const aspectRatio = term.cols / term.rows;

  // Render plasma effect
  for (let row = 0; row < term.rows - (showStats ? 3 : 0); row++) {
    for (let col = 0; col < term.cols; col++) {
      const x = (col / term.cols - 0.5) * aspectRatio;
      const y = row / term.rows - 0.5;

      const color = plasma(x, y, time);
      const intensity = Math.abs(
        Math.sin(x * 5 + time) * Math.cos(y * 5 + time)
      );
      const charIndex = Math.floor(intensity * chars.length);
      const char = chars[Math.min(charIndex, chars.length - 1)] || "█";

      term.putChar(row, col, char, { fg: color });
    }
  }

  // Show stats if requested
  if (showStats) {
    const statsRow = term.rows - 2;

    // Clear stats area
    for (let col = 0; col < term.cols; col++) {
      term.putChar(statsRow - 1, col, " ", { bg: "#000000" });
      term.putChar(statsRow, col, " ", { bg: "#000000" });
      term.putChar(statsRow + 1, col, " ", { bg: "#000000" });
    }

    // Display stats
    term.putText(statsRow, 2, `FPS: ${currentFps.toFixed(1)}`, {
      fg: "#00ff00",
      bg: "#000000",
      bold: true,
    });

    term.putText(statsRow, 15, `Frame: ${frameCount}`, {
      fg: "#00ffff",
      bg: "#000000",
    });

    const avgRenderTime = totalRenderTime / Math.max(frameCount, 1);
    term.putText(statsRow, 30, `Avg render: ${avgRenderTime.toFixed(2)}ms`, {
      fg: "#ffff00",
      bg: "#000000",
    });

    term.putText(statsRow, 55, "Color Stress Test", {
      fg: "#00ff00",
      bg: "#000000",
      bold: true,
    });
  }

  // Render the frame
  term.render();

  // Update performance stats
  const renderTime = performance.now() - renderStart;
  totalRenderTime += renderTime;
  frameCount++;

  // Update FPS counter
  const now = Date.now();
  if (now - lastFpsUpdate > 500) {
    currentFps = (frameCount * 1000) / (now - lastFpsUpdate);
    frameCount = 0;
    totalRenderTime = 0;
    lastFpsUpdate = now;
  }

  // Advance time
  time += 0.05;
}

// Handle resize
term.on("resize", () => {
  term.clear();
});

// Animation loop
const targetFps = 60;
const frameTime = 1000 / targetFps;
let lastFrame = Date.now();

const animate = () => {
  const now = Date.now();
  const delta = now - lastFrame;

  if (delta >= frameTime) {
    render();
    lastFrame = now - (delta % frameTime);
  }

  setImmediate(animate);
};

// Start animation
animate();

// Keep process alive
process.stdin.resume();
