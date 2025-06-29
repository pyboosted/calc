# @boosted/tui • v0.2 — Minimal Terminal Primitives

> **Philosophy**: A thin, focused library providing just the essential terminal I/O primitives and a diff-based renderer. No widgets, no parsing, no business logic.

---

## 🎯 Design Principles

1. **Small & Fast**: Zero dependencies, <10KB core, sub-millisecond operations
2. **Bun-Native**: Direct use of Bun APIs (no Node.js compatibility layer)
3. **Low-Level**: Terminal plumbing only - apps build their own abstractions
4. **Non-Invasive**: No alternate screen, preserves scrollback, minimal state

---

## 📦 Package Structure

Single npm package with multiple exports:

```
@boosted/tui              # Core terminal I/O and layer system
@boosted/tui/capabilities # Terminal feature detection (optional)
@boosted/tui/input        # Key/mouse decoder (optional)
@boosted/tui/theme        # Minimal theme system with OS detection (optional)
@boosted/tui/ansi         # ANSI escape sequence encoder (optional)
```

---

## 🔧 Core API Overview

### Terminal Class
```ts
// Minimal terminal control
const term = Terminal.open(opts?: {
  highWaterMark?: number;           // Output buffer size (default: 64KB)
  syncUpdate?: boolean;             // Auto-wrap in synchronized update
});
term.write(data: string);           // Buffered output
term.flush();                       // Force flush
term.cols / term.rows;              // Dimensions
term.on("resize", handler);         // SIGWINCH events
term.setScrollRegion(top: number, bottom: number);  // Define scroll region
term.resetScrollRegion();           // Reset to full screen
term.close();                       // Cleanup
```

### Layer System
```ts
// Diff-based rendering with overlays
const layers = new Layers(term);

// Primary scrollable content
layers.primary.putText(row, col, text, attrs?);
layers.primary.clear();

// Create overlays
const statusBar = layers.create({
  type: "sticky",
  anchor: "bottom", 
  height: 1
});

// Batch render all dirty layers
layers.flush();
```

### Raw Input Stream
```ts
// Optional module for decoding stdin
import { InputDecoder } from "@boosted/tui/input";

const decoder = new InputDecoder({
  mouse: true,              // Enable mouse tracking
  mouseProtocol: 'sgr',     // SGR extended protocol
  kittyKeyboard: true       // Enhanced keyboard protocol
});

decoder.on("key", (key) => {
  // { name: "a", ctrl: false, alt: false, shift: false, meta: false }
});

decoder.on("mouse", (event) => {
  // Click/drag/wheel events
  // { 
  //   type: "click" | "drag" | "wheel" | "release",
  //   x: 10, 
  //   y: 5, 
  //   button: 1 | 2 | 3,
  //   modifiers: { ctrl: false, alt: false, shift: false }
  // }
});

// Advanced: Track drag operations
decoder.on("drag-start", (e) => { /* Initial click */ });
decoder.on("drag-move", (e) => { /* Mouse moved while pressed */ });
decoder.on("drag-end", (e) => { /* Mouse released */ });
```

---

## 📐 Layer Types

| Type | Purpose | Positioning |
|------|---------|-------------|
| `primary` | Main scrollable content | Viewport-relative |
| `sticky` | Fixed UI elements | Anchored to edges |
| `absolute` | Floating overlays | Terminal coordinates |
| `relative` | Cursor-attached popups | Follows primary scroll |

---

## 🚀 Implementation Details

### Output Buffering
- All writes go through a ring buffer
- Single `stdout.write()` per frame
- Automatic coalescing of redundant sequences

### Diff Algorithm
- XOR-based cell comparison
- Skip unchanged regions
- Minimize cursor movement
- Single string concatenation per frame
- Pre-cached attribute strings

### Coordinate Systems
- **Terminal**: Absolute screen cells (1-based)
- **Layer**: Local to layer bounds (0-based)
- **File**: Logical content rows (0-based)

### Memory Model
- Layers store only dirty cells
- Full redraw on resize
- No persistent screen buffer

---

## 🔌 Optional Extensions

### Capability Detection (`@boosted/tui/capabilities`)
```ts
const caps = await detectCapabilities(term, {
  timeout: 100,     // Max 100ms wait for terminal response
  cache: true       // Cache results for this session
});

// Returns detailed capability information
// { 
//   kittyGraphics: boolean,
//   osc52Clipboard: boolean,
//   osc52FileFormat: boolean,    // iTerm2-style file clipboard
//   sgrMouse: boolean,
//   syncUpdate: boolean,
//   sixelGraphics: boolean,
//   dragDrop: boolean,           // Kitty drag protocol
//   terminalName: string,        // TERM_PROGRAM if available
//   version: string              // Terminal version if detected
// }

// Specific capability queries
const hasImages = await term.queryCapability('kittyGraphics', { timeout: 50 });
```

### Theme System (`@boosted/tui/theme`)
```ts
import { Theme, Style, ColorRole } from "@boosted/tui/theme";
import { AnsiEncoder } from "@boosted/tui/ansi";

// Semantic color roles
type ColorRole = 'primary' | 'secondary' | 'accent' | 'error' | 'warning' | 'success' | 'background';

// Auto-detect system theme
const theme = await detectSystemTheme(term); // light/dark
term.on("theme-change", (theme) => {
  // React to OS theme changes (Ghostty, iTerm2)
});

// Use semantic colors
const encoder = new AnsiEncoder(theme);
const text = encoder.colorize("Error!", "error");
```

### ANSI Encoder (`@boosted/tui/ansi`)
```ts
// Lightweight ANSI escape sequence builder
const ansi = new AnsiEncoder();
ansi.fg("#ff0000");      // 24-bit color
ansi.bg(128);             // 256-color palette
ansi.bold().underline();  // Attributes
ansi.reset();             // SGR 0
```

### Graphics Support (`@boosted/tui/graphics`)

#### Kitty Graphics Protocol (KGP)
```ts
// Display PNG images with full KGP support
const img = await term.drawImage({
  row: 5,
  col: 10,
  data: pngBuffer,
  width: 20,        // cells
  height: 10,       // cells
  preserveAspect: true,
  transparency: true,
  id: 'chart-1'     // for later manipulation
});

// Chunked transmission for large images
img.transmit({ chunkSize: 4096 });

// Make image draggable
img.enableDragDrop('/tmp/chart.png');

// Remove image
img.clear();
```

#### Clipboard Integration
```ts
// Basic text clipboard
term.copyToClipboard('Hello, world!');

// Advanced: Copy image as file (iTerm2/Kitty)
term.copyImageAsFile({
  data: pngBuffer,
  filename: 'chart.png',
  fallbackText: 'Chart data...'
});

// OSC 52 with proper base64 encoding
term.copyToClipboard(data, { 
  maxSize: 100_000,  // Limit for tmux compatibility
  selection: 'clipboard'  // or 'primary'
});
```

#### Drag & Drop Protocol
```ts
// Enable drag-and-drop for images
const draggable = term.createDraggable({
  path: '/tmp/chart.png',
  mimeType: 'image/png',
  preview: thumbnailBuffer
});
```

---

## 🎭 What This Library Does NOT Include

- ❌ Widget system (buttons, menus, forms)
- ❌ Layout managers or flexbox
- ❌ Text parsing or syntax highlighting
- ❌ Line wrapping or text reflow
- ❌ Scrollbar rendering
- ❌ Focus management
- ❌ Full theme system (but minimal semantic colors are provided)
- ❌ Built-in keybindings

These are left to the application layer to implement as needed.

---

## 📝 Usage Example

```ts
import { Terminal, Layers } from "@boosted/tui";
import { InputDecoder } from "@boosted/tui/input";

// Setup
const term = Terminal.open();
const layers = new Layers(term);
const input = new InputDecoder();

// Status bar
const status = layers.create({
  type: "sticky",
  anchor: "bottom",
  height: 1
});

// Main loop
let row = 0;
input.on("key", (key) => {
  if (key.name === "q") process.exit(0);
  
  // Update primary content
  layers.primary.putText(row++, 0, `Pressed: ${key.name}`);
  
  // Update status
  status.clear();
  status.putText(0, 0, `Row: ${row}`, { inverse: true });
  
  // Render
  layers.flush();
});
```

---

## 🏗️ Advanced: Custom Layer Types

```ts
// Extend base Layer class for specialized behavior
class ScrollbarLayer extends Layer {
  updateFromViewport(viewport: Viewport) {
    const ratio = viewport.visible / viewport.total;
    const height = Math.max(1, Math.floor(this.height * ratio));
    const offset = Math.floor((this.height - height) * viewport.offset);
    
    this.clear();
    for (let i = 0; i < height; i++) {
      this.putChar(offset + i, 0, "█");
    }
  }
}
```

---

## 🖥️ Rendering Implementation

### Cell Representation
```ts
// 32-bit packed cell: [8-bit attr | 21-bit codepoint | 3-bit reserved]
type Cell = number;

// Attribute byte encodes style (pre-compute SGR sequences)
const ATTR_LUT: string[] = [
  '\x1b[0m',        // 0: reset
  '\x1b[1m',        // 1: bold
  '\x1b[2m',        // 2: dim
  '\x1b[3m',        // 3: italic
  '\x1b[1;3m',      // 4: bold+italic
  '\x1b[2;3m',      // 5: dim+italic
  '\x1b[7m',        // 6: reverse
  // ... up to 256 combinations
];
```

### Diff & Render Loop
```ts
function render() {
  let out = ESC_HIDE_CURSOR;

  for (let row = 0; row < rows; row++) {
    if (!dirty[row]) continue;

    const off = row * cols;
    
    // Quick XOR check for row changes
    let changed = false;
    for (let col = 0; col < cols; col++) {
      if (prev[off+col] !== curr[off+col]) { 
        changed = true; 
        break; 
      }
    }
    if (!changed) { 
      dirty[row] = 0; 
      continue; 
    }

    // Position cursor at row start
    out += `\x1b[${row+1};1H`;
    let lastAttr = -1;

    // Render only changed cells
    for (let col = 0; col < cols; col++) {
      const val = curr[off+col];
      if (val === prev[off+col]) continue;
      
      prev[off+col] = val;  // Update snapshot

      const attr = val >>> 24;
      if (attr !== lastAttr) {
        out += ATTR_LUT[attr];
        lastAttr = attr;
      }
      
      out += String.fromCodePoint(val & 0x1FFFFF);
    }
    
    out += '\x1b[0m';  // Reset to avoid attribute bleed
    dirty[row] = 0;
  }

  out += ESC_SHOW_CURSOR;

  // Wrap in synchronized update if enabled
  if (term.options.syncUpdate) {
    out = '\x1b[?2026h' + out + '\x1b[?2026l';
  }

  // Bun-optimized output
  const writer = Bun.stdout.writer({ highWaterMark: term.options.highWaterMark });
  writer.write(out);
  writer.flush();
}
```

### Performance Characteristics
- **Memory**: 2 × (rows × cols × 4 bytes) for double buffering
- **CPU**: O(dirty_cells) per frame
- **I/O**: Single syscall per frame via Bun's buffered writer

---

## 📜 Smart Rendering & Sticky Layers

The library preserves terminal scrollback by never using scroll regions or alternate screen. Instead, sticky layers are maintained through intelligent rendering:

### How Sticky Layers Work
```ts
// Create a sticky footer that stays at bottom
const status = layers.create({
  type: "sticky",
  anchor: "bottom",
  height: 1
});

// During render, the library:
// 1. Detects terminal viewport bounds
// 2. Positions sticky layers relative to current view
// 3. Redraws only when terminal scrolls or resizes

// The footer appears fixed but doesn't lock scrolling
status.putText(0, 0, "Status: Ready");
layers.flush();
```

### Scrollback Preservation
```ts
// Content naturally scrolls into terminal history
layers.primary.putText(row++, 0, "Line of output");

// When content scrolls past top of screen:
// - It enters the terminal's scrollback buffer
// - User can scroll up to see history
// - Sticky layers redraw at correct positions

// Detect when app is partially scrolled off screen
term.on('viewport-change', (visible) => {
  if (visible.top > 0) {
    // App is partially scrolled up
    // Can dim output or pause updates
  }
});
```

### Implementation Strategy
- No scroll regions (`CSI r`) - preserves scrollback
- No alternate screen - keeps terminal history
- Sticky layers use absolute positioning
- Smart dirty tracking avoids unnecessary redraws
- Viewport detection ensures correct positioning

---

## 📊 Scroll Regions for Layers

While the main app preserves scrollback, scroll regions are useful for scrollable content within layers:

### Use Cases
```ts
// Scrollable list within a popup
const fileList = layers.create({
  type: "absolute",
  x: 10, y: 5,
  width: 40, height: 20,
  scrollable: true    // Enable internal scrolling
});

// The layer manages its own scroll region
fileList.setContent(longListOfFiles);
fileList.scroll(5);   // Scroll down 5 lines within the layer

// Log viewer with fixed header
const logViewer = layers.create({
  type: "absolute",
  x: 0, y: 0,
  width: term.cols,
  height: term.rows - 1,
  scrollable: true,
  headerRows: 2      // Keep top 2 rows fixed
});
```

### Layer-Specific Scroll Regions
```ts
// When a scrollable layer is active:
layer.beginScroll();  // Sets scroll region to layer bounds
// ... perform scrolling operations ...
layer.endScroll();    // Restores previous region

// Manual control for advanced use
term.setScrollRegion(layer.y + 1, layer.y + layer.height);
```

### Important Notes
- Scroll regions are temporary and scoped to specific operations
- Main content never uses scroll regions (preserves scrollback)
- Only used within bounded areas like popups or panels
- Always restore after use to prevent breaking scrollback

---

## 🎨 Theme System Details

The minimal theme system provides:

### Color Types
```ts
// A color can be a full hex (#RRGGBB) or an ANSI 256 index
type Color = `#${string}` | number;

// Semantic color roles for consistency
type ColorRole = 
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'error'
  | 'warning'
  | 'success'
  | 'background';

// Complete style definition
interface Style {
  fg?: Color;
  bg?: Color;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  dim?: boolean;         // SGR 2 - reduced intensity
  reverse?: boolean;     // SGR 7 - swap fg/bg
  strikethrough?: boolean;
}

// A theme maps roles to styles
type Theme = Record<ColorRole, Style>;
```

### System Theme Detection
```ts
// Detect OS theme via OSC 11/12 queries (Ghostty, iTerm2)
const isDark = await detectDarkMode(term);

// Subscribe to theme changes
term.on('theme-change', (isDark: boolean) => {
  // Update your theme accordingly
});
```

### ANSI Encoder
```ts
// Built-in ANSI encoder (replaces chalk)
class AnsiEncoder {
  constructor(theme?: Theme);
  
  // Low-level ANSI building
  fg(color: Color): this;
  bg(color: Color): this;
  bold(): this;
  dim(): this;
  italic(): this;
  underline(): this;
  reverse(): this;
  strikethrough(): this;
  reset(): this;
  
  // High-level semantic coloring
  colorize(text: string, role: ColorRole): string;
}
```

---

## ⚡ Performance Tuning

### Output Buffer Configuration
```ts
// Tune buffer size based on terminal size and update frequency
const term = Terminal.open({
  highWaterMark: 128 * 1024,  // Larger buffer for high-res terminals
  flushInterval: 16,          // Auto-flush every 16ms (60fps)
  coalesceDuplicates: true    // Remove redundant sequences
});

// Manual control for critical sections
term.beginBatch();    // Start buffering without auto-flush
// ... many updates ...
term.endBatch();      // Flush everything at once
```

### Render Optimizations
```ts
// Skip unchanged cells with custom comparison
layers.setDiffStrategy({
  cellEquals: (a, b) => (a & 0xFFFFFF00) === (b & 0xFFFFFF00), // Ignore lower bits
  skipInvisible: true,      // Don't render cells outside viewport
  mergeSpaces: true         // Coalesce runs of spaces
});

// Adaptive sync updates based on terminal
if (caps.syncUpdate && updateSize > 1000) {
  term.options.syncUpdate = true;  // Enable for large updates
}
```

### Memory Management
```ts
// Configure layer memory usage
const layer = layers.create({
  type: "primary",
  sparse: true,           // Only allocate modified cells
  maxHistory: 1000,       // Limit undo buffer
  compression: 'rle'      // Run-length encode sparse data
});

// Release resources when done
layer.dispose();
```

---

## 🔮 Future Considerations

- **Web Assembly**: Core diff engine in WASM for performance
- **Shared Memory**: Zero-copy rendering with SharedArrayBuffer
- **Compression**: Run-length encoding for sparse updates
- **Recording**: Built-in session recording/playback

---

## 📚 Prior Art & Inspiration

- **notcurses**: Cell-based rendering model
- **termwiz**: Layer abstraction
- **crossterm**: Raw mode handling
- **Ink**: React-style composition (but we stay imperative)