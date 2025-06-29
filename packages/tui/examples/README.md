# @boosted/tui Examples

This directory contains examples demonstrating various features of the @boosted/tui library.

## Running Examples

From the project root:

```bash
bun run packages/tui/examples/<example-name>.ts
```

## Available Examples

### Basic Usage
- `basic.ts` - Simple demo with borders and text
- `text-attributes.ts` - All text styling options
- `colors.ts` - 256-color and 24-bit color support

### Animation & Updates
- `animation.ts` - 60 FPS animations with synchronized updates
- `progress-bar.ts` - Various progress indicators and spinners

### Layout & UI
- `box-drawing.ts` - Unicode box drawing characters
- `layout.ts` - Complex dashboard layout
- `menu.ts` - Menu systems and dialogs (visual only)
- `charts.ts` - Simple data visualization

### Terminal Features
- `resize-test.ts` - Terminal resize handling demo
- `simple-resize.ts` - Minimal resize example
- `clear-test.ts` - Screen clearing demonstration

### Performance
- `benchmark.ts` - Performance testing and metrics

## Important Notes

### Resize Handling

When the terminal is resized:
1. The terminal automatically clears the screen
2. The diff engine is resized to match new dimensions
3. Your resize handler should redraw all content

Example pattern:
```typescript
term.on('resize', () => {
  // Just redraw - the terminal handles clearing
  drawUI();
});
```

### Clear vs Render

- `term.clear()` - Clears the diff engine buffers (content will be empty on next render)
- `term.render()` - Applies all changes to the terminal
- Always call `render()` after making changes

### Performance Tips

1. Use `syncUpdate: true` for animations to prevent tearing
2. Batch multiple operations before calling `render()`
3. The diff engine only updates changed cells
4. Avoid clearing and redrawing unchanged content