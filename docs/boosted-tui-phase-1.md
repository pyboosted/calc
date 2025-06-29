# Phase 1 Implementation Plan: Core Terminal I/O & Basic Rendering

## 1. Setup Bun Workspace Package

### Create Package Structure
```
packages/
└── tui/
    ├── package.json
    ├── tsconfig.json
    ├── biome.jsonc
    ├── src/
    │   ├── index.ts         # Main exports
    │   ├── terminal.ts      # Terminal class
    │   ├── buffer.ts        # Output buffering
    │   ├── cell.ts          # Cell representation
    │   ├── diff.ts          # Diff algorithm
    │   ├── ansi.ts          # ANSI utilities
    │   └── types.ts         # Type definitions
    └── tests/
        ├── terminal.test.ts
        ├── buffer.test.ts
        ├── cell.test.ts
        └── diff.test.ts
```

### Update Root package.json
- Add `"workspaces": ["packages/*"]` to enable Bun workspaces
- Update scripts to include tui package commands

### Create packages/tui/package.json
```json
{
  "name": "@boosted/tui",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/bun": "latest"
  },
  "engines": {
    "bun": ">=1.0.0"
  }
}
```

## 2. Core Implementation Files

### types.ts - Type Definitions
```typescript
// 32-bit packed cell representation
export type Cell = number;

// Terminal dimensions
export interface Dimensions {
  rows: number;
  cols: number;
}

// Style attributes
export interface Attributes {
  bold?: boolean;
  italic?: boolean;
  dim?: boolean;
  underline?: boolean;
  reverse?: boolean;
  strikethrough?: boolean;
  fg?: Color;
  bg?: Color;
}

// Color representation
export type Color = `#${string}` | number; // hex or 256-color

// Terminal options
export interface TerminalOptions {
  highWaterMark?: number;  // Buffer size (default: 64KB)
  syncUpdate?: boolean;    // Synchronized updates
}
```

### cell.ts - Cell Manipulation
```typescript
// Cell packing/unpacking utilities
// 32-bit layout: [8-bit attr | 21-bit codepoint | 3-bit reserved]

export function packCell(char: string, attr: number): Cell
export function unpackChar(cell: Cell): string
export function unpackAttr(cell: Cell): number
export function cellEquals(a: Cell, b: Cell): boolean
```

### buffer.ts - Output Buffering
```typescript
// Buffered writer with Bun.stdout
export class OutputBuffer {
  constructor(highWaterMark: number)
  write(data: string): void
  flush(): void
  reset(): void
}
```

### ansi.ts - ANSI Utilities
```typescript
// Pre-computed attribute lookup table
export const ATTR_LUT: string[] = generateAttrLUT();

// ANSI escape sequences
export const ESC_HIDE_CURSOR = '\x1b[?25l';
export const ESC_SHOW_CURSOR = '\x1b[?25h';
export const ESC_CLEAR_SCREEN = '\x1b[2J';
export const ESC_HOME = '\x1b[H';

// Cursor positioning
export function moveTo(row: number, col: number): string
```

### diff.ts - Diff Algorithm
```typescript
// XOR-based diff with dirty tracking
export class DiffEngine {
  constructor(rows: number, cols: number)
  
  // Double buffers
  private prev: Uint32Array;
  private curr: Uint32Array;
  private dirty: Uint8Array;
  
  // Core diff operations
  markDirty(row: number): void
  isDirty(row: number): boolean
  computeDiff(): string  // Returns ANSI sequences
  swap(): void           // Swap buffers
}
```

### terminal.ts - Terminal Class
```typescript
export class Terminal extends EventEmitter {
  private constructor(options: TerminalOptions)
  
  // Factory method
  static open(options?: TerminalOptions): Terminal
  
  // Properties
  readonly rows: number;
  readonly cols: number;
  
  // Core methods
  write(data: string): void
  flush(): void
  
  // Cursor control
  hideCursor(): void
  showCursor(): void
  moveTo(row: number, col: number): void
  
  // Cell operations
  putChar(row: number, col: number, char: string, attr?: Attributes): void
  putText(row: number, col: number, text: string, attr?: Attributes): void
  clear(): void
  
  // Lifecycle
  close(): void
  
  // Events
  on(event: 'resize', handler: (dims: Dimensions) => void): this
  
  // Internal
  private enableRawMode(): void
  private disableRawMode(): void
  private handleResize(): void
  private setupSignalHandlers(): void
}
```

## 3. Implementation Details

### Raw Mode Setup
- Use Bun's `Bun.stdin.setRawMode(true)` 
- Save/restore terminal state
- Handle SIGWINCH for resize
- Clean shutdown on SIGINT/SIGTERM

### Double Buffering Strategy
- Maintain prev/curr cell arrays
- XOR comparison for change detection
- Dirty row tracking to skip unchanged lines
- Single string concatenation per frame

### ANSI Attribute Lookup Table
- Pre-compute all 256 attribute combinations
- Map attribute byte to SGR sequence
- Avoid runtime string concatenation

### Performance Targets
- <1ms for full screen update (80x24)
- <5ms for 4K terminal (400x150)
- Zero allocations in hot path

## 4. Testing Strategy

### Unit Tests
- Cell packing/unpacking correctness
- Buffer flushing behavior
- Diff algorithm accuracy
- ANSI sequence generation

### Integration Tests
- Terminal lifecycle (open/close)
- Resize handling
- Text rendering with attributes
- Performance benchmarks

### Manual Testing
- Test on multiple terminals (Kitty, iTerm2, WezTerm, Ghostty)
- Verify attribute rendering
- Check for flicker/tearing
- Memory leak detection

## 5. Deliverables Checklist

- [ ] Terminal class with raw mode control
- [ ] Buffered output system with configurable highWaterMark
- [ ] Cell-based double buffer (prev/curr arrays)
- [ ] Basic diff algorithm (XOR comparison)
- [ ] ANSI attribute lookup table (ATTR_LUT)
- [ ] Resize handling (SIGWINCH)
- [ ] Cursor visibility control
- [ ] Basic text output with attributes

## 6. Next Steps After Approval

1. Create the packages/tui directory structure
2. Set up package.json and tsconfig.json
3. Implement core types and cell representation
4. Build Terminal class with raw mode handling
5. Implement output buffering system
6. Create diff engine with dirty tracking
7. Add ANSI utilities and attribute handling
8. Write comprehensive tests
9. Test on multiple terminals
10. Document API and usage examples