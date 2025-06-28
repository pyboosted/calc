# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

Boosted Calculator is a powerful terminal-based calculator built with TypeScript and Ink (React for CLI). It features arbitrary precision arithmetic using Decimal.js (v1.5.0), advanced mathematical operations, dimensional analysis with compound units (v1.4.0), user-defined functions with recursion (v1.4.1), lambda functions and higher-order operations (v1.4.3), pipe operator for functional composition (v1.4.5), live currency conversion, string manipulation (v1.3.0), boolean operations (v1.3.1), arrays and objects (v1.3.2), and a sophisticated expression parser. The project uses Bun as the package manager and development runtime, but is distributed as a standard Node.js package.

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

# Open a file in interactive mode
calc budget.calc
calc calculations.txt

# Evaluate expression with -e flag
calc -e "2 + 2"
calc -e "100 USD to EUR"

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
   - Handles numbers, operators, units, functions, variables, keywords, strings, booleans, arrays, objects
   - String literals: backticks with interpolation, single/double quotes without
   - Recognizes multi-character operators and currency symbols
   - Recognizes comparison operators (`==`, `!=`, `<`, `>`, `<=`, `>=`)
   - Tokenizes boolean/null keywords and logical operators (`and`, `or`, `not`)
   - Tokenizes array literals (`[`, `]`) and object literals (`{`, `}`)
   - Tokenizes arrow operator (`=>`) for lambda expressions
   - Tokenizes pipe operator (`|`) for functional composition
   - Maintains position information for each token
   - Processes escape sequences in strings

2. **Parser** (`src/parser/parser.ts`): Builds Abstract Syntax Tree (AST) from tokens
   - Recursive descent parser with proper operator precedence
   - Special handling for percentage operations in context (e.g., `100 - 10%` → `100 - (100 * 10/100)`)
   - Converts unit syntax (`100 cm`) into binary operations
   - Handles "X% of Y" syntax separately from regular percentages
   - Parses string literals with interpolation expressions
   - Handles type casting syntax (`expression as type`)
   - Parses boolean literals (`true`, `false`, `null`)
   - Parses array literals (`[1, 2, 3]`) and object literals (`{a: 1, b: 2}`)
   - Supports property access (dot notation and bracket notation)
   - Implements comparison and logical operators with proper precedence
   - Supports ternary conditional operator (`? :`)
   - Parses lambda expressions (`x => x * 2`, `(a, b) => a + b`)
   - Parses pipe operator with correct precedence between additive and conversion

3. **Evaluator** (`src/evaluator/evaluate.ts`): Executes AST to produce results
   - Maintains variable state across evaluations
   - Handles unit conversions through `convertUnits`
   - Integrates with date/time operations via `date-manager`
   - Returns discriminated union `CalculatedValue` objects (number, string, date, boolean, null, array, or object)
   - Evaluates string interpolations and operations
   - Implements type casting between strings, numbers, booleans, arrays, and objects
   - Evaluates array operations (push, pop, slice, etc.) and object operations (keys, values, has)
   - Handles property access for both arrays (index) and objects (key)
   - Evaluates comparison operations with automatic unit conversion
   - Implements short-circuit evaluation for logical operators
   - Uses JavaScript-like truthiness rules for conditional expressions
   - Evaluates lambda expressions with closure support
   - Handles higher-order functions (filter, map, reduce, sort, groupBy)

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

### Type System (v1.3.0, updated v1.3.1, extended v1.3.2, overhauled v1.4.0)

**CalculatedValue** is now a discriminated union:
```typescript
type CalculatedValue = 
  | { type: 'number'; value: Decimal }                    // Pure numbers only, no units (v1.5.0: now using Decimal.js)
  | { type: 'percentage'; value: Decimal }                // Special type for percentages
  | { type: 'quantity'; value: Decimal; dimensions: DimensionMap }  // Numbers with dimensional analysis
  | { type: 'string'; value: string }
  | { type: 'date'; value: Date; timezone?: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: null }
  | { type: 'array'; value: CalculatedValue[] }
  | { type: 'object'; value: Map<string, CalculatedValue> }
  | { type: 'function'; value: FunctionInfo }            // User-defined functions
  | { type: 'lambda'; value: LambdaInfo };               // Lambda expressions
```

**DimensionMap** structure for dimensional analysis:
```typescript
type DimensionMap = {
  length?: { exponent: number; unit?: LengthUnit };
  mass?: { exponent: number; unit?: MassUnit };
  time?: { exponent: number; unit?: TimeUnit };
  current?: { exponent: number; unit?: CurrentUnit };
  temperature?: { exponent: number; unit?: TemperatureUnit };
  amount?: { exponent: number; unit?: AmountUnit };
  luminosity?: { exponent: number; unit?: LuminosityUnit };
  angle?: { exponent: number; unit?: AngleUnit };
  currency?: { exponent: number; code: CurrencyCode };
}
```

This allows the calculator to handle multiple data types while maintaining type safety and performing dimensional analysis.

### String Processing (v1.3.0)

1. **String Literals**:
   - Backticks (`): Support interpolation with `${expression}` syntax
   - Single quotes ('): No interpolation, literal strings only
   - Double quotes ("): No interpolation, literal strings only

2. **String Operations**:
   - **Concatenation (+)**: Joins strings or converts and joins mixed types
   - **Repetition (*)**: `string * number` repeats the string
   - **Subtraction (-)**: Removes suffix if present

3. **String Functions** (`src/evaluator/string-functions.ts`):
   - `len(string)`: Returns length
   - `substr(string, start, length?)`: Extracts substring
   - `charat(string, index)`: Gets character at index
   - `trim(string)`: Removes whitespace
   - `format(date, pattern)`: Formats dates using patterns

4. **Type Casting**:
   - `as string`: Converts numbers/dates/booleans to strings
   - `as number`: Converts strings/booleans to numbers (with validation)
   - `as boolean`: Converts any type to boolean using truthiness rules

### Boolean Operations (v1.3.1)

1. **Boolean Literals**:
   - `true`, `false`: Boolean values
   - `null`: Null value

2. **Comparison Operators**:
   - `==`, `!=`: Equality and inequality
   - `<`, `>`, `<=`, `>=`: Relational comparisons
   - Supports comparing numbers, strings, dates, and booleans
   - Unit conversions are applied when comparing numbers with units

3. **Logical Operators**:
   - `and`: Logical AND with short-circuit evaluation
   - `or`: Logical OR with short-circuit evaluation
   - `not`: Logical NOT
   - Operators return the last evaluated value (not just true/false)

4. **Ternary Operator**:
   - `condition ? trueValue : falseValue`: Conditional expression
   - Supports nested ternary expressions
   - Evaluates condition for truthiness

5. **Truthiness Rules**:
   - `false`, `0`, `""` (empty string), and `null` are falsy
   - All other values are truthy (including empty arrays/objects if added later)
   - Dates are always truthy

6. **Operator Precedence** (lowest to highest):
   - Ternary (`? :`)
   - Logical OR (`or`)
   - Logical AND (`and`)
   - Comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`)
   - Additive (`+`, `-`)
   - Multiplicative (`*`, `/`, `%`)
   - Unary (`-`, `+`, `not`)
   - Exponentiation (`^`)

### Arrays and Objects (v1.3.2)

1. **Array Literals**:
   - `[1, 2, 3]`: Create arrays with square brackets
   - Empty arrays: `[]`
   - Mixed types: `[1, "hello", true]`
   - Nested arrays: `[[1, 2], [3, 4]]`

2. **Object Literals**:
   - `{a: 1, b: 2}`: Create objects with curly braces
   - Empty objects: `{}`
   - String keys: `{"name": "John", "age": 30}`
   - Mixed value types: `{x: 1, y: "hello", z: true}`
   - Nested objects: `{person: {name: "John", age: 30}}`

3. **Array Functions**:
   - `push(arr, value)`: Add element to end (mutates array), returns new length
   - `pop(arr)`: Remove last element (mutates array), returns removed element or null
   - `first(arr)`: Get first element
   - `last(arr)`: Get last element
   - `slice(arr, start, end?)`: Extract portion of array
   - `length(arr)`: Get array length
   - `sum(arr)`: Sum of numeric elements
   - `avg(arr)` or `average(arr)`: Average of numeric elements

4. **Object Functions**:
   - `keys(obj)`: Get array of object keys
   - `values(obj)`: Get array of object values
   - `has(obj, key)`: Check if object has key

5. **Property Access**:
   - Dot notation: `obj.property`, `arr.0`
   - Bracket notation: `obj["property"]`, `arr[0]`
   - Dynamic access: `obj[variable]`, `arr[index]`
   - Nested access: `obj.person.name`, `arr[0][1]`

6. **Type Casting**:
   - `as array`: Parse JSON array from string
   - `as object`: Parse JSON object from string
   - Arrays/objects to string: Converts to JSON representation

7. **Integration with Aggregates**:
   - `sum` and `avg`/`average` work as both:
     - Aggregate keywords (operate on previous results)
     - Functions (operate on array arguments)
   - Context-aware tokenization determines usage

### Lambda Functions (v1.4.3)

The calculator supports lambda expressions (anonymous functions) and higher-order functions:

1. **Lambda Syntax**:
   ```calc
   # Single parameter (no parentheses needed)
   x => x * 2
   
   # Multiple parameters (parentheses required)
   (a, b) => a + b
   (acc, item) => acc + item
   ```

2. **Built-in Higher-Order Functions**:
   - `filter(array, predicate)`: Returns elements where predicate is truthy
   - `map(array, transform)`: Transforms each element
   - `reduce(array, reducer, initial)`: Reduces array to single value
   - `sort(array, comparator)`: Sorts with custom comparator (-1/0/1 style)
   - `groupBy(array, keyFunction)`: Groups elements by key

3. **Lambda Features**:
   - Full closure support (access to outer scope)
   - Can be stored in variables
   - Can be passed as arguments to functions
   - Can be returned from functions

4. **Examples**:
   ```calc
   # Filter positive numbers
   filter([1, -2, 3, -4, 5], x => x > 0)  # [1, 3, 5]
   
   # Map transformation
   map([1, 2, 3], x => x * x)  # [1, 4, 9]
   
   # Reduce to sum
   reduce([1, 2, 3, 4], (acc, x) => acc + x, 0)  # 10
   
   # Sort ascending
   sort([3, 1, 4, 1, 5], (a, b) => a - b)  # [1, 1, 3, 4, 5]
   
   # Group by property
   groupBy([1, 2, 3, 4, 5], x => x % 2 == 0)  # {"true": [2, 4], "false": [1, 3, 5]}
   
   # Lambda in variable
   double = x => x * 2
   map([1, 2, 3], double)  # [2, 4, 6]
   
   # Lambda in user function
   any(arr, pred) = reduce(arr, (acc, x) => acc or pred(x), false)
   any([1, 2, 3], x => x > 2)  # true
   ```

### Pipe Operator (v1.4.5)

The pipe operator (`|`) enables functional composition by passing values through a chain of functions:

1. **Basic Syntax**:
   ```calc
   # Pipe value to function
   [1, 2, 3] | sum  # 6
   
   # Chain multiple operations
   "  hello  " | trim | len  # 5
   ```

2. **Features**:
   - Left-to-right data flow
   - Works with built-in functions, user-defined functions, and lambdas
   - Preserves units through operations
   - Enables partial application with additional arguments

3. **Examples**:
   ```calc
   # Basic piping
   [1, 2, 3, 4, 5] | sum                  # 15
   [10, 20, 30] | avg                     # 20
   
   # With user functions
   double(x) = x * 2
   5 | double                             # 10
   
   # With higher-order functions
   [1, -2, 3, -4, 5] | filter(x => x > 0) | sum  # 9
   
   # Unit preservation
   [10m, 20m, 30m] | sum                  # 60 m
   
   # Multi-line aggregates
   100
   200
   300
   agg | sum                              # 600
   ```

### User-Defined Functions (v1.4.1)

The calculator supports user-defined functions with recursion, making it Turing-complete:

1. **Function Definition Syntax**:
   ```calc
   # Basic function
   double(x) = x * 2
   max(a, b) = a > b ? a : b
   
   # Recursive function
   fact(n) = n <= 1 ? 1 : n * fact(n-1)
   fib(n) = n <= 1 ? n : fib(n-1) + fib(n-2)
   
   # Functions with units
   to_meters(value) = value to m
   velocity(dist, time) = dist / time
   ```

2. **Function Features**:
   - Parameters create a new scope that shadows outer variables
   - Functions can call themselves (recursion) with a depth limit of 1000
   - Functions are first-class values (can be stored and referenced)
   - Clear error messages for parameter count mismatches

3. **Known Issues**:
   - Parameter names that match unit names cause incorrect behavior
   - Avoid using 't', 's', 'm', 'g', 'd', 'h', 'A' as parameter names
   - Use descriptive names like 'time', 'dist', 'mass' instead

4. **Examples**:
   ```calc
   # Define and use functions
   square(x) = x * x
   square(5)  # Returns 25
   
   # Mutual recursion
   is_even(n) = n == 0 ? true : is_odd(n - 1)
   is_odd(n) = n == 0 ? false : is_even(n - 1)
   
   # Function reference
   square  # Returns <function square(x)>
   ```

### Dimensional Analysis (v1.4.0)

The calculator now supports full dimensional analysis for compound units and physics calculations:

1. **Compound Unit Syntax**:
   - Division notation: `m/s`, `kg/h`, `W/m²`
   - Multiplication notation: `kg*m/s^2`, `N*m`
   - Exponent notation: `m^2`, `s^-1`, `m³`
   - Unicode support: `m²`, `s⁻¹`, `μA`

2. **Dimensional Arithmetic**:
   - Multiplication: Dimensions add exponents (`m * m = m²`)
   - Division: Dimensions subtract exponents (`m³ / m = m²`)
   - Power: Dimensions multiply by exponent (`m^3 = m³`)
   - Addition/Subtraction: Requires compatible dimensions with automatic unit conversion

3. **Derived Units** (automatically recognized):
   - `Hz` (Hertz): `s⁻¹` - frequency
   - `N` (Newton): `kg⋅m/s²` - force
   - `Pa` (Pascal): `kg/(m⋅s²)` - pressure
   - `J` (Joule): `kg⋅m²/s²` - energy
   - `W` (Watt): `kg⋅m²/s³` - power

4. **Smart Unit Display**:
   - Simplifies to derived units when possible (`kg⋅m/s²` → `N`)
   - Cancels dimensions automatically (`50 Hz * 2 s` → `100`)
   - Formats compound units nicely (`m⋅s⁻¹` or `m/s`)

5. **Implementation Files**:
   - `src/evaluator/dimensions.ts`: Core dimensional system and conversion tables
   - `src/evaluator/quantity-operations.ts`: Arithmetic operations for quantities
   - `src/parser/unit-parser.ts`: Enhanced parser for compound unit expressions
   - `src/evaluator/unit-formatter.ts`: Smart display and formatting

### Key Systems

1. **Dimensional Analysis & Unit Conversion** (`src/evaluator/dimensions.ts`, `src/evaluator/unit-converter.ts`)
   - Full dimensional analysis with exponent tracking
   - Supports compound units (m/s, kg⋅m/s², etc.)
   - Handles all SI base units and many derived units
   - Automatic unit simplification and conversion
   - Special handling for temperature conversions (not linear)
   - Type-safe unit definitions for each dimension

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
- **File Operations**: Ctrl+S (save file)
- **Special**: Tab (focus result), Ctrl+L (clear screen)

## Testing Strategy

Tests use Bun's built-in test framework with `describe`, `test`, and `expect`:
- `tests/evaluator.test.ts`: Core calculation logic
- `tests/parser.test.ts`: AST generation and operator precedence
- `tests/unit-conversion.test.ts`: Unit conversion accuracy
- `tests/compound-units-slash.test.ts`: Compound unit parsing and operations
- `tests/derived-units.test.ts`: Physics units (N, J, W, Hz, Pa)
- `tests/boolean-operations.test.ts`: Boolean logic, comparisons, and ternary operator
- `tests/env-arg-functions.test.ts`: Environment variable and argument functions
- `tests/cli-env-arg.test.ts`: CLI integration tests for stdin, --arg, and -o flags
- `tests/user-functions.test.ts`: User-defined functions with recursion (v1.4.1)
- `tests/lambda-functions.test.ts`: Lambda expressions and higher-order functions (v1.4.3)
- `tests/pipe-operator.test.ts`: Pipe operator functionality (v1.4.5)
- `tests/sum-avg-functions.test.ts`: Sum/avg as both array functions and aggregates
- `tests/compound-division-bug.test.ts`: Compound unit division consistency

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
- String literals support three types: backticks with interpolation, single/double quotes without (v1.3.0)
- String operations maintain type safety through discriminated union CalculatedValue type
- Type casting with `as` keyword allows conversion between strings, numbers, and booleans
- String functions are case-sensitive and follow JavaScript conventions
- Escape sequences in strings support `\n`, `\t`, `\\`, and `\`` 
- Aggregate operations (`total`) concatenate strings when previous results contain strings
- Boolean operations use JavaScript-like truthiness rules (v1.3.1)
- Logical operators (`and`, `or`) implement short-circuit evaluation
- Comparison operators automatically handle unit conversions for numbers with units
- The ternary operator (`? :`) supports nested expressions and evaluates conditions for truthiness
- `null` is a distinct type from `false` or `0`, following JavaScript semantics
- Arrays and objects are first-class types with full support for literals, functions, and property access (v1.3.2)
- Array functions `push` and `pop` mutate the array (like JavaScript) - push returns new length, pop returns removed element
- The `sum`, `avg`, and `average` functions can work as both aggregate keywords and array functions
- Type casting supports parsing JSON strings to arrays/objects with `as array` and `as object`
- Property access works with both dot notation and bracket notation for arrays and objects
- Environment variables can be read with `env("VAR_NAME")` function (v1.3.6)
- Command-line arguments with `arg()` function: reads stdin → --arg → null (v1.3.6)
- Type conversions work with env/arg: `env("PORT") as number`, `arg() as object`
- Output mode `-o/--output` flag executes files and outputs only the last result for pipelines
- Dimensional analysis tracks exponents for all dimensions in compound units (v1.4.0)
- Quantities with dimensions cannot be added to dimensionless numbers
- Unit conversions work with compound units: `60 km/h to m/s`
- Derived units are automatically recognized and displayed: `kg⋅m/s²` → `N`
- The percentage type is separate from quantities and has special arithmetic rules
- User-defined functions are supported with recursion (v1.4.1): `fact(n) = n <= 1 ? 1 : n * fact(n-1)`
- Function parameters create a new scope that shadows outer variables
- Functions are stored as first-class values and can be referenced without calling
- Recursion depth is limited to 1000 to prevent stack overflow
- Known issue: function parameter names that match unit names (like 't', 's', 'm') cause incorrect behavior
- Lambda functions are supported with arrow syntax (v1.4.3): `x => x * 2`
- Higher-order functions available: `filter`, `map`, `reduce`, `sort`, `groupBy`
- Lambdas have full closure support and can access outer scope variables
- Pipe operator (`|`) enables functional composition (v1.4.5): `[1, 2, 3] | sum`
- Pipe operator works with built-in functions, user-defined functions, and higher-order functions
- Unit conversions during division now properly handle compound units (v1.4.5 bugfix)
- All numeric calculations use Decimal.js for arbitrary precision arithmetic (v1.5.0)
- Precision is preserved through all operations including unit conversions and currency calculations
- The precision display setting in config only affects output formatting, not internal calculations
