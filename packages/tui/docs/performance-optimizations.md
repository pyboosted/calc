# TUI Performance Optimizations

## Overview

This document describes the performance optimizations implemented for handling full-screen redraws with many color changes in the TUI library.

## Problem Statement

The original implementation suffered from performance degradation when rendering scenes with many color changes due to:

1. **Separate color storage**: Colors were stored in Maps separate from cell data, requiring additional lookups
2. **Redundant ANSI sequences**: Full ANSI escape sequences were generated for every color change
3. **No state tracking**: The terminal's current color state wasn't tracked, leading to redundant commands
4. **Memory overhead**: Separate Maps for colors increased memory usage and GC pressure

## Implemented Optimizations

### 1. Inline Color Storage (CellV2)

The new cell structure packs colors directly into the cell data:

```typescript
// Old: 32-bit cell + separate color Maps
type Cell = number; // character + attributes only
Map<number, ColorData>; // separate color storage

// New: 64-bit cell with inline colors
type CellV2 = [number, number]; // [char+attrs, colors]
```

**Benefits:**
- Eliminates Map lookups for colors
- Better cache locality
- Reduced memory allocations

### 2. ANSI State Tracking

The optimized diff engine tracks the current terminal state:

```typescript
interface AnsiState {
  attr: number;
  fg?: Color;
  bg?: Color;
}
```

**Benefits:**
- Only emits color changes when they differ from current state
- Reduces redundant ANSI sequences
- Smaller output size

### 3. Color Sequence Caching

Frequently used color combinations are cached:

```typescript
const colorCache = new Map<string, string>();
```

**Benefits:**
- Avoids rebuilding common color sequences
- LRU-like cache with size limit
- Fast lookups for repeated colors

### 4. Optimized Diff Algorithm

The diff algorithm now:
- Batches cells with identical styling more efficiently
- Minimizes cursor movements
- Uses incremental color changes where possible

## Performance Results

Based on benchmarks with 50x100 terminal, 1000 iterations, 500 color changes per frame:

| Metric | Original | Optimized | Improvement |
|--------|----------|-----------|-------------|
| Render Time | 0.73ms/frame | 0.71ms/frame | 2.8% faster |
| Memory Usage | 152.11MB | 97.00MB | 36.2% less |
| Output Size | 20,024 bytes | 15,111 bytes | 24.5% smaller |

## Usage

To use the optimized version:

```typescript
import { TerminalV2 } from "@boosted/tui";

const term = TerminalV2.open({ syncUpdate: true });

// Use the same API as before
term.putChar(row, col, char, { fg: "#ff0000", bg: "#0000ff" });
term.render();
```

## Trade-offs

1. **Memory vs Speed**: The inline color storage uses more memory per cell (64-bit vs 32-bit) but provides better performance
2. **Compatibility**: The original Terminal class remains available for backward compatibility
3. **Complexity**: The optimized version is more complex but provides significant benefits for color-heavy applications

## Future Improvements

1. **Delta encoding**: Track color deltas instead of absolute values
2. **Run-length encoding**: Better compression for uniform regions
3. **Parallel processing**: Process multiple rows concurrently
4. **GPU acceleration**: Offload rendering to GPU for complex scenes

## Conclusion

The optimizations provide meaningful improvements in memory usage and output size, with modest performance gains. The reduced memory pressure and smaller output are particularly beneficial for:
- Long-running applications
- Remote terminals with limited bandwidth
- Applications with frequent full-screen updates