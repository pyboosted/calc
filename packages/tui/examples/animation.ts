#!/usr/bin/env bun
import { type Attributes, Terminal } from "../src/index.ts";

// Create animated demo
const term = Terminal.open({ syncUpdate: true });

// Hide cursor and clear screen
term.hideCursor();
term.clear();

// Animation state
let frame = 0;
const colors = [
  "#ff0000",
  "#ff7f00",
  "#ffff00",
  "#00ff00",
  "#0000ff",
  "#4b0082",
  "#9400d3",
];
const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// Draw static elements
function drawStaticElements() {
  const _width = term.cols;
  const height = term.rows;

  // Title
  term.putText(1, 2, "@boosted/tui Animation Demo", {
    bold: true,
    underline: true,
  });

  // Instructions
  term.putText(height - 2, 2, "Press Ctrl+C to exit", { dim: true });
}

// Animation loop
function animate() {
  frame++;

  // Clear dynamic area
  for (let row = 3; row < term.rows - 3; row++) {
    for (let col = 0; col < term.cols; col++) {
      term.putChar(row, col, " ");
    }
  }

  // Animated spinner
  const spinnerIndex = Math.floor(frame / 3) % spinnerFrames.length;
  term.putText(3, 2, `Loading ${spinnerFrames[spinnerIndex]}`, { bold: true });

  // Moving text wave
  const waveText = "Hello, World!";
  const waveY = 5;
  for (let i = 0; i < waveText.length; i++) {
    const x = 10 + i * 2;
    const y = waveY + Math.floor(Math.sin(frame / 10 + i * 0.5) * 3);
    const colorIndex = (i + Math.floor(frame / 5)) % colors.length;

    if (y >= 3 && y < term.rows - 3 && x < term.cols) {
      term.putChar(y, x, waveText[i], { fg: colors[colorIndex], bold: true });
    }
  }

  // Progress bar
  const progress = (frame % 100) / 100;
  const barWidth = Math.min(40, term.cols - 10);
  const filled = Math.floor(progress * barWidth);

  term.putText(10, 5, "Progress: [", { dim: true });
  for (let i = 0; i < barWidth; i++) {
    const attrs: Attributes =
      i < filled ? { fg: "#00ff00", bold: true } : { dim: true };
    term.putChar(10, 15 + i, i < filled ? "█" : "░", attrs);
  }
  term.putText(10, 15 + barWidth, `] ${Math.floor(progress * 100)}%`, {
    dim: true,
  });

  // Rainbow line
  const rainbowY = 12;
  const rainbowText = "═".repeat(Math.min(50, term.cols - 10));
  for (let i = 0; i < rainbowText.length; i++) {
    const colorIndex = (i + frame) % colors.length;
    if (5 + i < term.cols - 5) {
      term.putChar(rainbowY, 5 + i, rainbowText[i], { fg: colors[colorIndex] });
    }
  }

  // Bouncing ball
  const ballX =
    5 + Math.floor((Math.sin(frame / 20) + 1) * ((term.cols - 15) / 2));
  const ballY = 14 + Math.floor(Math.abs(Math.sin(frame / 15)) * 5);
  if (ballY < term.rows - 3 && ballX < term.cols - 2) {
    term.putText(ballY, ballX, "●", { fg: "#ffff00", bold: true });
  }

  // Render frame
  term.render();
}

// Initial draw
drawStaticElements();
term.render();
term.flush();

// Start animation loop (60 FPS)
const animationInterval = setInterval(() => {
  animate();
}, 1000 / 60);

// Handle resize
term.on("resize", () => {
  term.clear();
  drawStaticElements();
  animate();
});

// Cleanup on exit
process.on("SIGINT", () => {
  clearInterval(animationInterval);
  term.close();
  process.exit(0);
});

// Keep the program running
process.stdin.resume();
