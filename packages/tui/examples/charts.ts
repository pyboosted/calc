#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Simple chart rendering demo
const term = Terminal.open({ syncUpdate: true });

term.hideCursor();
term.clear();

// Chart data
const barData = [
  { label: "Jan", value: 65 },
  { label: "Feb", value: 82 },
  { label: "Mar", value: 73 },
  { label: "Apr", value: 91 },
  { label: "May", value: 87 },
  { label: "Jun", value: 95 },
];

// Function to draw a bar chart
function drawBarChart(
  x: number,
  y: number,
  data: typeof barData,
  maxHeight = 10
) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = 6;

  // Draw Y axis
  for (let i = 0; i <= maxHeight; i++) {
    term.putChar(y + maxHeight - i, x - 1, "│");
    if (i % 2 === 0) {
      const value = Math.round((i / maxHeight) * maxValue);
      term.putText(y + maxHeight - i, x - 5, value.toString().padStart(3), {
        dim: true,
      });
    }
  }

  // Draw X axis
  for (let i = 0; i < data.length * barWidth + 5; i++) {
    term.putChar(y + maxHeight + 1, x + i, "─");
  }
  term.putChar(y + maxHeight + 1, x - 1, "└");

  // Draw bars
  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    const barHeight = Math.round((item.value / maxValue) * maxHeight);
    const barX = x + index * barWidth + 2;

    // Bar
    for (let h = 0; h < barHeight; h++) {
      const barY = y + maxHeight - h;
      let color: string;
      if (item.value > 85) {
        color = "#00ff00";
      } else if (item.value > 70) {
        color = "#ffaa00";
      } else {
        color = "#ff0000";
      }
      for (let w = 0; w < 3; w++) {
        term.putChar(barY, barX + w, "█", { fg: color });
      }
    }

    // Value on top
    term.putText(y + maxHeight - barHeight - 1, barX, item.value.toString(), {
      bold: true,
      fg: "#ffffff",
    });

    // Label
    term.putText(y + maxHeight + 2, barX, item.label, { dim: true });
  }
}

// Function to draw a line chart using braille characters
function drawLineChart(x: number, y: number, width: number, height: number) {
  // Sample sine wave data
  const points: number[] = [];
  for (let i = 0; i < width; i++) {
    const value = (Math.sin(i / 10) + 1) / 2;
    points.push(value);
  }

  // Draw axes
  for (let i = 0; i <= height; i++) {
    term.putChar(y + i, x - 1, "│");
  }
  for (let i = 0; i < width; i++) {
    term.putChar(y + height + 1, x + i, "─");
  }
  term.putChar(y + height + 1, x - 1, "└");

  // Plot points
  points.forEach((value, i) => {
    const plotY = y + height - Math.round(value * height);
    if (i > 0) {
      // Connect with previous point
      const prevValue = points[i - 1];
      const prevY = y + height - Math.round(prevValue * height);

      // Simple line connection
      if (Math.abs(plotY - prevY) <= 1) {
        term.putChar(plotY, x + i, "●", { fg: "#00aaff" });
      } else {
        // Draw vertical connection
        const startY = Math.min(plotY, prevY);
        const endY = Math.max(plotY, prevY);
        for (let cy = startY; cy <= endY; cy++) {
          term.putChar(cy, x + i, cy === plotY ? "●" : "│", { fg: "#00aaff" });
        }
      }
    } else {
      term.putChar(plotY, x + i, "●", { fg: "#00aaff" });
    }
  });
}

// Function to draw a simple pie chart (using block characters)
function drawPieChart(centerX: number, centerY: number, radius: number) {
  const data = [
    { label: "A", value: 30, color: "#ff0000" },
    { label: "B", value: 25, color: "#00ff00" },
    { label: "C", value: 20, color: "#0000ff" },
    { label: "D", value: 15, color: "#ffff00" },
    { label: "E", value: 10, color: "#ff00ff" },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const chars = ["◐", "◑", "◒", "◓"];

  // Simple representation using circular quadrants
  let currentAngle = 0;

  // Draw circle outline
  for (let angle = 0; angle < 360; angle += 10) {
    const rad = (angle * Math.PI) / 180;
    const x = Math.round(centerX + radius * Math.cos(rad));
    const y = Math.round(centerY + radius * Math.sin(rad) * 0.5); // Aspect ratio correction
    term.putChar(y, x, "·", { dim: true });
  }

  // Fill segments (simplified)
  data.forEach((segment, i) => {
    const percentage = segment.value / total;
    const endAngle = currentAngle + percentage * 360;

    // Draw segment indicator
    const midAngle = currentAngle + (endAngle - currentAngle) / 2;
    const rad = (midAngle * Math.PI) / 180;
    const x = Math.round(centerX + radius * 0.7 * Math.cos(rad));
    const y = Math.round(centerY + radius * 0.7 * Math.sin(rad) * 0.5);

    term.putChar(y, x, chars[i % chars.length], {
      fg: segment.color,
      bold: true,
    });

    // Legend
    const legendY = centerY - radius + i;
    term.putText(
      legendY,
      centerX + radius + 5,
      `${chars[i % chars.length]} ${segment.label}: ${segment.value}%`,
      {
        fg: segment.color,
      }
    );

    currentAngle = endAngle;
  });
}

// Draw the charts
term.putText(1, 2, "Terminal Charts Demo", { bold: true, underline: true });

// Bar chart
term.putText(3, 2, "Bar Chart - Monthly Sales", { bold: true });
drawBarChart(7, 5, barData, 10);

// Line chart
term.putText(3, 50, "Line Chart - Sine Wave", { bold: true });
drawLineChart(52, 5, 25, 10);

// Pie chart
term.putText(20, 2, "Pie Chart - Market Share", { bold: true });
drawPieChart(15, 25, 8);

// Instructions
term.putText(term.rows - 1, 2, "Press Ctrl+C to exit", { dim: true });

term.render();
term.showCursor();
term.flush();

// Keep running
process.stdin.resume();
