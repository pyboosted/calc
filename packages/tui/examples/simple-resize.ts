#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Simple resize test
const term = Terminal.open();
term.hideCursor();

let resizeCount = 0;

function draw() {
  // Draw a simple border using the full terminal size
  const w = term.cols;
  const h = term.rows;

  // Clear by filling with spaces
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      term.putChar(y, x, " ");
    }
  }

  // Draw border
  for (let x = 0; x < w; x++) {
    term.putChar(0, x, "─");
    term.putChar(h - 1, x, "─");
  }
  for (let y = 0; y < h; y++) {
    term.putChar(y, 0, "│");
    term.putChar(y, w - 1, "│");
  }

  // Corners
  term.putChar(0, 0, "┌");
  term.putChar(0, w - 1, "┐");
  term.putChar(h - 1, 0, "└");
  term.putChar(h - 1, w - 1, "┘");

  // Info
  term.putText(2, 2, `Size: ${w}×${h}`, { bold: true });
  term.putText(3, 2, `Resizes: ${resizeCount}`);
  term.putText(
    5,
    2,
    "Resize your terminal - the border should always fit perfectly."
  );

  term.render();
}

// Initial draw
draw();

// Handle resize
term.on("resize", () => {
  resizeCount++;
  draw();
});

// Cleanup on exit
process.on("SIGINT", () => {
  term.showCursor();
  term.close();
  process.exit(0);
});

// Keep running
process.stdin.resume();
