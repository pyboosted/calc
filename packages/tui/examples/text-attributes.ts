#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Demonstrate all text attributes
const term = Terminal.open();

term.hideCursor();
term.clear();

// Title
term.putText(1, 2, "Text Attributes Demo", { bold: true, underline: true });

// Individual attributes
let row = 3;
term.putText(row++, 2, "Normal text");
term.putText(row++, 2, "Bold text", { bold: true });
term.putText(row++, 2, "Dim text", { dim: true });
term.putText(row++, 2, "Italic text", { italic: true });
term.putText(row++, 2, "Underlined text", { underline: true });
term.putText(row++, 2, "Reverse video text", { reverse: true });
term.putText(row++, 2, "Strikethrough text", { strikethrough: true });

// Combined attributes
row++;
term.putText(row++, 2, "Bold + Italic", { bold: true, italic: true });
term.putText(row++, 2, "Bold + Underline", { bold: true, underline: true });
term.putText(row++, 2, "Dim + Italic", { dim: true, italic: true });

// With colors
row++;
term.putText(row++, 2, "Red text", { fg: "#ff0000" });
term.putText(row++, 2, "Green text", { fg: "#00ff00" });
term.putText(row++, 2, "Blue text", { fg: "#0000ff" });
term.putText(row++, 2, "Yellow background", { bg: "#ffff00" });
term.putText(row++, 2, "White on blue", { fg: "#ffffff", bg: "#0000ff" });
term.putText(row++, 2, "Bold red on yellow", {
  bold: true,
  fg: "#ff0000",
  bg: "#ffff00",
});

// Instructions
term.putText(term.rows - 1, 2, "Press Ctrl+C to exit", { dim: true });

term.render();
term.showCursor();
term.flush();

// Keep running
process.stdin.resume();
