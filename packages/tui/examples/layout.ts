#!/usr/bin/env bun
import { type Attributes, Terminal } from "../src/index.ts";

// Layout and panel demo
const term = Terminal.open();

term.hideCursor();
term.clear();

// Helper to draw a panel
function drawPanel(
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  attrs?: Attributes
) {
  // Border
  term.putChar(y, x, "┌", attrs);
  term.putChar(y, x + width - 1, "┐", attrs);
  term.putChar(y + height - 1, x, "└", attrs);
  term.putChar(y + height - 1, x + width - 1, "┘", attrs);

  for (let i = 1; i < width - 1; i++) {
    term.putChar(y, x + i, "─", attrs);
    term.putChar(y + height - 1, x + i, "─", attrs);
  }

  for (let i = 1; i < height - 1; i++) {
    term.putChar(y + i, x, "│", attrs);
    term.putChar(y + i, x + width - 1, "│", attrs);
  }

  // Title
  if (title) {
    const titleText = ` ${title} `;
    const titleX = x + Math.floor((width - titleText.length) / 2);
    term.putText(y, titleX, titleText, { ...attrs, bold: true });
  }

  // Clear interior
  for (let row = 1; row < height - 1; row++) {
    for (let col = 1; col < width - 1; col++) {
      term.putChar(y + row, x + col, " ");
    }
  }
}

// Calculate layout
const margin = 2;
const panelGap = 2;

// Header
const headerHeight = 3;
drawPanel(margin, margin, term.cols - margin * 2, headerHeight, "");
term.putText(margin + 1, margin + 2, "📊 Dashboard Layout Example", {
  bold: true,
  fg: "#00ffff",
});

// Main content area
const contentY = margin + headerHeight + 1;
const contentHeight = term.rows - contentY - margin - 3; // Leave room for footer

// Left sidebar
const sidebarWidth = 25;
drawPanel(margin, contentY, sidebarWidth, contentHeight, "Navigation", {
  fg: "#00ff00",
});

// Sidebar content
const menuItems = [
  "📁 Files",
  "⚙️  Settings",
  "📈 Analytics",
  "👥 Users",
  "📧 Messages",
];
for (let i = 0; i < menuItems.length; i++) {
  const item = menuItems[i];
  if (!item) {
    continue;
  }
  const isSelected = i === 2;
  term.putText(contentY + 2 + i, margin + 2, item, {
    fg: isSelected ? "#000000" : "#00ff00",
    bg: isSelected ? "#00ff00" : undefined,
    bold: isSelected,
  });
}

// Main content
const mainX = margin + sidebarWidth + panelGap;
const mainWidth = term.cols - mainX - margin - 25 - panelGap; // Leave room for right panel
drawPanel(mainX, contentY, mainWidth, contentHeight, "Main Content");

// Content in main panel
term.putText(contentY + 2, mainX + 2, "Welcome to the Dashboard!", {
  bold: true,
});
term.putText(contentY + 4, mainX + 2, "This example demonstrates:");
term.putText(contentY + 5, mainX + 4, "• Panel-based layouts");
term.putText(contentY + 6, mainX + 4, "• Flexible positioning");
term.putText(contentY + 7, mainX + 4, "• Responsive design");
term.putText(contentY + 8, mainX + 4, "• Color coordination");

// Stats boxes in main area
const statsY = contentY + 10;
const statBoxWidth = 15;
const stats = [
  { label: "Users", value: "1,234", color: "#00aaff" },
  { label: "Revenue", value: "$45.6K", color: "#00ff00" },
  { label: "Orders", value: "567", color: "#ffaa00" },
];

for (let i = 0; i < stats.length; i++) {
  const stat = stats[i];
  if (!stat) {
    continue;
  }
  const statX = mainX + 2 + i * (statBoxWidth + 1);

  // Box
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < statBoxWidth; col++) {
      if (row === 0 || row === 3 || col === 0 || col === statBoxWidth - 1) {
        term.putChar(statsY + row, statX + col, "·", {
          fg: stat.color,
          dim: true,
        });
      }
    }
  }

  // Content
  term.putText(statsY + 1, statX + 2, stat.value, {
    bold: true,
    fg: stat.color,
  });
  term.putText(statsY + 2, statX + 2, stat.label, { dim: true });
}

// Right panel
const rightX = term.cols - margin - 25;
drawPanel(
  rightX,
  contentY,
  25,
  Math.floor(contentHeight / 2) - 1,
  "Notifications",
  { fg: "#ffaa00" }
);

// Notifications
const notifications = [
  { icon: "🔔", text: "New message", time: "2m" },
  { icon: "⚠️ ", text: "System alert", time: "5m" },
  { icon: "✅", text: "Task complete", time: "1h" },
];

for (let i = 0; i < notifications.length; i++) {
  const notif = notifications[i];
  if (!notif) {
    continue;
  }
  term.putText(contentY + 2 + i * 2, rightX + 2, `${notif.icon} ${notif.text}`);
  term.putText(contentY + 2 + i * 2, rightX + 20, notif.time, { dim: true });
}

// Activity panel
const activityY = contentY + Math.floor(contentHeight / 2) + 1;
drawPanel(
  rightX,
  activityY,
  25,
  Math.floor(contentHeight / 2) - 1,
  "Activity",
  { fg: "#ff00ff" }
);

// Activity graph (simple sparkline)
const sparkline = "▁▂▃▅▇▅▃▆▇▆▅▃▂▁";
term.putText(activityY + 2, rightX + 2, "CPU:", { dim: true });
term.putText(activityY + 2, rightX + 7, sparkline, { fg: "#00ff00" });

term.putText(activityY + 3, rightX + 2, "MEM:", { dim: true });
term.putText(activityY + 3, rightX + 7, "▇▇▆▅▅▄▃▃▂▂▁▁▁▁", { fg: "#00aaff" });

// Footer
const footerY = term.rows - 3;
drawPanel(margin, footerY, term.cols - margin * 2, 3, "");
term.putText(footerY + 1, margin + 2, "Ready", { fg: "#00ff00" });
term.putText(footerY + 1, term.cols - margin - 20, "Press Ctrl+C to exit", {
  dim: true,
});

// Render
term.render();
term.showCursor();
term.flush();

// Handle resize
term.on("resize", () => {
  term.close();
  console.log("Terminal resized. Please restart the demo.");
  process.exit(0);
});

// Keep running
process.stdin.resume();
