#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Parse command line arguments
const args = process.argv.slice(2);
let mode: string;
if (args.includes("--immediate")) {
  mode = "immediate";
} else if (args.includes("--interval")) {
  mode = "interval";
} else if (args.includes("--raf")) {
  mode = "raf";
} else {
  mode = "immediate";
}
const targetFps = args.find((arg) => arg.startsWith("--fps="))?.split("=")[1];
const intervalMs = targetFps ? 1000 / Number.parseInt(targetFps, 10) : 16;

console.log("🚀 TUI Color Performance Benchmark - Advanced");
console.log(`Mode: ${mode}`);
if (mode === "interval") {
  console.log(
    `Target FPS: ${targetFps || 60} (${intervalMs.toFixed(1)}ms interval)`
  );
}
console.log("Press Ctrl+C to exit\n");

// Visual demo
const term = Terminal.open();
term.hideCursor();
term.clear();

// Animation state
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

// Terminal-based requestAnimationFrame polyfill
let rafCallbacks: Array<(time: number) => void> = [];
let rafId = 0;

function requestAnimationFrame(callback: (time: number) => void): number {
  const id = ++rafId;
  rafCallbacks.push(callback);
  return id;
}

// RAF loop for terminal (16ms target)
if (mode === "raf") {
  setInterval(() => {
    const callbacks = rafCallbacks;
    rafCallbacks = [];
    const time = performance.now();
    for (const cb of callbacks) {
      cb(time);
    }
  }, 16);
}

// Main render function
function render() {
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
  term.putText(1, 2, ` Mode: ${mode.toUpperCase()} `, {
    fg: "#ffffff",
    bg: "#0066cc",
    bold: true,
  });

  term.putText(2, 2, ` FPS: ${currentFps.toFixed(1)} `, {
    fg: "#000000",
    bg: "#ffffff",
    bold: true,
  });

  // Add render time and stats
  const renderTime = performance.now() - renderStart;
  term.putText(3, 2, ` Render: ${renderTime.toFixed(1)}ms `, {
    fg: "#000000",
    bg: "#cccccc",
  });

  // Add min/max/avg stats
  term.putText(4, 2, ` Min: ${minFrameTime.toFixed(1)}ms `, {
    fg: "#ffffff",
    bg: "#008800",
  });

  term.putText(4, 20, ` Max: ${maxFrameTime.toFixed(1)}ms `, {
    fg: "#ffffff",
    bg: "#cc0000",
  });

  term.putText(
    5,
    2,
    ` Avg: ${avgFrameTime.toFixed(1)}ms (${(1000 / avgFrameTime).toFixed(0)} FPS) `,
    {
      fg: "#000000",
      bg: "#ffcc00",
    }
  );

  // Show frame timing distribution
  const buckets = [0, 0, 0, 0, 0]; // <5ms, 5-10ms, 10-16ms, 16-33ms, >33ms
  for (const time of frameTimes) {
    if (time < 5) {
      buckets[0]++;
    } else if (time < 10) {
      buckets[1]++;
    } else if (time < 16) {
      buckets[2]++;
    } else if (time < 33) {
      buckets[3]++;
    } else {
      buckets[4]++;
    }
  }

  term.putText(7, 2, " Frame Time Distribution: ", {
    fg: "#000000",
    bg: "#666666",
  });

  const labels = ["<5ms", "5-10", "10-16", "16-33", ">33ms"];
  const colors = ["#00ff00", "#88ff00", "#ffff00", "#ff8800", "#ff0000"];

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const pct =
      frameTimes.length > 0 ? (buckets[i] / frameTimes.length) * 100 : 0;
    term.putText(8 + i, 2, ` ${label}: ${pct.toFixed(0)}% `, {
      fg: "#000000",
      bg: colors[i],
    });
  }

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
}

// Start render loop based on mode
switch (mode) {
  case "immediate": {
    // Maximum possible frame rate
    function immediateLoop() {
      if (!running) {
        return;
      }
      render();
      setImmediate(immediateLoop);
    }
    immediateLoop();
    break;
  }

  case "interval": {
    // Fixed interval (default 60 FPS)
    const interval = setInterval(() => {
      if (!running) {
        clearInterval(interval);
        return;
      }
      render();
    }, intervalMs);
    break;
  }

  case "raf": {
    // Terminal RAF polyfill
    function rafLoop() {
      if (!running) {
        return;
      }
      render();
      requestAnimationFrame(rafLoop);
    }
    requestAnimationFrame(rafLoop);
    break;
  }

  default:
    // This should never be reached due to the mode parsing logic
    throw new Error(`Unknown mode: ${mode}`);
}

// Cleanup on exit
process.on("SIGINT", () => {
  running = false;
  setTimeout(() => {
    term.clear();
    term.close();
    console.log("\n\nFinal Statistics:");
    console.log(`  Average FPS: ${(1000 / avgFrameTime).toFixed(1)}`);
    console.log(`  Min frame time: ${minFrameTime.toFixed(1)}ms`);
    console.log(`  Max frame time: ${maxFrameTime.toFixed(1)}ms`);
    console.log(`  Average frame time: ${avgFrameTime.toFixed(1)}ms`);
    process.exit(0);
  }, 100);
});
