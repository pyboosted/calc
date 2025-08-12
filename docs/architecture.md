# Architecture

The calculator is built with a modular architecture:

## Core Components

- **Parser**: Tokenizer + AST parser for mathematical expressions
- **Evaluator**: Evaluates the AST with support for functions, units, and variables
- **Currency Manager**: Fetches and caches exchange rates from free API
- **UI Components**: React-based terminal UI using Ink
  - `Calculator`: Main component managing state
  - `Input`: Handles user input with syntax highlighting
  - `Display`: Shows results and errors
  - `HighlightedText`: Provides syntax highlighting

## Expression Processing Pipeline

1. **Tokenizer** (`src/parser/tokenizer.ts`): Converts raw input into tokens
2. **Parser** (`src/parser/parser.ts`): Builds Abstract Syntax Tree (AST) from tokens
3. **Evaluator** (`src/evaluator/evaluate.ts`): Executes AST to produce results

## UI Architecture (Ink/React)

The UI uses Ink (React for CLI) with a sophisticated state management system:

1. **State Management**:
   - **CalculatorStateManager** (`src/ui/calculator-state.ts`): The core UI state machine
   - **CalculatorEngine** (`src/ui/calculator-engine.ts`): Manages the logical state of the calculator's lines
   - **HotkeyManager** (`src/ui/hotkey-manager.ts`): Processes raw keyboard events

2. **React Components**:
   - **Calculator** (`src/ui/Calculator.tsx`): Main component
   - **InputWithResult** (`src/ui/InputWithResult.tsx`): Individual line component
   - **InputLine** (`src/ui/InputLine.tsx`): Text rendering with selection

## Key Systems

1. **Dimensional Analysis & Unit Conversion**
   - Full dimensional analysis with exponent tracking
   - Supports compound units (m/s, kg⋅m/s², etc.)
   - Handles all SI base units and many derived units

2. **Currency Manager**
   - Fetches live rates from exchangerate-api.com
   - Caches rates for 24 hours in `~/.config/calc/currencies.json`
   - Supports 300+ currencies

3. **Configuration**
   - YAML-based config at `~/.config/calc/config.yaml`
   - Currently supports precision setting (decimal places)

4. **Date/Time Operations**
   - Keywords: today, tomorrow, yesterday, now, weekdays
   - Arithmetic with units: days, weeks, months, years, hours, minutes, seconds
   - Uses date-fns for reliable date manipulation

## Type System

**CalculatedValue** is a discriminated union:
```typescript
type CalculatedValue = 
  | { type: 'number'; value: number }                    // Pure numbers only, no units
  | { type: 'percentage'; value: number }                // Special type for percentages
  | { type: 'quantity'; value: number; dimensions: DimensionMap }  // Numbers with dimensional analysis
  | { type: 'string'; value: string }
  | { type: 'date'; value: Date; timezone?: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: null }
  | { type: 'array'; value: CalculatedValue[] }
  | { type: 'object'; value: Map<string, CalculatedValue> }
  | { type: 'function'; value: FunctionInfo }            // User-defined functions
  | { type: 'lambda'; value: LambdaInfo };               // Lambda expressions
```

## Build System

The project uses tsup to compile TypeScript/JSX to JavaScript:
- Configuration in `tsup.config.ts`
- Creates optimized bundles in `dist/`
- Adds Node.js shebang to CLI entry point
- The `prepublishOnly` hook ensures builds before npm publish
