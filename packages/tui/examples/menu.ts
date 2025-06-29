#!/usr/bin/env bun
import { Terminal } from "../src/index.ts";

// Interactive menu demo (visual only - no input handling in Phase 1)
const term = Terminal.open({ syncUpdate: true });

term.hideCursor();
term.clear();

// Menu data
interface MenuItem {
  label: string;
  icon?: string;
  description?: string;
  submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: "File",
    icon: "📁",
    submenu: [
      { label: "New", icon: "📄" },
      { label: "Open", icon: "📂" },
      { label: "Save", icon: "💾" },
      { label: "Exit", icon: "🚪" },
    ],
  },
  {
    label: "Edit",
    icon: "✏️",
    submenu: [
      { label: "Cut", icon: "✂️" },
      { label: "Copy", icon: "📋" },
      { label: "Paste", icon: "📌" },
      { label: "Find", icon: "🔍" },
    ],
  },
  {
    label: "View",
    icon: "👁️",
    submenu: [
      { label: "Zoom In", icon: "🔍" },
      { label: "Zoom Out", icon: "🔍" },
      { label: "Full Screen", icon: "🖥️" },
    ],
  },
  {
    label: "Help",
    icon: "❓",
    submenu: [
      { label: "Documentation", icon: "📚" },
      { label: "About", icon: "ℹ️" },
    ],
  },
];

// Draw horizontal menu bar
function drawMenuBar(selectedIndex = 0) {
  // Background
  for (let x = 0; x < term.cols; x++) {
    term.putChar(0, x, " ", { bg: "#333333" });
  }

  // Menu items
  let x = 2;
  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    const isSelected = i === selectedIndex;
    const text = ` ${item.icon || ""} ${item.label} `;

    term.putText(0, x, text, {
      fg: isSelected ? "#000000" : "#ffffff",
      bg: isSelected ? "#00aaff" : "#333333",
      bold: isSelected,
    });

    x += text.length + 1;
  }
}

// Draw dropdown menu
function drawDropdown(menuIndex: number, selectedItem = 0) {
  const menu = menuItems[menuIndex];
  if (!menu.submenu) {
    return;
  }

  // Calculate position
  let menuX = 2;
  for (let i = 0; i < menuIndex; i++) {
    menuX += ` ${menuItems[i].icon || ""} ${menuItems[i].label} `.length + 1;
  }

  const menuWidth = Math.max(
    ...menu.submenu.map(
      (item) => (item.icon || "").length + item.label.length + 4
    ),
    20
  );
  const menuHeight = menu.submenu.length + 2;

  // Draw shadow
  for (let y = 2; y < 2 + menuHeight; y++) {
    for (let x = menuX + 1; x < menuX + menuWidth + 1; x++) {
      if (x < term.cols && y < term.rows) {
        term.putChar(y, x, " ", { bg: "#111111" });
      }
    }
  }

  // Draw menu box
  for (let y = 1; y < 1 + menuHeight; y++) {
    for (let x = menuX; x < menuX + menuWidth; x++) {
      if (x < term.cols && y < term.rows) {
        term.putChar(y, x, " ", { bg: "#ffffff" });
      }
    }
  }

  // Border
  term.putChar(1, menuX, "┌", { fg: "#666666", bg: "#ffffff" });
  term.putChar(1, menuX + menuWidth - 1, "┐", { fg: "#666666", bg: "#ffffff" });
  term.putChar(1 + menuHeight - 1, menuX, "└", {
    fg: "#666666",
    bg: "#ffffff",
  });
  term.putChar(1 + menuHeight - 1, menuX + menuWidth - 1, "┘", {
    fg: "#666666",
    bg: "#ffffff",
  });

  for (let x = 1; x < menuWidth - 1; x++) {
    term.putChar(1, menuX + x, "─", { fg: "#666666", bg: "#ffffff" });
    term.putChar(1 + menuHeight - 1, menuX + x, "─", {
      fg: "#666666",
      bg: "#ffffff",
    });
  }

  for (let y = 1; y < menuHeight - 1; y++) {
    term.putChar(1 + y, menuX, "│", { fg: "#666666", bg: "#ffffff" });
    term.putChar(1 + y, menuX + menuWidth - 1, "│", {
      fg: "#666666",
      bg: "#ffffff",
    });
  }

  // Menu items
  for (let i = 0; i < menu.submenu.length; i++) {
    const item = menu.submenu[i];
    const y = 2 + i;
    const isSelected = i === selectedItem;

    // Selection bar
    for (let x = 1; x < menuWidth - 1; x++) {
      term.putChar(y, menuX + x, " ", {
        bg: isSelected ? "#00aaff" : "#ffffff",
      });
    }

    // Item text
    const itemText = `${item.icon || "  "} ${item.label}`;
    term.putText(y, menuX + 2, itemText, {
      fg: isSelected ? "#ffffff" : "#000000",
      bg: isSelected ? "#00aaff" : "#ffffff",
      bold: isSelected,
    });
  }
}

// Helper function to draw a box
function drawBox(x: number, y: number, width: number, height: number) {
  // Draw horizontal lines
  for (let i = 1; i < width - 1; i++) {
    term.putChar(y, x + i, "─", { fg: "#666666" });
    term.putChar(y + height - 1, x + i, "─", { fg: "#666666" });
  }

  // Draw vertical lines
  for (let j = 1; j < height - 1; j++) {
    term.putChar(y + j, x, "│", { fg: "#666666" });
    term.putChar(y + j, x + width - 1, "│", { fg: "#666666" });
  }

  // Draw corners
  term.putChar(y, x, "┌", { fg: "#666666" });
  term.putChar(y, x + width - 1, "┐", { fg: "#666666" });
  term.putChar(y + height - 1, x, "└", { fg: "#666666" });
  term.putChar(y + height - 1, x + width - 1, "┘", { fg: "#666666" });

  // Fill interior
  for (let j = 1; j < height - 1; j++) {
    for (let i = 1; i < width - 1; i++) {
      term.putChar(y + j, x + i, " ", { fg: "#666666" });
    }
  }
}

// List view example
function drawListView() {
  const listX = 2;
  const listY = 5;
  const listWidth = 40;
  const listHeight = 15;

  // Title
  term.putText(listY - 1, listX, "File Browser", { bold: true });

  // Draw the list box
  drawBox(listX, listY, listWidth, listHeight);

  // List items
  const files = [
    { name: "index.ts", type: "file", size: "2.4K" },
    { name: "terminal.ts", type: "file", size: "8.1K" },
    { name: "examples/", type: "dir", size: "-" },
    { name: "tests/", type: "dir", size: "-" },
    { name: "package.json", type: "file", size: "512B" },
  ];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const y = listY + 1 + i;
    const isSelected = i === 2;

    // Selection bar
    if (isSelected) {
      for (let x = 1; x < listWidth - 1; x++) {
        term.putChar(y, listX + x, " ", { bg: "#00aaff" });
      }
    }

    // File icon and name
    const icon = file.type === "dir" ? "📁" : "📄";
    let textColor: string;
    if (isSelected) {
      textColor = "#ffffff";
    } else if (file.type === "dir") {
      textColor = "#00aaff";
    } else {
      textColor = "#cccccc";
    }

    term.putText(y, listX + 2, `${icon} ${file.name}`, {
      fg: textColor,
      bg: isSelected ? "#00aaff" : undefined,
      bold: file.type === "dir",
    });

    // Size (right-aligned)
    if (file.size !== "-") {
      term.putText(y, listX + listWidth - 8, file.size, {
        fg: isSelected ? "#ffffff" : "#666666",
        bg: isSelected ? "#00aaff" : undefined,
        dim: !isSelected,
      });
    }
  }
}

// Dialog box example
function drawDialog() {
  const dialogWidth = 50;
  const dialogHeight = 10;
  const dialogX = term.cols - dialogWidth - 5;
  const dialogY = 8;

  // Shadow
  for (let y = 1; y < dialogHeight; y++) {
    for (let x = 1; x < dialogWidth; x++) {
      if (dialogY + y < term.rows && dialogX + x < term.cols) {
        term.putChar(dialogY + y, dialogX + x, " ", { bg: "#111111" });
      }
    }
  }

  // Dialog background
  for (let y = 0; y < dialogHeight; y++) {
    for (let x = 0; x < dialogWidth; x++) {
      if (dialogY + y < term.rows && dialogX + x < term.cols) {
        term.putChar(dialogY + y, dialogX + x, " ", { bg: "#222222" });
      }
    }
  }

  // Border
  for (let x = 0; x < dialogWidth; x++) {
    term.putChar(dialogY, dialogX + x, "─", { fg: "#666666", bg: "#222222" });
    term.putChar(dialogY + dialogHeight - 1, dialogX + x, "─", {
      fg: "#666666",
      bg: "#222222",
    });
  }
  for (let y = 0; y < dialogHeight; y++) {
    term.putChar(dialogY + y, dialogX, "│", { fg: "#666666", bg: "#222222" });
    term.putChar(dialogY + y, dialogX + dialogWidth - 1, "│", {
      fg: "#666666",
      bg: "#222222",
    });
  }

  // Corners
  term.putChar(dialogY, dialogX, "┌", { fg: "#666666", bg: "#222222" });
  term.putChar(dialogY, dialogX + dialogWidth - 1, "┐", {
    fg: "#666666",
    bg: "#222222",
  });
  term.putChar(dialogY + dialogHeight - 1, dialogX, "└", {
    fg: "#666666",
    bg: "#222222",
  });
  term.putChar(dialogY + dialogHeight - 1, dialogX + dialogWidth - 1, "┘", {
    fg: "#666666",
    bg: "#222222",
  });

  // Title bar
  for (let x = 1; x < dialogWidth - 1; x++) {
    term.putChar(dialogY + 1, dialogX + x, " ", { bg: "#00aaff" });
  }
  term.putText(dialogY + 1, dialogX + 2, "⚠️  Confirmation", {
    fg: "#ffffff",
    bg: "#00aaff",
    bold: true,
  });

  // Message
  term.putText(dialogY + 3, dialogX + 2, "Are you sure you want to continue?", {
    fg: "#ffffff",
    bg: "#222222",
  });
  term.putText(dialogY + 4, dialogX + 2, "This action cannot be undone.", {
    fg: "#aaaaaa",
    bg: "#222222",
    dim: true,
  });

  // Buttons
  const buttonY = dialogY + dialogHeight - 3;
  const yesX = dialogX + dialogWidth - 20;
  const noX = dialogX + dialogWidth - 10;

  // Yes button (selected)
  for (let x = 0; x < 8; x++) {
    term.putChar(buttonY, yesX + x, " ", { bg: "#00ff00" });
  }
  term.putText(buttonY, yesX + 2, "Yes", {
    fg: "#000000",
    bg: "#00ff00",
    bold: true,
  });

  // No button
  for (let x = 0; x < 8; x++) {
    term.putChar(buttonY, noX + x, " ", { bg: "#666666" });
  }
  term.putText(buttonY, noX + 3, "No", {
    fg: "#ffffff",
    bg: "#666666",
  });
}

// Animation state
let frame = 0;
let menuOpen = -1;
let dropdownSelection = 0;

function draw() {
  // Clear screen
  for (let y = 1; y < term.rows - 1; y++) {
    for (let x = 0; x < term.cols; x++) {
      term.putChar(y, x, " ");
    }
  }

  // Animate menu selection
  const menuSelection = Math.floor(frame / 60) % menuItems.length;

  // Toggle dropdown every 2 seconds
  if (frame % 120 === 0) {
    menuOpen = menuOpen === menuSelection ? -1 : menuSelection;
    dropdownSelection = 0;
  }

  // Animate dropdown selection
  if (menuOpen >= 0 && frame % 20 === 0) {
    const submenu = menuItems[menuOpen].submenu;
    if (submenu) {
      dropdownSelection = (dropdownSelection + 1) % submenu.length;
    }
  }

  // Draw UI elements
  drawMenuBar(menuSelection);
  drawListView();
  drawDialog();

  if (menuOpen >= 0) {
    drawDropdown(menuOpen, dropdownSelection);
  }

  // Status bar
  for (let x = 0; x < term.cols; x++) {
    term.putChar(term.rows - 1, x, " ", { bg: "#111111" });
  }
  term.putText(
    term.rows - 1,
    2,
    "Menu Demo - Visual demonstration of UI components",
    {
      fg: "#aaaaaa",
      bg: "#111111",
      dim: true,
    }
  );
  term.putText(term.rows - 1, term.cols - 20, "Press Ctrl+C to exit", {
    fg: "#666666",
    bg: "#111111",
  });

  term.render();
  frame++;
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
