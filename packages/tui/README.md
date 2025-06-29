# @boosted/tui

Minimal terminal primitives for Bun - a thin, focused library providing essential terminal I/O primitives and a diff-based renderer.

## Features

- 🚀 **Bun-native**: Direct use of Bun APIs, no Node.js compatibility layer
- 📦 **Zero dependencies**: Lightweight and fast
- 🎯 **Cell-based rendering**: Efficient diff-based updates
- 🎨 **Full color support**: 24-bit true color and 256-color palette
- ⚡ **High performance**: Sub-millisecond render times
- 🔧 **Low-level primitives**: Build your own abstractions

## Installation

```bash
bun add @boosted/tui
```

## Quick Start

```typescript
import { Terminal } from '@boosted/tui';

const term = Terminal.open();

// Basic text rendering
term.putText(0, 0, 'Hello, World!', { bold: true, fg: '#00ff00' });

// Draw a box
for (let i = 0; i < term.cols; i++) {
  term.putChar(0, i, '─');
  term.putChar(term.rows - 1, i, '─');
}

// Render all changes
term.render();

// Clean up
term.close();
```

## Examples

The `examples/` directory contains various demos showcasing the library's capabilities:

### Basic Examples

```bash
# Basic terminal operations and borders
bun run packages/tui/examples/basic.ts

# Text attributes and styling
bun run packages/tui/examples/text-attributes.ts

# Color palettes (256 & 24-bit)
bun run packages/tui/examples/colors.ts
```

### Advanced Examples

```bash
# Animated content with 60 FPS updates
bun run packages/tui/examples/animation.ts

# Box drawing and table layouts
bun run packages/tui/examples/box-drawing.ts

# Progress bars and activity indicators
bun run packages/tui/examples/progress-bar.ts

# Charts and data visualization
bun run packages/tui/examples/charts.ts

# Complex dashboard layout
bun run packages/tui/examples/layout.ts

# Interactive menu UI components
bun run packages/tui/examples/menu.ts

# Performance benchmarking
bun run packages/tui/examples/benchmark.ts
```

### What the Examples Demonstrate

- **basic.ts**: Terminal setup, border drawing, text positioning, resize handling
- **text-attributes.ts**: All text styling options (bold, italic, underline, colors)
- **colors.ts**: 256-color palette, 24-bit true color, gradients
- **animation.ts**: High-performance rendering, synchronized updates, smooth animations
- **box-drawing.ts**: Unicode box characters, table layouts, nested panels
- **progress-bar.ts**: Different progress bar styles, spinners, activity indicators
- **charts.ts**: Bar charts, line charts, simple data visualization
- **layout.ts**: Dashboard layout, panels, responsive design patterns
- **menu.ts**: Dropdown menus, lists, dialogs, UI component patterns
- **benchmark.ts**: Performance metrics, render times, throughput analysis

## API Overview

### Terminal Class

```typescript
const term = Terminal.open(options?: {
  highWaterMark?: number;  // Output buffer size (default: 64KB)
  syncUpdate?: boolean;    // Enable synchronized updates
});

// Dimensions
term.rows // Terminal height
term.cols // Terminal width

// Basic operations
term.clear()
term.render()
term.flush()
term.close()

// Cursor control
term.hideCursor()
term.showCursor()
term.moveTo(row, col)

// Cell operations
term.putChar(row, col, char, attrs?)
term.putText(row, col, text, attrs?)

// Events
term.on('resize', (dims) => {
  console.log(`Resized to ${dims.cols}x${dims.rows}`);
});
```

### Attributes

```typescript
interface Attributes {
  // Text styling
  bold?: boolean;
  italic?: boolean;
  dim?: boolean;
  underline?: boolean;
  reverse?: boolean;
  strikethrough?: boolean;
  
  // Colors (24-bit hex or 256-color index)
  fg?: Color;  // '#rrggbb' or 0-255
  bg?: Color;
}
```

## Architecture

The library uses a double-buffering approach with XOR-based diff computation:

1. **Cell Representation**: Each cell is packed into a 32-bit integer containing character and attributes
2. **Diff Engine**: Only changed cells are rendered, minimizing terminal updates
3. **Output Buffer**: Batched writes with configurable buffer size
4. **ANSI Generation**: Pre-computed lookup tables for common attribute combinations

## License

MIT