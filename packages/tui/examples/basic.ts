#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Create a simple demo showing basic terminal operations
const term = Terminal.open();

// Title constant
const title = " @boosted/tui Demo ";

// Function to draw the UI
function drawUI(message?: string) {
  const width = term.cols;
  const height = term.rows;

  // Clear the content
  term.clear();

  // Top border
  for (let col = 0; col < width; col++) {
    term.putChar(0, col, "─");
  }

  // Bottom border
  for (let col = 0; col < width; col++) {
    term.putChar(height - 1, col, "─");
  }

  // Left and right borders
  for (let row = 1; row < height - 1; row++) {
    term.putChar(row, 0, "│");
    term.putChar(row, width - 1, "│");
  }

  // Corners
  term.putChar(0, 0, "┌");
  term.putChar(0, width - 1, "┐");
  term.putChar(height - 1, 0, "└");
  term.putChar(height - 1, width - 1, "┘");

  // Title
  const titleX = Math.floor((width - title.length) / 2);
  term.putText(0, titleX, title, { bold: true });

  // Content
  if (message) {
    term.putText(2, 2, message, { bold: true, fg: "#ffff00" });
  } else {
    term.putText(2, 2, "Welcome to @boosted/tui!", {
      bold: true,
      fg: "#00ff00",
    });
    term.putText(4, 2, "Features:", { underline: true });
    term.putText(5, 4, "• Cell-based rendering");
    term.putText(6, 4, "• Diff-based updates");
    term.putText(7, 4, "• 24-bit colors", { fg: "#ff00ff" });
    term.putText(8, 4, "• Text attributes", { italic: true });
    term.putText(9, 4, "• Bun-native performance");
  }

  // Status line
  const status = `Size: ${width}×${height} | Press Ctrl+C to exit`;
  term.putText(height - 1, 2, status, { dim: true });

  // Render everything
  term.render();

  // Show cursor at a specific position
  term.moveTo(height - 2, 2);
  term.showCursor();
  term.flush();
}

// Initial draw
drawUI();

// Handle resize
term.on("resize", (dims) => {
  const dimensions = dims as { cols: number; rows: number };
  drawUI(`Terminal resized to ${dimensions.cols}×${dimensions.rows}!`);
});

// Keep the program running
process.stdin.resume();
