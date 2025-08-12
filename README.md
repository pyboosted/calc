# Boosted Calculator

A powerful terminal-based calculator inspired by Numi, built with TypeScript and Ink (React for CLI). Features arbitrary precision arithmetic, advanced math operations, unit conversions, dimensional analysis, live currency conversion, and more.

![Boosted Calculator Example](docs/example.gif)

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
```

## Quick Start

```bash
# Run the calculator (interactive mode)
calc

# Open or create a calculation file
calc budget.calc

# Evaluate expression directly
calc -e "2 + 2"
calc -e "100 USD in EUR"
calc -e "sqrt(16) * 2"

# Update currency exchange rates
calc --update
```

### Basic Examples

```
# Simple math
2 + 2                    # 4
10 * (5 + 3)            # 80
sqrt(144)               # 12

# Unit conversions
100 cm in meters        # 1 m
32 °F in °C            # 0 °C
60 km/h to m/s         # 16.667 m/s

# Compound unit input
1h 30min                # 1.5 hours
2kg300g                 # 2.3 kg
100m / 1min30s          # 66.67 m/min

# Variables and functions
radius = 5
area = pi * radius^2    # 78.54
double(x) = x * 2
double(10)              # 20

# Pipe operator
[1, 2, 3, 4, 5] | sum   # 15
"  hello  " | trim | len # 5

# Date calculations
today + 7 days
25/12/2024 - today in days
```

## Features

- 🔢 **Arbitrary Precision** - Decimal.js for exact calculations (v1.5.0)
- ✨ **Advanced Mathematics** - Functions, trigonometry, logarithms
- 🔄 **Unit Conversions** - Length, weight, temperature, time, volume, data
- ⚡ **Dimensional Analysis** - Compound units like m/s, kg⋅m/s² (Newton)
- 💱 **Live Currency** - 300+ currencies with daily updates
- 📅 **Date & Time** - Arithmetic with dates, timezone support
- 🔤 **Strings & Booleans** - Text manipulation, logical operations
- 📊 **Arrays & Objects** - First-class data structures
- 🔧 **Variables & Functions** - User-defined functions with recursion
- 🎯 **Lambda Expressions** - Anonymous functions, higher-order operations
- 🚀 **Pipe Operator** - Functional composition with `|` operator
- 🎨 **Smart Interface** - Syntax highlighting, history, multi-line support
- 📝 **Markdown Support** - Rich text formatting for invalid expressions (v1.5.3)

[→ View all features](docs/features.md)

## Documentation

- 📖 [Complete Examples](docs/examples.md) - Comprehensive usage examples
- ⚡ [Features Guide](docs/features.md) - Detailed feature documentation
- ⌨️  [Keyboard Shortcuts](docs/keyboard-shortcuts.md) - Navigation and editing
- ⚙️  [Configuration](docs/configuration.md) - Settings and customization
- 🏗️  [Architecture](docs/architecture.md) - Technical design and internals

## Development

This project uses Bun as the package manager and development runtime, but is distributed as a standard Node.js package.

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run development mode with hot reload
bun dev

# Build for distribution
bun run build

# Type checking
bun run typecheck

# Linting
bun run lint
```

### Publishing

The package is automatically built before publishing:

```bash
npm publish
```

## Requirements

- Node.js 18+ (for runtime)
- Bun (for development only) - [Install Bun](https://bun.sh)

## License

MIT