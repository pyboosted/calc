# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Boosted Calculator is a powerful terminal-based calculator built with TypeScript and Ink (React for CLI). It features advanced mathematical operations, unit conversions, live currency conversion, and a sophisticated expression parser. The project uses Bun as the package manager and development runtime, but is distributed as a standard Node.js package.

## Development Commands

### Essential Commands
```bash
# Install dependencies
bun install

# Build for distribution (creates dist/ folder)
bun run build

# Run the calculator (interactive mode)
bun start
# or globally after installation
calc

# Non-interactive mode (evaluate expression)
calc "2 + 2"
calc "today + 5 days"

# Load from file
calc --file=budget.calc
calc -f calculations.txt

# Development with hot reload
bun dev

# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Update currency exchange rates
bun run update-currencies
# or with global installation
calc --update

# Type checking
bun run typecheck
# or
bun tsc --noEmit

# Linting and formatting
bun run lint        # Auto-fix linting issues
bun run format      # Format code
bun run check       # Run all checks (lint + format)

# Install globally
npm i -g .

# Publishing workflow
bun run typecheck && bun run lint && npm version patch && git push && npm publish
```

### Workflow Guidelines

**Before pushing code:**
1. Always run `bun run typecheck` to ensure no TypeScript errors
2. Always run `bun run lint` to fix linting issues
3. Always run `bun run format` to ensure consistent code style

**Before publishing to npm:**
1. Always run `bun run build` to ensure the dist/ folder is up to date
2. The `prepublishOnly` hook will automatically build, but manual verification is recommended

**Before committing:**
- Always ask for confirmation on the commit message before running `git commit`
- Show the proposed commit message and wait for approval
- This ensures commit messages are clear and follow project conventions

### Running Specific Tests
```bash
# Run a specific test file
bun test tests/evaluator.test.ts

# Run tests matching a pattern
bun test --name-pattern "percentage"
```

## Code Architecture

### Expression Processing Pipeline

1. **Tokenizer** (`src/parser/tokenizer.ts`): Converts raw input into tokens
   - Handles numbers, operators, units, functions, variables, keywords
   - Recognizes multi-character operators and currency symbols
   - Maintains position information for each token

2. **Parser** (`src/parser/parser.ts`): Builds Abstract Syntax Tree (AST) from tokens
   - Recursive descent parser with proper operator precedence
   - Special handling for percentage operations in context (e.g., `100 - 10%` → `100 - (100 * 10/100)`)
   - Converts unit syntax (`100 cm`) into binary operations
   - Handles "X% of Y" syntax separately from regular percentages

3. **Evaluator** (`src/evaluator/evaluate.ts`): Executes AST to produce results
   - Maintains variable state across evaluations
   - Handles unit conversions through `convertUnits`
   - Integrates with date/time operations via `date-manager`
   - Returns `CalculatedValue` objects with value and optional unit

### UI Architecture (Ink/React)

The UI uses Ink (React for CLI) with a sophisticated state management system:

1. **State Management**:
   - **CalculatorStateManager** (`src/ui/calculator-state.ts`): EventEmitter-based state manager
     - Manages lines, cursor position, text selection, copy highlighting
     - Handles all keyboard input and navigation logic
     - Emits 'stateChanged' events for React synchronization
   - **CalculatorEngine** (`src/ui/calculator-engine.ts`): Manages line data and evaluation
     - Maintains LineState objects with results and variable assignments
     - Handles line evaluation and re-evaluation on variable changes
   - **HotkeyManager** (`src/ui/hotkey-manager.ts`): Keyboard event processing
     - Maps keyboard inputs to state manager methods
     - Supports advanced text editing operations

2. **React Components**:
   - **Calculator** (`src/ui/Calculator.tsx`): Main component
     - Creates and manages CalculatorStateManager instance
     - Mirrors state manager's state in React for rendering
     - Handles exit keys (Esc and Ctrl+C)
   - **InputWithResult** (`src/ui/InputWithResult.tsx`): Individual line component
     - Renders input with syntax highlighting
     - Shows results or errors aligned to the right
     - Displays variable assignments
   - **InputLine** (`src/ui/InputLine.tsx`): Text rendering with selection
     - Handles cursor display and text selection highlighting
     - Uses tokenizer for syntax highlighting
     - Supports Unicode and special character rendering

### Key Systems

1. **Unit Conversion** (`src/evaluator/unit-converter.ts`)
   - Dimensional analysis for unit compatibility
   - Supports length, weight, temperature, time, volume, data units
   - Special handling for temperature conversions (not linear)
   - Uses decimal system for data units (1 GB = 1000 MB)

2. **Currency Manager** (`src/utils/currency-manager.ts`)
   - Fetches live rates from exchangerate-api.com
   - Caches rates for 24 hours in `~/.config/boomi/currency_cache.json`
   - Supports 300+ currencies
   - Auto-updates on startup if cache is stale

3. **Configuration** (`src/utils/config-manager.ts`)
   - YAML-based config at `~/.config/boomi/config.yaml`
   - Currently supports precision setting (decimal places)
   - Auto-creates config directory and file on first run

4. **Date/Time Operations** (`src/utils/date-manager.ts`)
   - Keywords: today, tomorrow, yesterday, now, weekdays
   - Arithmetic with units: days, weeks, months, years, hours, minutes, seconds
   - Uses date-fns for reliable date manipulation

### Build System

The project uses tsup to compile TypeScript/JSX to JavaScript:
- Configuration in `tsup.config.ts`
- Creates optimized bundles in `dist/`
- Adds Node.js shebang to CLI entry point
- The `prepublishOnly` hook ensures builds before npm publish

### Exit Handling

The app uses `exitOnCtrlC: false` in Ink render options and handles exit keys manually in Calculator component to ensure both Esc and Ctrl+C work properly on first press.

### Keyboard Shortcuts

The calculator supports advanced keyboard navigation and editing:
- **Navigation**: Arrow keys, Ctrl+A/E (line start/end), Alt+Left/Right (word navigation)
- **Selection**: Shift+Arrow keys, Shift+Ctrl+A/E, Shift+Alt+Left/Right
- **Editing**: Ctrl+K (delete to end), Ctrl+U (delete to start), Alt+Backspace/Delete (word deletion)
- **Clipboard**: Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste)
- **Line Operations**: Ctrl+J (join lines), Alt+Up/Down (move lines)
- **History**: Up/Down arrows navigate through line history
- **Special**: Tab (focus result), Ctrl+L (clear screen)

## Testing Strategy

Tests use Bun's built-in test framework with `describe`, `test`, and `expect`:
- `tests/evaluator.test.ts`: Core calculation logic
- `tests/parser.test.ts`: AST generation and operator precedence
- `tests/unit-conversion.test.ts`: Unit conversion accuracy

## Important Notes

- The calculator is published as `boosted-calc` on npm
- Configuration and cache files are stored in `~/.config/boomi/`
- The parser treats invalid expressions as comments for better UX
- Percentage calculations are context-aware (addition/subtraction vs standalone)
- Unit parsing is context-aware - single letters are treated as units only when they follow numbers (e.g., `10 m`, `5kg`) or conversion keywords (e.g., `to m`, `in kg`)
- Unicode variable names are supported, including Cyrillic (e.g., `цена = 100`)
- Date arithmetic supports expressions like `variable * time_unit + date` (e.g., `test * 1 day + today`)
- When fixing TypeScript errors in tests, avoid using non-null assertions (!); use proper type guards instead
- Text selection is fully supported with Shift+Arrow keys and various editing operations
- Clipboard operations (copy/cut/paste) work with system clipboard
- Comments can be inline with `#` (e.g., `2 + 2 # basic math`)
- The tokenizer supports multi-word timezone recognition (e.g., "new york", "los angeles")