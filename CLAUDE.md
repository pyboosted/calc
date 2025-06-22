# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Boosted Calculator is a powerful terminal-based calculator built with Bun, TypeScript, and Ink (React for CLI). It features advanced mathematical operations, unit conversions, live currency conversion, and a sophisticated expression parser.

## Development Commands

### Essential Commands
```bash
# Install dependencies
bun install

# Run the calculator (interactive mode)
bun start
# or globally after installation
calc

# Non-interactive mode (evaluate expression)
calc "2 + 2"
calc "today + 5 days"

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
bun tsc --noEmit

# Install globally
npm i -g .
```

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
   - Integrates with date/time operations via `DateManager`
   - Returns `CalculatedValue` objects with value and optional unit

### UI Architecture (Ink/React)

The UI uses Ink (React for CLI) with a multi-line editor approach:

1. **Calculator** (`src/ui/Calculator.tsx`): Main component managing state
   - Tracks multiple lines with individual results
   - Handles keyboard navigation (arrows, enter, backspace)
   - Manages variable state including `prev` (previous result)
   - Implements exit handling for Esc and Ctrl+C

2. **InputWithResult** (`src/ui/InputWithResult.tsx`): Individual line component
   - Renders input with syntax highlighting
   - Shows results or errors aligned to the right
   - Handles line-specific keyboard input when active
   - Treats invalid expressions as comments (gray text)

3. **InputLine** (`src/ui/InputLine.tsx`): Syntax highlighting and cursor
   - Uses inverse character for cursor display
   - Tokenizes input for color-coded syntax highlighting
   - Handles empty lines and cursor positioning edge cases

### Key Systems

1. **Unit Conversion** (`src/evaluator/unitConverter.ts`)
   - Dimensional analysis for unit compatibility
   - Supports length, weight, temperature, time, volume, data units
   - Special handling for temperature conversions (not linear)
   - Uses decimal system for data units (1 GB = 1000 MB)

2. **Currency Manager** (`src/utils/currencyManager.ts`)
   - Fetches live rates from exchangerate-api.com
   - Caches rates for 24 hours in `~/.config/boomi/currency_cache.json`
   - Supports 300+ currencies
   - Auto-updates on startup if cache is stale

3. **Configuration** (`src/utils/configManager.ts`)
   - YAML-based config at `~/.config/boomi/config.yaml`
   - Currently supports precision setting (decimal places)
   - Auto-creates config directory and file on first run

4. **Date/Time Operations** (`src/utils/dateManager.ts`)
   - Keywords: today, tomorrow, yesterday, now, weekdays
   - Arithmetic with units: days, weeks, months, years, hours, minutes, seconds
   - Uses date-fns for reliable date manipulation

### Exit Handling

The app uses `exitOnCtrlC: false` in Ink render options and handles exit keys manually in Calculator component to ensure both Esc and Ctrl+C work properly on first press.

## Testing Strategy

Tests use Bun's built-in test framework with `describe`, `test`, and `expect`:
- `tests/evaluator.test.ts`: Core calculation logic
- `tests/parser.test.ts`: AST generation and operator precedence
- `tests/unit-conversion.test.ts`: Unit conversion accuracy

## Important Notes

- Always use Bun commands instead of npm/node equivalents
- The calculator is published as `@boosted/calc` on npm
- Configuration and cache files are stored in `~/.config/boomi/`
- The parser treats invalid expressions as comments for better UX
- Percentage calculations are context-aware (addition/subtraction vs standalone)
- Units take priority over variables - single letters like m, g, c, f, k, s, h, d, l are recognized as units, not variables
- Date arithmetic supports expressions like `variable * time_unit + date` (e.g., `test * 1 day + today`)
