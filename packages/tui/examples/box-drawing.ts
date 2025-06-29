#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Demonstrate box drawing characters and layouts
const term = Terminal.open();

term.hideCursor();
term.clear();

// Box drawing characters
const chars = {
  // Single line
  horizontal: "─",
  vertical: "│",
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  cross: "┼",
  teeDown: "┬",
  teeUp: "┴",
  teeRight: "├",
  teeLeft: "┤",

  // Double line
  doubleHorizontal: "═",
  doubleVertical: "║",
  doubleTopLeft: "╔",
  doubleTopRight: "╗",
  doubleBottomLeft: "╚",
  doubleBottomRight: "╝",
};

// Draw different box styles
function drawBox(
  x: number,
  y: number,
  width: number,
  height: number,
  style: "single" | "double" = "single"
) {
  const h = style === "double" ? chars.doubleHorizontal : chars.horizontal;
  const v = style === "double" ? chars.doubleVertical : chars.vertical;
  const tl = style === "double" ? chars.doubleTopLeft : chars.topLeft;
  const tr = style === "double" ? chars.doubleTopRight : chars.topRight;
  const bl = style === "double" ? chars.doubleBottomLeft : chars.bottomLeft;
  const br = style === "double" ? chars.doubleBottomRight : chars.bottomRight;

  // Top border
  term.putChar(y, x, tl);
  for (let i = 1; i < width - 1; i++) {
    term.putChar(y, x + i, h);
  }
  term.putChar(y, x + width - 1, tr);

  // Sides
  for (let i = 1; i < height - 1; i++) {
    term.putChar(y + i, x, v);
    term.putChar(y + i, x + width - 1, v);
  }

  // Bottom border
  term.putChar(y + height - 1, x, bl);
  for (let i = 1; i < width - 1; i++) {
    term.putChar(y + height - 1, x + i, h);
  }
  term.putChar(y + height - 1, x + width - 1, br);
}

// Title
term.putText(1, 2, "Box Drawing Demo", { bold: true, underline: true });

// Single line box
drawBox(2, 3, 30, 8, "single");
term.putText(4, 4, "Single Line Box", { bold: true });
term.putText(6, 4, "Simple and clean");
term.putText(7, 4, "Most common style");

// Double line box
drawBox(35, 3, 30, 8, "double");
term.putText(4, 37, "Double Line Box", { bold: true, fg: "#00ff00" });
term.putText(6, 37, "Bold appearance");
term.putText(7, 37, "Good for emphasis");

// Mixed style box with divisions
const tableX = 2;
const tableY = 12;
const tableWidth = 60;
const tableHeight = 10;

// Outer box
drawBox(tableX, tableY, tableWidth, tableHeight);

// Title
term.putText(tableY + 1, tableX + 2, "Table Layout Example", { bold: true });

// Horizontal divider
const dividerY = tableY + 3;
term.putChar(dividerY, tableX, chars.teeRight);
for (let i = 1; i < tableWidth - 1; i++) {
  term.putChar(dividerY, tableX + i, chars.horizontal);
}
term.putChar(dividerY, tableX + tableWidth - 1, chars.teeLeft);

// Vertical dividers
const col1 = tableX + 20;
const col2 = tableX + 40;

for (let y = tableY + 1; y < tableY + tableHeight - 1; y++) {
  if (y === dividerY) {
    term.putChar(y, col1, chars.cross);
    term.putChar(y, col2, chars.cross);
  } else {
    term.putChar(y, col1, chars.vertical);
    term.putChar(y, col2, chars.vertical);
  }
}
term.putChar(tableY, col1, chars.teeDown);
term.putChar(tableY, col2, chars.teeDown);
term.putChar(tableY + tableHeight - 1, col1, chars.teeUp);
term.putChar(tableY + tableHeight - 1, col2, chars.teeUp);

// Table headers
term.putText(dividerY - 1, tableX + 2, "Column A", { bold: true });
term.putText(dividerY - 1, col1 + 2, "Column B", { bold: true });
term.putText(dividerY - 1, col2 + 2, "Column C", { bold: true });

// Table data
const data = [
  ["Item 1", "Value A", "Status"],
  ["Item 2", "Value B", "Active"],
  ["Item 3", "Value C", "Done"],
  ["Item 4", "Value D", "Pending"],
];

for (let i = 0; i < data.length; i++) {
  const row = dividerY + 2 + i;
  term.putText(row, tableX + 2, data[i][0]);
  term.putText(row, col1 + 2, data[i][1]);
  let statusColor: string | undefined;
  if (data[i][2] === "Active") {
    statusColor = "#00ff00";
  } else if (data[i][2] === "Done") {
    statusColor = "#0088ff";
  } else if (data[i][2] === "Pending") {
    statusColor = "#ffaa00";
  }

  term.putText(row, col2 + 2, data[i][2], {
    fg: statusColor,
  });
}

// Instructions
term.putText(term.rows - 1, 2, "Press Ctrl+C to exit", { dim: true });

term.render();
term.showCursor();
term.flush();

// Keep running
process.stdin.resume();
