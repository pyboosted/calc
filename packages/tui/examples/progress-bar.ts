#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Progress bar demo with different styles
const term = Terminal.open({ syncUpdate: true });

term.hideCursor();
term.clear();

// Progress state
const progressBars = [
  { name: "Download", progress: 0, speed: 0.8, color: "#00ff00" },
  { name: "Processing", progress: 0, speed: 1.2, color: "#00aaff" },
  { name: "Upload", progress: 0, speed: 0.6, color: "#ff00ff" },
  { name: "Verification", progress: 0, speed: 1.5, color: "#ffaa00" },
];

// Different bar styles
const barStyles = {
  blocks: { empty: "░", filled: "█" },
  lines: { empty: "─", filled: "═" },
  arrows: { empty: "·", filled: "▶" },
  dots: { empty: "·", filled: "●" },
};

function drawProgressBar(
  x: number,
  y: number,
  width: number,
  progress: number,
  label: string,
  color: string,
  style: keyof typeof barStyles = "blocks"
) {
  const chars = barStyles[style];
  const filled = Math.floor(progress * width);
  const percent = Math.floor(progress * 100);

  // Label
  term.putText(y, x, `${label}:`, { bold: true });

  // Bar
  term.putChar(y, x + 15, "[");
  for (let i = 0; i < width; i++) {
    const isFilled = i < filled;
    term.putChar(y, x + 16 + i, isFilled ? chars.filled : chars.empty, {
      fg: isFilled ? color : undefined,
      dim: !isFilled,
    });
  }
  term.putChar(y, x + 16 + width, "]");

  // Percentage
  term.putText(y, x + 18 + width, `${percent}%`.padStart(4), {
    bold: percent === 100,
    fg: percent === 100 ? "#00ff00" : undefined,
  });
}

// Spinner for indeterminate progress
const spinners = {
  dots: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  line: ["-", "\\", "|", "/"],
  circle: ["◐", "◓", "◑", "◒"],
  arrow: ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"],
};

let frame = 0;

function draw() {
  // Title
  term.putText(1, 2, "Progress Bar Demo", { bold: true, underline: true });

  // Update progress bars
  let y = 4;
  for (let i = 0; i < progressBars.length; i++) {
    const bar = progressBars[i];

    // Update progress
    if (bar.progress < 1) {
      bar.progress = Math.min(1, bar.progress + bar.speed / 100);
    }

    // Draw bar with different styles
    const styleNames = Object.keys(barStyles) as (keyof typeof barStyles)[];
    const style = styleNames[i % styleNames.length];
    drawProgressBar(2, y + i * 2, 40, bar.progress, bar.name, bar.color, style);
  }

  // Overall progress
  y += progressBars.length * 2 + 1;
  const totalProgress =
    progressBars.reduce((sum, bar) => sum + bar.progress, 0) /
    progressBars.length;
  term.putText(y, 2, "Total Progress:", { bold: true, underline: true });
  drawProgressBar(2, y + 1, 40, totalProgress, "Overall", "#ffffff", "blocks");

  // Indeterminate progress spinners
  y += 4;
  term.putText(y, 2, "Indeterminate Progress:", {
    bold: true,
    underline: true,
  });
  y += 2;

  const spinnerNames = Object.keys(spinners) as (keyof typeof spinners)[];
  spinnerNames.forEach((name, i) => {
    const spinner = spinners[name];
    const index = Math.floor(frame / 5) % spinner.length;
    term.putText(y + i, 2, `${name}:`.padEnd(10) + spinner[index], {
      fg: "#00ffff",
    });
  });

  // Activity indicator
  y += spinnerNames.length + 2;
  const activityWidth = 50;
  const activityPos = Math.floor(
    (Math.sin(frame / 20) + 1) * (activityWidth / 2)
  );
  term.putText(y, 2, "Activity:", { bold: true });
  for (let i = 0; i < activityWidth; i++) {
    const distance = Math.abs(i - activityPos);
    let char: string;
    let opacity: number;
    if (distance === 0) {
      char = "●";
      opacity = 1;
    } else if (distance <= 2) {
      char = "○";
      opacity = 0.5;
    } else {
      char = "·";
      opacity = 0.2;
    }
    term.putChar(y, 12 + i, char, {
      fg: "#00ff00",
      dim: opacity < 0.5,
    });
  }

  // Instructions
  term.putText(term.rows - 1, 2, "Press Ctrl+C to exit", { dim: true });

  // Render
  term.render();
  frame++;

  // Reset progress bars when all complete
  if (progressBars.every((bar) => bar.progress >= 1)) {
    setTimeout(() => {
      for (const bar of progressBars) {
        bar.progress = 0;
      }
    }, 1000);
  }
}

// Initial draw
draw();

// Animation loop
const interval = setInterval(draw, 50);

// Cleanup
process.on("SIGINT", () => {
  clearInterval(interval);
  term.close();
  process.exit(0);
});

// Handle resize
term.on("resize", () => {
  term.clear();
  draw();
});

// Keep running
process.stdin.resume();
