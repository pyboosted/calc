# Boosted Calculator Features

## Arbitrary Precision Arithmetic (v1.5.0)
- **Decimal.js integration**: All numeric calculations use arbitrary precision
- **No floating point errors**: `0.1 + 0.2 = 0.3` (exactly)
- **Large number support**: Numbers beyond JavaScript's MAX_SAFE_INTEGER
- **Precision preserved**: Through all operations, unit conversions, and currency calculations
- **Configurable display**: Precision setting only affects output formatting

## Basic Mathematics
- **Basic arithmetic**: `+`, `-`, `*`, `/`, `^` (power), `%` (modulo)
- **Word operators**: `plus`, `minus`, `times`, `divided`, `mod`
- **Mathematical functions**: `sqrt`, `cbrt`, `abs`, `log`, `ln`, `fact`, `round`, `ceil`, `floor`
- **Trigonometry**: `sin`, `cos`, `tan`, `arcsin`, `arccos`, `arctan`
- **Hyperbolic**: `sinh`, `cosh`, `tanh`

## Number Formats (v1.5.1)
- **Binary literals**: `0b1010` (10 in decimal), `0b11111111` (255)
- **Hexadecimal literals**: `0xFF` (255), `0x10` (16), `0xDEADBEEF`
- **Format preservation**: Numbers display in their original format until converted
- **Base conversions**:
  - To binary: `10 to binary` → `0b1010`, `255 to bin` → `0b11111111`
  - To hex: `255 to hex` → `0xff`, `16 to hexadecimal` → `0x10`
  - To decimal: `0xFF to decimal` → `255`, `0b1010 to dec` → `10`
  - **Integer-only**: Only integers can be converted to binary/hex (e.g., `3.14 to binary` throws an error)
- **Mixed operations**: `0xFF + 10` → `265`, `0b1010 * 5` → `50`
- **Negative numbers**: `-10 to binary` → `-0b1010`, `-255 to hex` → `-0xff`
- **Note**: Format is lost when combined with units (`0xFF m` → `255 m`)

## Unit Conversions
- **Length, weight, temperature, time, volume, data**
  - Examples: `100 cm in meters`, `32 F in C`, `1 hour in minutes`
- **Compound unit input** (v1.4.7):
  - Space-separated: `1h 30min`, `2kg 300g`, `5ft 6in`
  - Concatenated: `1h30min`, `2kg300g`, `5ft6in`
  - Supports expressions: `100m / (1min 30s)`, `(2h 30min) + (1h 45min)`

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

### Pipe Operator (v1.4.5)
- Pipe values through functions: `[1, 2, 3] | sum` → `6`
- Chain operations: `"  hello  " | trim | len` → `5`
- Works with user functions: `5 | double` → `10`
- Partial application: `[1, 2, 3] | filter(x => x > 1)` → `[2, 3]`
- Unit preservation: `[10m, 20m] | sum` → `30m`

### Compound Assignments
- Works for all types: `x += 5`, `text -= ".txt"`, `arr += [1,2,3]`

## Special Operations

### Previous Result
- Use `prev` to reference the previous line's result (skips empty lines and comments)

### Aggregate Operations
- `total` calculates sum of previous numeric values (stops at empty line or comment)
- String concatenation: `total` concatenates strings when previous results contain strings
- `agg` keyword: Returns array of previous results for piping
- Use `agg | sum` for sum of previous results (replaces old `sum` aggregate)
- Use `agg | avg` or `agg | average` for average of previous results (replaces old `avg`/`average` aggregates)

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
- **String functions**:
  - **Length & Access**: `len`, `substr`, `charat`
  - **Case Transformation**: `uppercase`/`upper`, `lowercase`/`lower`, `capitalize`
  - **Trimming**: `trim`
  - **Checking**: `startswith`, `endswith`, `includes`/`contains`
  - **Manipulation**: `replace`, `replaceall`, `split`, `join`, `reverse`
  - **Padding**: `padleft`/`padstart`, `padright`/`padend`
  - **Finding**: `indexof`, `lastindexof`
  - **Formatting**: `format` (for dates)
- **Escape sequences**: `\n`, `\t`, `\\`, `` \` ``

## Boolean Operations (v1.3.1)
- **Boolean literals**: `true`, `false`, `null`
- **Comparison operators**: `==`, `!=`, `<`, `>`, `<=`, `>=`
- **Logical operators**: `and`, `or`, `not`
- **Ternary operator**: `condition ? true : false`
- **Nullish coalescing operator** (v1.4.5): `null ?? default` - returns right operand only when left is null (not other falsy values)
- **Type casting**: `as boolean`

## Arrays and Objects (v1.3.2)
- **Array literals**: `[1, 2, 3]`, nested arrays, mixed types
- **Object literals**: `{a: 1, b: 2}`, nested objects, string keys
- **Array functions**: 
  - Non-mutating: `push`, `pop`, `shift`, `unshift`, `append`, `prepend`, `first`, `last`, `slice`, `length`, `find`, `findIndex`
  - Mutating (with `!` suffix): `push!`, `pop!`, `shift!`, `unshift!`, `append!`, `prepend!`, `slice!`, `filter!`, `map!`
  - Aggregation: `sum`, `avg`/`average` (work with numbers and quantities with units)
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
- **Smart time formatting**: Fractional time values display in compound format (e.g., `2.5 hours` → `2h 30min`)
  - Weeks are skipped in compound format unless the base unit is weeks
  - Whole numbers stay in their original unit (e.g., `150 minutes` stays as is)

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

## Markdown Support (v1.5.3)
- **Enabled by default**: Invalid expressions are rendered as formatted markdown text
- **Supported syntax**:
  - **Bold text**: `**text**` or `__text__`
  - **Italic text**: `*text*` or `_text_`
  - **Inline code**: `` `code` ``
  - **Code blocks**: ``` with optional language identifier
  - **Links**: `[text](url)`
  - **Strikethrough**: `~~text~~`
- **Disable markdown**: Use `--md=false` or `--markdown=false` flags
- **Config option**: Set `markdownSupport: false` in config.yaml to disable permanently