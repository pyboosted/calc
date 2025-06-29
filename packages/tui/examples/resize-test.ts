#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Test resize handling with comprehensive UI
const term = Terminal.open({ syncUpdate: true });

let resizeCount = 0;
let lastWidth = term.cols;
let lastHeight = term.rows;

function draw() {
  const width = term.cols;
  const height = term.rows;

  // Title (with padding)
  term.putText(1, 3, "Resize Test", { bold: true, underline: true });

  // Current dimensions
  term.putText(3, 3, `Current size: ${width}×${height}`, { bold: true });
  term.putText(4, 3, `Resize count: ${resizeCount}`, { fg: "#00ff00" });

  if (lastWidth !== width || lastHeight !== height) {
    term.putText(5, 3, `Changed from: ${lastWidth}×${lastHeight}`, {
      fg: "#ffaa00",
    });
    lastWidth = width;
    lastHeight = height;
  }

  // Instructions (ensure they don't overflow)
  const instruction1 = "Try resizing your terminal window!";
  const instruction2 = "The display should update cleanly without artifacts.";

  // Only display if there's enough space
  if (width > instruction1.length + 6) {
    term.putText(7, 3, instruction1, { fg: "#00aaff" });
  }
  if (width > instruction2.length + 6) {
    term.putText(8, 3, instruction2);
  }

  // Draw a grid to show the boundaries (with padding)
  const gridStartY = 10;
  const gridHeight = Math.min(10, height - gridStartY - 4);
  const gridWidth = Math.min(60, width - 6); // Account for padding on both sides

  if (gridHeight > 2 && gridWidth > 2) {
    // Grid border
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (y === 0 || y === gridHeight - 1) {
          // Top and bottom borders - draw full width
          term.putChar(gridStartY + y, 3 + x, "+", { fg: "#666666" });
        } else if (x === 0 || x === gridWidth - 1) {
          // Left and right borders
          term.putChar(gridStartY + y, 3 + x, "+", { fg: "#666666" });
        } else if (y % 2 === 0 && x % 4 === 0) {
          // Interior dots
          term.putChar(gridStartY + y, 3 + x, "·", { dim: true });
        }
      }
    }
  }

  // Draw a border to show the edges
  // Top and bottom
  for (let x = 0; x < width; x++) {
    term.putChar(0, x, "═", { fg: "#666666" });
    term.putChar(height - 1, x, "═", { fg: "#666666" });
  }

  // Left and right
  for (let y = 1; y < height - 1; y++) {
    term.putChar(y, 0, "║", { fg: "#666666" });
    term.putChar(y, width - 1, "║", { fg: "#666666" });
  }

  // Corners
  term.putChar(0, 0, "╔", { fg: "#666666" });
  term.putChar(0, width - 1, "╗", { fg: "#666666" });
  term.putChar(height - 1, 0, "╚", { fg: "#666666" });
  term.putChar(height - 1, width - 1, "╝", { fg: "#666666" });

  // Center cross to show middle
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  term.putChar(centerY, centerX, "╬", { fg: "#ff00ff", bold: true });
  term.putText(centerY + 1, centerX - 3, "CENTER", {
    fg: "#ff00ff",
    dim: true,
  });

  // Timestamp in corner
  const time = new Date().toLocaleTimeString();
  if (width > time.length + 4) {
    term.putText(height - 2, width - time.length - 3, time, {
      fg: "#00ff00",
      dim: true,
    });
  }

  // Status line (with padding)
  term.putText(height - 2, 3, "Press Ctrl+C to exit", { dim: true });

  // Render the frame
  term.render();
}

// Initial setup
term.hideCursor();
term.clear();
term.render();
draw();

// Handle resize
term.on("resize", () => {
  resizeCount++;
  draw();
});

// Update time every second
const interval = setInterval(() => {
  draw();
}, 1000);

// Cleanup
process.on("SIGINT", () => {
  clearInterval(interval);
  term.showCursor();
  term.close();
  process.exit(0);
});

// Keep running
process.stdin.resume();
