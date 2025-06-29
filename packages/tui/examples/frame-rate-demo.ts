#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

console.log("🎮 Frame Rate Comparison Demo");
console.log("\nUsage:");
console.log(
  "  bun run examples/frame-rate-demo.ts          # Maximum FPS (setImmediate)"
);
console.log(
  "  bun run examples/frame-rate-demo.ts --60fps  # 60 FPS (16ms interval)"
);
console.log(
  "  bun run examples/frame-rate-demo.ts --30fps  # 30 FPS (33ms interval)"
);
console.log(
  "  bun run examples/frame-rate-demo.ts --120fps # 120 FPS (8ms interval)"
);
console.log("\nPress Ctrl+C to exit\n");

// Parse target FPS from args
const args = process.argv.slice(2);
let targetFps = 0; // 0 means unlimited
let intervalMs = 0;

for (const arg of args) {
  const match = arg.match(/--(\d+)fps/);
  if (match) {
    targetFps = Number.parseInt(match[1], 10);
    intervalMs = Math.floor(1000 / targetFps);
    break;
  }
}

await new Promise((resolve) => setTimeout(resolve, 1000));

const term = Terminal.open();
term.hideCursor();
term.clear();

// State
let x = 0;
let y = Math.floor(term.rows / 2);
let dx = 1;
let dy = 0;
let frame = 0;
let running = true;

// FPS tracking
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;

// Moving square that bounces around
function render() {
  const now = performance.now();

  // Clear previous position (simple approach)
  term.clear();

  // Draw moving square
  const size = 5;
  const colors = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
  ];
  const color = colors[Math.floor(frame / 10) % colors.length];

  for (let sy = 0; sy < size; sy++) {
    for (let sx = 0; sx < size; sx++) {
      if (y + sy < term.rows && x + sx < term.cols) {
        term.putChar(y + sy, x + sx, "█", { fg: color });
      }
    }
  }

  // Update position
  x += dx;
  y += dy;

  // Bounce off walls
  if (x <= 0 || x >= term.cols - size) {
    dx = -dx;
    x = Math.max(0, Math.min(term.cols - size, x));
  }
  if (y <= 0 || y >= term.rows - size - 3) {
    // Leave room for stats
    dy = -dy;
    y = Math.max(0, Math.min(term.rows - size - 3, y));
  }

  // Change direction randomly
  if (Math.random() < 0.02) {
    dx = Math.random() < 0.5 ? -1 : 1;
    dy = Math.random() < 0.5 ? -1 : 1;
  }

  // Draw stats
  const mode = targetFps === 0 ? "UNLIMITED" : `${targetFps} FPS`;
  term.putText(term.rows - 3, 2, ` Mode: ${mode} `, {
    fg: "#000000",
    bg: "#0066cc",
    bold: true,
  });

  term.putText(term.rows - 2, 2, ` Actual FPS: ${fps.toFixed(1)} `, {
    fg: "#000000",
    bg: "#00cc00",
    bold: true,
  });

  const frameTime = now - lastTime;
  term.putText(term.rows - 1, 2, ` Frame time: ${frameTime.toFixed(1)}ms `, {
    fg: "#000000",
    bg: "#cccc00",
  });

  // Render
  term.render();

  // Update FPS counter
  frameCount++;
  if (frameCount >= 30) {
    // Update every 30 frames
    fps = (frameCount * 1000) / (now - lastTime + frameTime);
    frameCount = 0;
  }
  lastTime = now;

  frame++;
}

// Start render loop
if (targetFps === 0) {
  // Unlimited FPS using setImmediate
  function immediateLoop() {
    if (!running) {
      return;
    }
    render();
    setImmediate(immediateLoop);
  }
  immediateLoop();
} else {
  // Fixed FPS using setInterval
  const interval = setInterval(() => {
    if (!running) {
      clearInterval(interval);
      return;
    }
    render();
  }, intervalMs);
}

// Cleanup
process.on("SIGINT", () => {
  running = false;
  setTimeout(() => {
    term.clear();
    term.close();
    console.log(`\nFinal FPS: ${fps.toFixed(1)}`);
    process.exit(0);
  }, 100);
});
