# Boosted Calculator - Implementation Plan

## Project Setup
1. Initialize a new Bun project with TypeScript
2. Install Ink and required dependencies (ink, react, @types/react)
3. Set up project structure with proper TypeScript configuration

## Core Architecture

### 1. Parser & Lexer System
- **Tokenizer**: Parse input into tokens (numbers, operators, units, functions, variables)
- **Token Types**: NUMBER, OPERATOR, UNIT, FUNCTION, VARIABLE, KEYWORD, CURRENCY
- **Syntax Highlighter**: Color tokens based on type (matching Numi's color scheme)
- **Expression Parser**: Build AST from tokens supporting operator precedence

### 2. Evaluation Engine
- **Expression Evaluator**: Process AST to compute results
- **Unit System**: Handle conversions between compatible units
- **Variable Storage**: Store and retrieve user-defined variables
- **Previous Result**: Track last calculation result with 'prev' keyword

### 3. Supported Features

**Basic Operations**:
- Arithmetic: +, -, *, /, ^ (with word alternatives like "plus", "minus")
- Bitwise: &, |, xor, <<, >>
- Modulo: mod
- Percentages: Support "X - Y%" syntax

**Unit Conversions**:
- Length: meter, inch, foot, yard, mile, etc.
- Weight: gram, pound, ounce, stone, etc.
- Temperature: celsius, fahrenheit, kelvin
- Time: second, minute, hour, day, week, month, year
- Volume: pint, quart, gallon, tea spoon, table spoon, cup
- Area: hectare, acre, square units
- Data: bytes, kilobytes (both 1000 and 1024 multipliers)
- Currency: USD, EUR, GBP, etc. (with mock exchange rates)

**Functions**:
- Math: sqrt, cbrt, root, abs, log, ln, fact
- Rounding: round, ceil, floor
- Trigonometry: sin, cos, tan, arcsin, arccos, arctan
- Hyperbolic: sinh, cosh, tanh
- Date/Time: now, today, fromunix

**Special Features**:
- Date arithmetic: "today + 17 days"
- Unit conversion syntax: "20 ml in tea spoons"
- Percentage calculations: "20% of what is 30 cm"
- Sum/Average operations
- Variable assignment with =

### 4. TUI Components (using Ink)

**Main Layout**:
- Full terminal calculator interface
- Input area with syntax highlighting
- Result display aligned to the right
- Multi-line expression support
- Status line showing total/sum when applicable

**Color Scheme**:
- Background: Terminal default
- Regular text: White/default
- Numbers: Green (#98c379)
- Operators: Blue (#61afef)
- Units: Yellow (#e5c07b)
- Functions: Purple (#c678dd)
- Variables: Orange (#d19a66)
- Results: Bright green
- Keywords (in, as, to): Blue

**Interactive Features**:
- Real-time calculation as you type
- Cursor navigation with arrow keys
- Multi-line support (enter for new line)
- History navigation (up/down arrows)
- Clear screen with Ctrl+L
- Exit with Ctrl+C or ESC

## Implementation Steps

### Phase 1 - Core Calculator
- Set up project and basic TUI layout
- Implement tokenizer and parser
- Basic arithmetic operations
- Real-time evaluation and display

### Phase 2 - Unit System
- Implement unit registry
- Unit conversion logic
- Currency support (mock rates)
- Temperature conversions

### Phase 3 - Advanced Features
- Variables and previous result
- Mathematical functions
- Date/time operations
- Percentage calculations

### Phase 4 - Polish
- Syntax highlighting
- Error handling
- History navigation
- Performance optimization

## Key Technical Decisions
- Use a recursive descent parser for expression parsing
- Implement units as a type system with conversion factors
- Store results as objects with value and unit properties
- Use React hooks for state management in Ink components
- Mock currency rates (since we won't have API access in TUI)
- Use Ink's Box and Text components for layout
- Implement custom input handling for multi-line editing

This plan creates a fully functional calculator inspired by Numi as a pure terminal application!