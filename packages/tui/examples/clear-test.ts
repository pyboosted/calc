#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Test clear functionality
const term = Terminal.open();

console.log("Terminal opened. This text should disappear when we clear...");

// Wait a moment then clear
setTimeout(() => {
  term.clear();
  term.putText(0, 0, "Screen cleared!", { bold: true });
  term.putText(2, 0, "The clear() method should:", { underline: true });
  term.putText(3, 2, "1. Clear the diff engine buffers");
  term.putText(4, 2, "2. Mark all cells as empty");
  term.putText(5, 2, "3. The next render() will update the display");

  term.putText(7, 0, "Press Ctrl+C to exit", { dim: true });

  term.render();
}, 1000);

// Keep running
process.stdin.resume();
