#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Create a color palette demo
const term = Terminal.open();

term.hideCursor();
term.clear();

// Title
term.putText(0, 2, "256 Color Palette", { bold: true, underline: true });

// Standard 16 colors (0-15)
term.putText(2, 2, "Standard Colors (0-15):", { bold: true });
for (let i = 0; i < 16; i++) {
  const x = 2 + (i % 8) * 9;
  const y = 3 + Math.floor(i / 8);
  term.putText(y, x, "████", { fg: i });
  // Add extra space for single-digit numbers to align with double-digit ones
  const numStr = i < 10 ? ` ${i}` : i.toString();
  term.putText(y, x + 6, numStr, { dim: true });
}

// 216 color cube (16-231)
term.putText(6, 2, "216 Color Cube (16-231):", { bold: true });
let colorIndex = 16;
for (let r = 0; r < 6; r++) {
  for (let g = 0; g < 6; g++) {
    for (let b = 0; b < 6; b++) {
      const x = 2 + b * 3 + g * 20;
      const y = 7 + r;
      if (x + 2 < term.cols) {
        term.putText(y, x, "██", { fg: colorIndex });
      }
      colorIndex++;
    }
  }
}

// Grayscale ramp (232-255)
term.putText(14, 2, "Grayscale Ramp (232-255):", { bold: true });
for (let i = 232; i <= 255; i++) {
  const x = 2 + (i - 232) * 3;
  if (x + 2 < term.cols) {
    term.putText(15, x, "██", { fg: i });
  }
}

// 24-bit color examples
term.putText(17, 2, "24-bit True Color:", { bold: true });

// Red gradient
term.putText(18, 2, "Red:  ");
for (let i = 0; i < 32; i++) {
  const intensity = Math.floor((i / 31) * 255);
  const color = `#${intensity.toString(16).padStart(2, "0")}0000`;
  if (8 + i < term.cols) {
    term.putChar(18, 8 + i, "█", { fg: color });
  }
}

// Green gradient
term.putText(19, 2, "Green:");
for (let i = 0; i < 32; i++) {
  const intensity = Math.floor((i / 31) * 255);
  const color = `#00${intensity.toString(16).padStart(2, "0")}00`;
  if (8 + i < term.cols) {
    term.putChar(19, 8 + i, "█", { fg: color });
  }
}

// Blue gradient
term.putText(20, 2, "Blue: ");
for (let i = 0; i < 32; i++) {
  const intensity = Math.floor((i / 31) * 255);
  const color = `#0000${intensity.toString(16).padStart(2, "0")}`;
  if (8 + i < term.cols) {
    term.putChar(20, 8 + i, "█", { fg: color });
  }
}

// Rainbow gradient
term.putText(22, 2, "Rainbow:", { bold: true });
for (let i = 0; i < Math.min(60, term.cols - 12); i++) {
  const hue = (i / 60) * 360;
  const { r, g, b } = hslToRgb(hue, 1, 0.5);
  const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  term.putChar(23, 11 + i, "█", { fg: color });
}

// Status
term.putText(term.rows - 1, 2, "Press Ctrl+C to exit", { dim: true });

// Render
term.render();
term.showCursor();
term.flush();

// HSL to RGB conversion
function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  const hNormalized = h / 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hNormalized * 12) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

// Keep running
process.stdin.resume();
