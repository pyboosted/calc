# @boosted/tui Implementation Plan

## Overview
This document outlines the phased implementation plan for @boosted/tui, a minimal terminal primitives library for Bun. Each phase builds upon the previous one, with clear deliverables and acceptance criteria.

---

## Phase 1: Core Terminal I/O & Basic Rendering
**Duration:** 2-3 weeks  
**Goal:** Establish the foundational terminal control and output system

### Description
Implement the basic Terminal class with raw mode control, buffered output, and the cell-based rendering system. This phase focuses on getting pixels on screen efficiently.

### Technical Requirements
- Bun-native implementation using `Bun.stdin`, `Bun.stdout`
- No Node.js compatibility layers or polyfills
- Direct ANSI escape sequence generation
- Cell representation as 32-bit packed integers

### Deliverables
- [ ] Terminal class with raw mode control
- [ ] Buffered output system with configurable highWaterMark
- [ ] Cell-based double buffer (prev/curr arrays)
- [ ] Basic diff algorithm (XOR comparison)
- [ ] ANSI attribute lookup table (ATTR_LUT)
- [ ] Resize handling (SIGWINCH)
- [ ] Cursor visibility control
- [ ] Basic text output with attributes

### Testing Checklist
- [ ] Terminal enters/exits raw mode cleanly
- [ ] Text appears at correct positions
- [ ] Attributes (bold, italic, colors) render correctly
- [ ] Resize events update dimensions
- [ ] Performance: <1ms for full screen update
- [ ] Memory usage stable (no leaks)
- [ ] Clean shutdown on Ctrl+C

### Example Usage
```ts
const term = Terminal.open();
term.write('\x1b[2J\x1b[H');  // Clear screen
term.write('\x1b[10;10HHello, World!');
term.flush();
term.close();
```

---

## Phase 2: Layer System & Diff Renderer
**Duration:** 2-3 weeks  
**Goal:** Implement the multi-layer rendering system with efficient diff tracking

### Description
Build the layer abstraction that allows overlapping UI elements. Implement the smart diff renderer that only updates changed cells.

### Technical Requirements
- Layer types: primary, sticky, absolute, relative
- Dirty cell tracking per layer
- Layer composition and z-ordering
- Coordinate transformation between layer types
- Single flush per frame

### Deliverables
- [ ] Base Layer class with cell buffer
- [ ] Primary layer (viewport-relative, scrollable)
- [ ] Sticky layers (anchored to edges)
- [ ] Absolute layers (terminal coordinates)
- [ ] Relative layers (cursor-attached)
- [ ] Layer manager (z-order, composition)
- [ ] Optimized diff/render loop
- [ ] Synchronized update protocol support

### Testing Checklist
- [ ] Layers render in correct z-order
- [ ] Sticky layers remain fixed during scroll
- [ ] Relative layers follow cursor
- [ ] Only dirty cells are redrawn
- [ ] No flicker during updates
- [ ] Synchronized update prevents tearing
- [ ] Layer bounds are respected

### Example Usage
```ts
const layers = new Layers(term);
const status = layers.create({
  type: "sticky",
  anchor: "bottom",
  height: 1
});
status.putText(0, 0, "Ready", { inverse: true });
layers.flush();
```

---

## Phase 3: Input System & Mouse Support
**Duration:** 2 weeks  
**Goal:** Implement comprehensive input decoding with mouse support

### Description
Create the input decoder that handles keyboard and mouse events. Support advanced protocols like SGR mouse and Kitty keyboard.

### Technical Requirements
- Raw stdin processing in Bun
- Escape sequence parsing state machine
- Modifier key support (Ctrl, Alt, Shift, Meta)
- SGR extended mouse protocol
- Drag event synthesis
- Event emitter pattern

### Deliverables
- [ ] InputDecoder class
- [ ] Keyboard event parsing
- [ ] Mouse event parsing (click, drag, wheel)
- [ ] Kitty keyboard protocol support
- [ ] SGR mouse protocol implementation
- [ ] Drag operation tracking
- [ ] Event batching for performance

### Testing Checklist
- [ ] All printable keys decoded correctly
- [ ] Special keys (arrows, function keys) work
- [ ] Modifier combinations detected
- [ ] Mouse clicks have correct coordinates
- [ ] Drag operations track properly
- [ ] Wheel events scroll as expected
- [ ] No input lag or dropped events

### Example Usage
```ts
const input = new InputDecoder({ mouse: true });
input.on("key", (e) => {
  if (e.ctrl && e.name === "c") process.exit();
});
input.on("mouse", (e) => {
  console.log(`Click at ${e.x},${e.y}`);
});
```

---

## Phase 4: ANSI Encoder & Theme System
**Duration:** 1-2 weeks  
**Goal:** Implement the styling system with semantic colors and OS theme detection

### Description
Build the ANSI encoder for generating escape sequences and the minimal theme system with OS integration.

### Technical Requirements
- Fluent API for building ANSI sequences
- 24-bit color support
- 256-color palette fallback
- OSC sequences for theme detection
- Semantic color roles

### Deliverables
- [ ] AnsiEncoder class with fluent API
- [ ] Color type system (hex, 256-palette)
- [ ] Style attributes (bold, dim, italic, etc.)
- [ ] Theme type definitions
- [ ] OS theme detection (dark/light)
- [ ] Theme change event support
- [ ] Pre-built theme examples

### Testing Checklist
- [ ] Colors render correctly (24-bit and 256)
- [ ] All attributes work (bold, dim, italic, etc.)
- [ ] Theme detection works on supported terminals
- [ ] Theme changes trigger events
- [ ] Semantic colors apply correctly
- [ ] Fallbacks work on limited terminals

### Example Usage
```ts
const theme = await detectSystemTheme(term);
const ansi = new AnsiEncoder(theme);
const error = ansi.colorize("Error!", "error");
```

---

## Phase 5: Capabilities Detection
**Duration:** 1 week  
**Goal:** Implement terminal capability detection with timeout support

### Description
Create the capability detection system that queries terminals for supported features with graceful timeout handling.

### Technical Requirements
- Query sequences for various capabilities
- Timeout mechanism (configurable, default 100ms)
- Response parsing
- Capability caching
- Fallback strategies

### Deliverables
- [ ] Capability detection functions
- [ ] Timeout handling system
- [ ] Query response parser
- [ ] Capability cache
- [ ] Terminal identification
- [ ] Feature flags interface

### Testing Checklist
- [ ] Detects Kitty graphics support
- [ ] Detects clipboard capabilities
- [ ] Identifies terminal program
- [ ] Timeouts work correctly
- [ ] Cache prevents repeated queries
- [ ] Unknown terminals handled gracefully

### Example Usage
```ts
const caps = await detectCapabilities(term, { timeout: 100 });
if (caps.kittyGraphics) {
  // Enable image support
}
```

---

## Phase 6: Graphics & Clipboard Support
**Duration:** 3 weeks  
**Goal:** Implement Kitty Graphics Protocol and advanced clipboard features

### Description
Add support for displaying images and advanced clipboard operations including file copying.

### Technical Requirements
- Kitty Graphics Protocol implementation
- PNG encoding/transmission
- Chunked transfer for large images
- OSC 52 clipboard support
- File clipboard support (iTerm2 style)
- Drag & drop protocol

### Deliverables
- [ ] KGP image display functions
- [ ] Chunked transmission system
- [ ] Image positioning and sizing
- [ ] Basic clipboard (OSC 52)
- [ ] File clipboard support
- [ ] Drag & drop implementation
- [ ] Image click handling

### Testing Checklist
- [ ] PNG images display correctly
- [ ] Transparency works
- [ ] Large images transmit properly
- [ ] Images position accurately
- [ ] Text clipboard works
- [ ] Image clipboard works (where supported)
- [ ] Drag & drop functions

### Example Usage
```ts
const img = await term.drawImage({
  data: pngBuffer,
  x: 10, y: 5,
  width: 20, height: 10
});
img.enableDragDrop('/tmp/chart.png');
```

---

## Phase 7: Advanced Features & Optimization
**Duration:** 2 weeks  
**Goal:** Implement scroll regions, performance optimizations, and remaining features

### Description
Add the final features including scroll region management for layers, performance tuning options, and memory optimizations.

### Technical Requirements
- Scroll region management for layers
- Performance profiling hooks
- Memory optimization strategies
- Custom diff strategies
- Viewport detection

### Deliverables
- [ ] Scroll region API for layers
- [ ] Scrollable layer implementation
- [ ] Performance tuning options
- [ ] Memory management features
- [ ] Viewport change detection
- [ ] Custom diff strategies
- [ ] Sparse layer support

### Testing Checklist
- [ ] Scroll regions work within layers
- [ ] Main scrollback preserved
- [ ] Performance options reduce overhead
- [ ] Memory usage scales with content
- [ ] Viewport detection accurate
- [ ] No scroll region leaks

### Example Usage
```ts
const popup = layers.create({
  type: "absolute",
  scrollable: true,
  sparse: true
});
popup.beginScroll();
popup.scroll(10);
popup.endScroll();
```

---

## Phase 8: Documentation & Examples
**Duration:** 1-2 weeks  
**Goal:** Create comprehensive documentation and example applications

### Description
Write detailed API documentation, create example applications, and prepare for release.

### Technical Requirements
- TypeScript definitions complete
- JSDoc comments
- API documentation
- Example applications
- Performance benchmarks

### Deliverables
- [ ] API reference documentation
- [ ] Getting started guide
- [ ] Example: Simple text editor
- [ ] Example: File browser
- [ ] Example: Dashboard with charts
- [ ] Performance benchmark suite
- [ ] Migration guide from other libraries

### Testing Checklist
- [ ] All APIs documented
- [ ] Examples run without errors
- [ ] TypeScript types are accurate
- [ ] Documentation is clear
- [ ] Benchmarks show expected performance

---

## Quality Gates

### Before Moving to Next Phase
- [ ] All deliverables completed
- [ ] All tests passing
- [ ] No memory leaks
- [ ] Performance targets met
- [ ] Code review completed
- [ ] Documentation updated

### Release Criteria
- [ ] All phases completed
- [ ] <10KB core bundle size
- [ ] <1ms render latency
- [ ] Works on major terminals (Kitty, iTerm2, WezTerm, Ghostty)
- [ ] Zero runtime dependencies
- [ ] 100% Bun-native code

---

## Risk Mitigation

### Technical Risks
1. **Terminal Compatibility**: Test on multiple terminals early
2. **Performance**: Profile continuously, not just at the end
3. **Memory Usage**: Monitor with large documents
4. **Input Edge Cases**: Fuzz test the input decoder

### Mitigation Strategies
- Maintain compatibility matrix
- Automated testing on multiple terminals
- Performance regression tests
- Memory profiling in CI
- Community beta testing

---

## Success Metrics
- Render performance: <1ms for typical updates
- Memory efficiency: O(visible cells) not O(document size)
- Bundle size: <10KB for core
- API simplicity: <10 min to first render
- Terminal support: 90%+ modern terminals