# Boosted Calculator

A powerful terminal-based calculator inspired by Numi, built with Bun, TypeScript, and Ink (React for CLI).

![Boosted Calculator Example](docs/example.webm)

## Features

### ✅ Implemented
- **Basic arithmetic**: `+`, `-`, `*`, `/`, `^` (power), `%` (modulo)
- **Word operators**: `plus`, `minus`, `times`, `divided`, `mod`
- **Mathematical functions**: `sqrt`, `cbrt`, `abs`, `log`, `ln`, `fact`, `round`, `ceil`, `floor`
- **Trigonometry**: `sin`, `cos`, `tan`, `arcsin`, `arccos`, `arctan`
- **Hyperbolic**: `sinh`, `cosh`, `tanh`
- **Unit conversions**: Length, weight, temperature, time, volume, data
  - Examples: `100 cm in meters`, `32 F in C`, `1 hour in minutes`
- **Live currency conversion**: 300+ currencies updated daily from free API
- **Variables**: `x = 10`, then use `x` in expressions
- **Previous result**: Use `prev` to reference the previous line's result (skips empty lines and comments)
- **Aggregate operations**: `total` and `average` calculate sum/mean of previous numeric values (stops at empty line or comment)
- **Smart percentage calculations**: 
  - Basic: `20%` = 0.2
  - With operations: `100 - 10%` = 90, `100 + 10%` = 110
  - "Of" syntax: `20% of 100` = 20
  - Direct percentage math: `25% + 25%` = 0.5
- **Syntax highlighting**: Numbers, operators, units, functions, and variables are color-coded
- **History navigation**: Use up/down arrows to navigate through previous calculations
- **Multi-line support**: Press Enter to add new lines to expressions
- **Comments**: Use `#` for inline comments (e.g., `5 * 4 # multiply numbers`)
- **Formatting**: Invalid expressions are treated as comments (gray text), empty lines for organization
- **Clipboard copy**: 
  - `Ctrl+Y`: Copy the result value with visual feedback (yellow highlight)
- **Configurable precision**: Set decimal places for results via config.yaml
- **Date/time operations**: 
  - Keywords: `today`, `tomorrow`, `yesterday`, `now`, weekdays (`monday`, `tuesday`, etc.)
  - Date literals: `25.10.1988`, `25/07/2025` (DD.MM.YYYY or DD/MM/YYYY format)
  - Time literals: `12:00`, `10:30` (HH:MM format, uses system timezone)
  - Time with timezone: `12:00@moscow`, `10:30@utc-5`, `15:45@new york`
  - DateTime with timezone: `25.10.2025T12:15@moscow`
  - Timezone conversions: `12:00@moscow in utc`, `now in yerevan`
  - Arithmetic: `today + 5 days`, `now + 2 hours`, `tomorrow - 1 week`
  - Time arithmetic: `12:15@moscow - 10:00@moscow in minutes`
  - Date differences: `25/07/2025 - today in days`, `(01.01.2025 - 25.12.2024) in hours`
  - Supports: days, weeks, months, years, hours, minutes, seconds, milliseconds

## Requirements

- **Bun runtime** (required) - [Install Bun](https://bun.sh)
- Node.js 18+ (for npm installation)

## Installation

### Install from npm (recommended)

```bash
npm install -g boosted-calc
# or
yarn global add boosted-calc
# or
bun add -g boosted-calc
```

### Build from source

```bash
# Clone the repository
git clone https://github.com/pyboosted/calc
cd calc

# Install dependencies
bun install

# Install globally
npm link
# or
npm install -g .
```

## Usage

```bash
# Run the calculator (interactive mode)
calc

# Open a file in interactive mode
calc budget.calc
calc calculations.txt

# Create a new file (will be created on save)
calc my-new-calculations.calc

# Non-interactive mode - calculate and print result
calc -e "2 + 2"
calc -e "today + 5 days"
calc -e "100 USD in EUR"
calc -e "sqrt(16) * 2"

# Update currency exchange rates
calc --update

# For development (from source)
bun start    # Run calculator
bun dev      # Run with file watching
```

## Supported Timezones

The calculator supports various timezone formats:
- UTC offsets: `utc`, `utc+3`, `utc-5`, etc.
- Common abbreviations: `est`, `pst`, `gmt`, `bst`, `cet`, etc.
- Major cities: `moscow`, `london`, `new york`, `tokyo`, `sydney`, `dubai`, etc.
- Multi-word cities: `new york`, `los angeles`, `hong kong`, `sao paulo`, etc.

## Configuration

The calculator stores its configuration in `~/.config/boomi/config.yaml`. The file is created automatically on first run with default values.

### Available Options

- **precision**: Number of decimal places for results (default: 2, range: 0-20)

Example config.yaml:
```yaml
# Boosted Calculator Configuration
# precision: Number of decimal places for results (default: 2)

precision: 4
```

## Keyboard Shortcuts

### Basic Controls
- **Ctrl+C / ESC**: Exit the calculator
- **Ctrl+L**: Clear all calculations
- **Ctrl+Y**: Copy result to clipboard
- **Enter**: Add a new line (for multi-line expressions)

### Navigation
- **Up/Down arrows**: Navigate through calculation history
- **Left/Right arrows**: Move cursor within input
- **Cmd+Left / Ctrl+A**: Move to beginning of line
- **Cmd+Right / Ctrl+E**: Move to end of line
- **Option+Left**: Move one word left
- **Option+Right**: Move one word right

### Editing
- **Backspace**: Delete character before cursor
- **Backspace at line start**: Merge with previous line
- **Cmd+Backspace / Ctrl+U**: Delete to beginning of line
- **Option+Backspace / Ctrl+W**: Delete word backwards
- **Ctrl+K**: Delete to end of line

## Examples

```
# Basic math
2 + 2
10 - 5
3 * 4
20 / 4
2 ^ 3
10 % 3

# Functions
sqrt(16)
sin(0)
round(3.14159, 2)

# Unit conversions
100 cm in meters
32 fahrenheit in celsius
1 gb in mb
20 ml in teaspoons

# Currency conversions (live rates)
100 USD in EUR
50 EUR in GBP
(100 USD + 50 EUR) in JPY

# Variables
x = 10
y = 20
x + y
sqrt(x^2 + y^2)

# Unicode variable names (including Cyrillic)
цена = 1500
скидка = 10%
цена - скидка

# Variables with date/time arithmetic
test = 2
test * 1 day + today
num = 5
tomorrow + num * 1 week

# Using previous result
10 + 5
prev * 2
prev - 5
# Comment line doesn't affect prev
prev / 3

# Inline comments
100 * 1.2 # add 20% markup
sqrt(144) # square root of 144
price = 50 # base price

# Aggregate operations
100
200
300
total          # 600
average        # 200

# With grouping
85
90
95
average        # 90

Comment or empty line breaks the group
50
total          # 50 (only counts this line)

# Percentages
20%
100 - 10%
100 + 10%
20% of 500
50% * 100
25% + 25%

# Date operations
today
tomorrow
today + 5 days
now + 2 hours
tomorrow - 1 week
monday + 3 days

# Date literals (DD.MM.YYYY or DD/MM/YYYY)
25.10.1988
01/01/2025
25/07/2025 - today in days
01.01.2025 + 30 days
birthday = 25.10.1988
today - birthday in days

# Time and timezone operations
12:00                          # Current timezone
10:30@utc                      # UTC time
12:00@moscow                   # Moscow time
15:45@new york                 # New York time
12:00@moscow in utc            # Convert to UTC
now in yerevan                 # Current time in Yerevan
12:15 - 10:00 in minutes       # Time difference
25.10.2025T12:15@moscow        # DateTime with timezone

# Comments and organization
Calculate monthly budget:

Income
1500 + 2000

Expenses
rent = 800
food = 300
utilities = 150
rent + food + utilities

Remaining
3500 - 1250
```

## Architecture

The calculator is built with a modular architecture:

- **Parser**: Tokenizer + AST parser for mathematical expressions
- **Evaluator**: Evaluates the AST with support for functions, units, and variables
- **Currency Manager**: Fetches and caches exchange rates from free API
- **UI Components**: React-based terminal UI using Ink
  - `Calculator`: Main component managing state
  - `Input`: Handles user input with syntax highlighting
  - `Display`: Shows results and errors
  - `HighlightedText`: Provides syntax highlighting

## Development

This project uses Bun as the package manager and development runtime, but is distributed as a standard Node.js package.

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Type checking
bun tsc --noEmit

# Build for distribution (creates dist/ folder)
bun run build

# Run development mode with hot reload
bun dev
```

### Publishing

The package is automatically built before publishing via the `prepublishOnly` hook. Just run:

```bash
npm publish
```

## License

MIT
