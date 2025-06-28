# Boosted Calculator Features

## Basic Mathematics
- **Basic arithmetic**: `+`, `-`, `*`, `/`, `^` (power), `%` (modulo)
- **Word operators**: `plus`, `minus`, `times`, `divided`, `mod`
- **Mathematical functions**: `sqrt`, `cbrt`, `abs`, `log`, `ln`, `fact`, `round`, `ceil`, `floor`
- **Trigonometry**: `sin`, `cos`, `tan`, `arcsin`, `arccos`, `arctan`
- **Hyperbolic**: `sinh`, `cosh`, `tanh`

## Unit Conversions
- **Length, weight, temperature, time, volume, data**
  - Examples: `100 cm in meters`, `32 F in C`, `1 hour in minutes`

## Dimensional Analysis & Compound Units (v1.4.0)
- **Velocity**: `100m / 10s = 10 m/s`, `60 km/h to m/s`
- **Acceleration**: `10 m/s / 5s = 2 m/s²`
- **Force**: `5kg * 2 m/s² = 10 N`
- **Energy**: `10N * 5m = 50 J`, `100J to kWh`
- **Power**: `50J / 10s = 5 W`
- **Pressure**: `1000N / 0.1m² = 10000 Pa`
- **Physics units**: Hz (frequency), N (Newton), Pa (Pascal), J (Joule), W (Watt)

## Currency Conversion
- **Live currency conversion**: 300+ currencies updated daily from free API

## Variables & Functions

### Variables
- Simple assignment: `x = 10`, then use `x` in expressions
- Unicode variable names supported, including Cyrillic (e.g., `цена = 100`)

### User-defined Functions (v1.4.1)
- Simple functions: `double(x) = x * 2`, `max(a, b) = a > b ? a : b`
- Recursive functions: `fact(n) = n <= 1 ? 1 : n * fact(n-1)`
- Functions are first-class values that can be stored and referenced

### Lambda Functions (v1.4.3)
- Lambda syntax: `x => x * 2`, `(a, b) => a + b`
- Higher-order functions: `filter`, `map`, `reduce`, `sort`, `groupBy`
- Lambdas can be stored in variables and passed as arguments
- Full closure support for accessing outer scope

### Compound Assignments
- Works for all types: `x += 5`, `text -= ".txt"`, `arr += [1,2,3]`

## Special Operations

### Previous Result
- Use `prev` to reference the previous line's result (skips empty lines and comments)

### Aggregate Operations
- `total` and `average` calculate sum/mean of previous numeric values (stops at empty line or comment)
- String concatenation: `total` concatenates strings when previous results contain strings

### Smart Percentage Calculations
- Basic: `20%` = 0.2
- With operations: `100 - 10%` = 90, `100 + 10%` = 110
- "Of" syntax: `20% of 100` = 20
- Direct percentage math: `25% + 25%` = 0.5

## String Support (v1.3.0)
- **String literals**: 
  - Backticks with interpolation: `` `hello ${name}` ``
  - Single quotes: `'text'` (no interpolation)
  - Double quotes: `"text"` (no interpolation)
- **String operations**: 
  - Concatenation (`+`)
  - Repetition (`*`)
  - Suffix removal (`-`)
- **Type casting**: `as string`, `as number`
- **String functions**: `len`, `substr`, `charat`, `trim`, `format`
- **Escape sequences**: `\n`, `\t`, `\\`, `` \` ``

## Boolean Operations (v1.3.1)
- **Boolean literals**: `true`, `false`, `null`
- **Comparison operators**: `==`, `!=`, `<`, `>`, `<=`, `>=`
- **Logical operators**: `and`, `or`, `not`
- **Ternary operator**: `condition ? true : false`
- **Type casting**: `as boolean`

## Arrays and Objects (v1.3.2)
- **Array literals**: `[1, 2, 3]`, nested arrays, mixed types
- **Object literals**: `{a: 1, b: 2}`, nested objects, string keys
- **Array functions**: 
  - Non-mutating: `push`, `pop`, `shift`, `unshift`, `append`, `prepend`, `first`, `last`, `slice`, `length`, `sum`, `avg`/`average`, `find`, `findIndex`
  - Mutating (with `!` suffix): `push!`, `pop!`, `shift!`, `unshift!`, `append!`, `prepend!`, `slice!`, `filter!`, `map!`
- **Object functions**: `keys`, `values`, `has`
- **Property access**: 
  - Dot notation: `obj.property`
  - Bracket notation: `arr[0]`
- **Array operations**: 
  - `[1,2] + [3,4]` → `[1,2,3,4]`
  - `[1,2,3] + 4` → `[1,2,3,4]`
  - `[1,2,3,2] - 2` → `[1,3]`
- **Type casting**: `as array`, `as object` (parses JSON strings)

## Date/Time Operations
- **Keywords**: `today`, `tomorrow`, `yesterday`, `now`, weekdays (`monday`, `tuesday`, etc.)
- **Date literals**: `25.10.1988`, `25/07/2025` (DD.MM.YYYY or DD/MM/YYYY format)
- **Time literals**: `12:00`, `10:30` (HH:MM format, uses system timezone)
- **Time with timezone**: `12:00@moscow`, `10:30@utc-5`, `15:45@new york`
- **DateTime with timezone**: `25.10.2025T12:15@moscow`
- **Timezone conversions**: `12:00@moscow in utc`, `now in yerevan`
- **Arithmetic**: `today + 5 days`, `now + 2 hours`, `tomorrow - 1 week`
- **Time arithmetic**: `12:15@moscow - 10:00@moscow in minutes`
- **Date differences**: `25/07/2025 - today in days`, `(01.01.2025 - 25.12.2024) in hours`
- **Supported units**: days, weeks, months, years, hours, minutes, seconds, milliseconds

## Environment and Arguments (v1.3.6)
- **`env()` function**: Read environment variables with `env("VAR_NAME")`
- **`arg()` function**: Read input data (priority: stdin → --arg → null)
- **Type conversions**: `env("PORT") as number`, `arg() as object`
- **CLI flags**: `--arg "value"` for passing arguments
- **Output mode**: `-o/--output` flag for pipeline-friendly file execution

## UI Features
- **Syntax highlighting**: Numbers, operators, units, functions, variables, and strings are color-coded
- **History navigation**: Use up/down arrows to navigate through previous calculations
- **Multi-line support**: Press Enter to add new lines to expressions
- **Comments**: Use `#` for inline comments (e.g., `5 * 4 # multiply numbers`)
- **Formatting**: Invalid expressions are treated as comments (gray text), empty lines for organization
- **Clipboard copy**: Ctrl+Y copies the result value with visual feedback (yellow highlight)
- **Configurable precision**: Set decimal places for results via config.yaml