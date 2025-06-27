# Roadmap: Enhanced Calculator with Advanced Features

## Overview
This roadmap outlines the evolution of the calculator, reflecting both completed features and future enhancements.

### Note on v1.4.0
The original roadmap planned async features for v1.4.0, but we pivoted to implement dimensional analysis instead. This decision was driven by the immediate value of supporting scientific and engineering calculations with proper unit handling. The async features have been moved to v1.5.0.

### Completed Releases:
- **v1.3.0-v1.3.9**: Foundation - Strings, objects, booleans, type system, env/args, type checking
- **v1.4.0**: Dimensional Analysis - Complete overhaul to support compound units and physics calculations

### Future Releases:
- **v1.5.0**: Async & Integration - Shell execution, file execution, async evaluation
- **v1.6.0**: Custom Functions - User-defined functions from .mjs files

### Command Line Usage
```bash
# Run with JSON argument
calc script.calc --arg '{"mode": "production", "limit": 100}'

# Run with simple string argument  
calc script.calc --arg "production"

# Pipe data from stdin (takes precedence over --arg)
echo '{"users": [{"name": "Alice"}]}' | calc process.calc
curl -s https://api.example.com/data | calc analyze.calc
cat data.json | jq '.items[]' | calc transform.calc

# Run without arguments
calc script.calc

# Output only the last result (for pipelines)
echo '{"price": 100}' | calc tax.calc -o | calc format.calc -o
calc process.calc --output > result.json
```

## Current Capabilities (v1.4.0)
```calc
# String operations
separator = "=" * 50
filename = "report_2025.txt" - ".txt"  # "report_2025"
greeting = `Hello, ${user_name}!`

# Arrays and objects
data = {users: [{name: "Alice", age: 30}, {name: "Bob", age: 25}]}
ages = [30, 25, 35, 28]
avg(ages)  # 29.5

# Dimensional analysis and physics
velocity = 100m / 10s                   # 10 m/s
velocity to km/h                        # 36 km/h
force = 5kg * 2 m/s²                    # 10 N
energy = force * 10m                    # 100 J
power = energy / 5s                     # 20 W

# Environment and arguments
port = env("PORT") as number
config = arg() as object

# Type checking
100 is number                           # true
velocity is quantity                    # true
10 N is force                          # true
```

## Future Capabilities (v1.5.0+)
```calc
# Shell execution (planned)
names = shell("jq -r '.users[].name'", data as json)  # "Alice\nBob"
sorted_csv = shell("sort -t, -k2 -n", "name,age\nAlice,30\nBob,25")

# File operations via shell
config = shell("cat config.json") as object
exists = shell("test -f data.csv && echo true || echo false") as boolean
lines = shell("wc -l < data.csv") as number

# Get current date formatted
date_str = format(today, "dd.MM.yyyy")

# Build request object - multi-line style
request = {}
request.date = date_str
request.filters = ["active", "pending"]  # Native array type
request.limit = 100

# Or use inline object literal
request = {
  date: date_str,
  filters: ["active", "pending"],
  limit: 100
}

# Convert object to JSON string
json_payload = request as json

# Fetch API with shell command - two ways
# Option 1: Interpolate in command
response = shell(`curl -X POST https://api.example.com/data \
  -H "Content-Type: application/json" \
  -d '${json_payload}'`)

# Option 2: Use stdin (cleaner, avoids escaping)
response = shell(`curl -X POST https://api.example.com/data \
  -H "Content-Type: application/json" \
  -d @-`, json_payload)

# Parse JSON response (preserves all JSON types)
result = response as object
data = result.deep.value.result

# Access nested properties and array elements
data.items.0.name
data.items.1.value
data.items.2.active  # boolean: true/false
data.items.3.deleted  # could be null

# Working with arrays
numbers = [10, 20, 30]
first(numbers)          # 10
last(numbers)           # 30
numbers = push(numbers, 40)  # [10, 20, 30, 40]
sum(numbers)            # 100
avg(numbers)            # 25
length(numbers)         # 4

# Dynamic property access with brackets
key = "name"
value = data[key]       # Same as data.name

index = 2
item = numbers[index]   # 30 - third element

# Loop-like processing
i = 0
total = 0
total = total + numbers[i]      # Dynamic access
total = total + numbers[i + 1]  # Can use expressions

# Aggregate operations work like "total" keyword
prices = [10.50, 25.00, 15.75]
sum(prices)             # 51.25
avg(prices)             # 17.08...

# Boolean operations and comparisons
is_valid = true
is_active = data.status == "active"  # comparison returns boolean
should_process = is_valid and is_active
is_different = old_value != new_value
in_range = value >= 10 and value <= 100

# Ternary operator for conditional logic
env_type = env("NODE_ENV")
config = env_type == "production" ? exec("./prod.calc") : exec("./dev.calc")
port = env("PORT") ? env("PORT") as number : 3000
message = errors > 0 ? `Found ${errors} errors` : "All good!"

# Type conversions with booleans
flag = "false" as boolean  # false
count = true as number     # 1
empty = null as boolean    # false

# Environment and arguments  
api_key = env("API_KEY")
port = env("PORT") as number  # Convert string env var to number

# Command line arguments (arg() returns stdin if piped, else --arg value)
# Run: calc script.calc --arg '{"mode": "production", "limit": 100}'
# Or pipe: echo '{"mode": "production"}' | calc script.calc
args = arg() as object
mode = args.mode
limit = args.limit

# Or simple string: calc script.calc --arg "production"
# Or pipe: echo "production" | calc script.calc
env_name = arg()  # "production"

# Execute another calc file with inline object
output = exec("./process.calc", {limit: 100, filter: "active"})

# Or build object separately
args = {}
args.limit = 100
args.filter = "active"
output = exec("./process.calc", args)

# Pipeline example: process data from jq
# Run: kubectl get pods -o json | jq '.items[]' | calc pod-analyzer.calc
pod_data = arg() as object
pod_name = pod_data.metadata.name
pod_status = pod_data.status.phase

# Process with jq using stdin
pod_json = pod_data as json
container_names = shell("jq -r '.spec.containers[].name'", pod_json)

# When using -o flag, only the last expression is output
# Make sure to end with the value you want to pipe
result = {name: pod_name, status: pod_status, healthy: pod_status == "Running"}
result as json  # This gets output with -o flag

# Conditional async execution (only waits if needed)
should_refresh = cache_age > 3600
data = should_refresh ? shell(`curl https://api.example.com/data`) : cached_data

# Testing async behavior
delay1 = wait(1000, "test1")  # 1 second wait, returns 1
delay2 = wait(2000, "test2")  # 2 second wait, returns 1
total = delay1 + delay2  # Shows pending until both complete

# Debouncing example
api_key = env("API_KEY")
# While typing the URL below, dependent lines show [stale]
# Re-evaluation triggers 500ms after stopping or when leaving line
result = shell(`curl https://api.example.com/data?key=${api_key}`)
parsed = result as object  # Shows [stale] while editing above line

# File execution caching
# The file is loaded once and cached until 'restart'
config = exec("./config.calc")
# Changing args triggers re-evaluation but uses cached file
limit = 50
results = exec("./process.calc", {limit: limit})

# Custom functions (v1.5.0)
# Load with: calc --functions ~/.config/calc/functions.mjs
# Functions defined in JS/TS with full Node.js access
json_data = readJSON("./data.json")  # Sync custom function
api_data = fetchAPI("https://api.example.com/data")  # Async custom function
csv = parseCSV(shell("cat data.csv"))  # Process data with custom parser
```

## 1. Core Type System Changes

### 1.1 CalculatedValue as Discriminated Union
```typescript
type CalculatedValue = 
  | { type: 'number'; value: number; unit?: string }
  | { type: 'string'; value: string }
  | { type: 'array'; value: CalculatedValue[] }
  | { type: 'object'; value: Map<string, CalculatedValue> }
  | { type: 'date'; value: Date; timezone?: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: null }
  | { type: 'pending'; promise: Promise<CalculatedValue>; dependencies?: string[] };
```

Arrays and objects are separate types with distinct behaviors and optimizations.

This allows type narrowing:
```typescript
switch (result.type) {
  case 'number':
    // TypeScript knows result.value is number
    return result.value * 2;
  case 'string':
    // TypeScript knows result.value is string
    return result.value.toUpperCase();
  case 'array':
    // TypeScript knows result.value is CalculatedValue[]
    return result.value[index];
  case 'object':
    // TypeScript knows result.value is Map<string, CalculatedValue>
    return result.value.get(property);
  case 'boolean':
    // TypeScript knows result.value is boolean
    return result.value ? 1 : 0;  // Convert to number for math
  case 'null':
    // TypeScript knows result.value is null
    return null;
}
```

### 1.2 New Token Types
- `STRING_LITERAL` - for string literals in backticks
- `DOT` - for object property access
- `LBRACE`, `RBRACE` - for object literals
- `LBRACKET`, `RBRACKET` - for array literals and bracket property access
- `COLON` - for key-value pairs in object literals
- `AS` - for type casting operator
- `TRUE`, `FALSE` - for boolean literals
- `NULL` - for null literal
- `QUESTION`, `COLON` (reused) - for ternary operator
- Comparison operators: `==`, `!=`, `<`, `>`, `<=`, `>=`

### 1.3 New AST Node Types
```typescript
interface StringNode {
  type: "string";
  value: string;
  interpolations?: { position: number; expression: ASTNode }[];
}


interface ArrayNode {
  type: "array";
  elements: ASTNode[];
}

interface ObjectNode {
  type: "object";
  properties: Map<string, ASTNode>;  // For {key: value} syntax
}


interface PropertyAccessNode {
  type: "propertyAccess";
  object: ASTNode;
  property: string;
}

interface TypeCastNode {
  type: "typeCast";
  expression: ASTNode;
  targetType: "json" | "string" | "number" | "boolean" | "object";
}

interface BooleanNode {
  type: "boolean";
  value: boolean;
}

interface NullNode {
  type: "null";
}

interface TernaryNode {
  type: "ternary";
  condition: ASTNode;
  trueExpr: ASTNode;
  falseExpr: ASTNode;
}

interface PendingNode {
  type: "pending";
  promise: Promise<CalculatedValue>;
  dependencies: string[];
}
```

## 2. Tokenizer Updates

### 2.1 String Literal Tokenization
- Recognize backtick strings with interpolation support
- Parse `${expression}` within strings
- Handle escaped characters (\n, \t, \\, \`)


### 2.3 Object and Array Syntax and Type Casting
- Add `.` token for property access
- Add `{` and `}` for object literals
- Add `[` and `]` for array literals and index access
- Add `:` token for key-value pairs in objects
- Add `as` keyword for type casting

## 3. Parser Updates

### 3.1 String Expression Parsing
- Parse string literals with interpolations
- Handle string concatenation with `+` operator
- Support multiline strings


### 3.2 Array and Object Literal Parsing
Arrays:
- Empty arrays: `[]`
- Simple arrays: `[1, 2, 3]`
- Mixed types: `[1, "hello", true]`
- Nested arrays: `[[1, 2], [3, 4]]`

Objects:
- Empty objects: `{}`
- Inline syntax: `{key: value, key2: value2}`
- Nested objects: `{outer: {inner: value}}`
- Mixed numeric/string keys: `{0: "first", name: "test"}`

### 3.3 Property and Index Access
Object property access:
- Parse `object.property` chains (static access)
- Support nested access: `obj.deep.value`
- Bracket notation for dynamic access: `obj[key]`, `obj["prop"]`

Array index access:
- Bracket notation: `array[0]`, `array[index]`
- Support negative indices: `array[-1]` (last element)
- Mixed access: `data.users[0].name`, `matrix[i][j]`

### 3.4 Type Casting
- Parse `expression as type` syntax
- Support casting to: json, string, number, boolean, object

### 3.5 Ternary Operator
- Parse `condition ? true_expr : false_expr`
- Handle nested ternaries with proper precedence
- Support any expression type in all positions

## 4. Evaluator Changes

### 4.1 Async Evaluation
```typescript
async function evaluateNode(
  node: ASTNode, 
  variables: Map<string, CalculatedValue>,
  context: EvaluationContext
): Promise<CalculatedValue>
```

### 4.2 String Operations
- String concatenation with `+`: `"hello" + " " + "world"`
- String multiplication with `*`: `"=" * 10` → `"=========="`
- String subtraction with `-`: `"filename.txt" - ".txt"` → `"filename"`
- String interpolation evaluation: `\`User: ${name}, Age: ${age}\``
- Escape sequence handling (\n, \t, \\, \`)
- Type conversions: `as string`, `as number`

### 4.3 Boolean and Comparison Operations
- Comparison operators return booleans:
  - Equality: `==`, `!=` (works with all types)
  - Ordering: `<`, `>`, `<=`, `>=` (numbers, strings, dates)
- Logical operators with short-circuit evaluation:
  - `and`: returns first falsy or last value
  - `or`: returns first truthy or last value
  - `not`: returns boolean negation
- Ternary operator with lazy evaluation:
  - Only evaluates the selected branch
  - Handles async: if condition is pending, result is pending

### 4.4 Shell Execution
```typescript
async function executeShellCommand(command: string, stdin?: string): Promise<CalculatedValue> {
  // Use child_process.spawn with proper escaping
  // Write stdin to process if provided
  // Timeout after 30 seconds by default
  // Return string output or error
}
```
- Optional stdin parameter for piping data into commands
- Avoids shell escaping issues with data
- Natural for Unix tools: `shell("jq '.name'", data as json)`

### 4.5 JSON and Object/Array Operations
- Array literal evaluation: `[1, 2, 3]` creates native arrays
- Object literal evaluation: `{}` creates Map-based objects
- Property and index access:
  - Object property: `obj.prop`, `obj[key]`
  - Array index: `arr[0]`, `arr[index]`
  - Mixed: `data.users[i].properties.name`
- Array operations: `push()`, `pop()`, `first()`, `last()`, `sum()`, `avg()`
- Object operations: `keys()`, `values()`, `has()`
- Boolean and null literals: `true`, `false`, `null`
- Type casting operations:
  - `as json` or `as string` - converts any type to JSON string
  - `as object` - parses JSON strings to objects
  - `as array` - parses JSON strings to arrays
  - `as number` - converts strings/booleans to numbers
  - `as boolean` - converts values to booleans (0/""/null/false → false)
- JSON parsing preserves types: numbers, strings, booleans, null, arrays, objects
- JSON stringification handles all types:
  - `[1, 2, 3] as json` → `"[1,2,3]"`
  - `{active: true} as json` → `'{"active":true}'`

### 4.6 New Built-in Functions
```typescript
// Environment and arguments
env(name: string): string | null
arg(): string | null  // Returns stdin if piped, else --arg value, else null

// Date/time formatting
format(date: Date, pattern: string): string
format(number: number, pattern: string): string  // Future enhancement

// Shell execution
shell(command: string, stdin?: string): Promise<string>  // Execute shell command with optional stdin

// Async testing
wait(ms: number, seed: any): Promise<1>  // Always returns 1 after delay

// File execution
exec(path: string, args?: object): Promise<CalculatedValue>

// Array helpers
push(arr: array, value: any): any    // Mutates array and returns the added value
pop(arr: array): array  // Returns new array without last element
first(arr: array): any  // Returns first element
last(arr: array): any  // Returns last element
length(arr: array | string): number  // Length of array or string
sum(arr: array): number  // Sum of numeric values
avg(arr: array): number  // Average of numeric values
slice(arr: array, start: number, end?: number): array  // Returns sub-array

// Object helpers
keys(obj: object): array  // Returns array of property names
values(obj: object): array  // Returns array of property values
has(obj: object, key: string): boolean  // Check if property exists
```

## 5. UI and State Management Updates

### 5.1 LineState Enhancement
```typescript
interface LineState {
  id: string;
  content: string;
  result: CalculatedValue | null;
  error: string | null;
  isComment: boolean;
  assignedVariables?: Map<string, CalculatedValue>;
  isPending?: boolean;
  isStale?: boolean;  // True when dependencies changed but not re-evaluated yet
  dependencies?: Set<string>;
  asyncOperationId?: string; // For cancellation
  lastEvaluatedAt?: number; // Timestamp for cache management
}
```

### 5.2 Dependency Tracking
```typescript
class DependencyGraph {
  // Track which variables are used by which lines
  private variableUsers: Map<string, Set<string>>; // var -> line IDs
  
  // Track which variables are defined by which lines
  private variableDefiners: Map<string, string>; // var -> line ID
  
  // Get all lines that need re-evaluation when a variable changes
  getAffectedLines(changedVar: string): string[]
}
```

### 5.3 Result Display
- Show type indicators: `[string]`, `[object]`, `[pending...]`
- Show stale indicator: `[stale]` or grayed-out result
- Pretty-print objects and arrays
- Show truncated preview for large results
- Pending indicator with spinner
- Visual distinction between stale, pending, and current results

## Completed Implementation

### Release 1.3.0-1.3.9 - Foundation ✅
All foundation features have been successfully implemented:
- String support with interpolation
- Boolean operations and comparisons
- Arrays and objects with full property access
- Environment variables and command-line arguments
- Type checking with `is` keyword
- Compound assignments (+=, -=)

### Release 1.4.0 - Dimensional Analysis ✅
Complete overhaul of the unit system:
- Dimensional tracking with exponents
- Compound unit parsing (m/s, kg⋅m/s², etc.)
- Physics units (N, J, W, Hz, Pa)
- Smart unit conversion and simplification
- Type-safe unit definitions

## Future Implementation Steps

### Release 1.5.0 - Async & Integration
Target: 2-3 weeks

#### Phase 1: Async Infrastructure
1. Convert evaluator to async/await
2. Add pending state to LineState
3. Implement dependency tracking with debounced re-evaluation:
   - Mark dependent lines as "stale" immediately on edit
   - Debounce actual re-evaluation (e.g., 500ms after last keystroke)
   - Trigger re-evaluation when:
     - Debounce timer expires
     - User moves to another line (blur event)
   - Show "stale" indicator while waiting for re-evaluation
4. Update UI for pending and stale indicators
5. Add result caching for completed async ops
6. Implement `wait(ms, seed)` function for async testing:
   - Always returns 1 after specified milliseconds
   - Caches result based on (ms, seed) pair
   - Re-evaluates only when ms or seed changes
   - Shows pending state during wait

#### Phase 2: Shell Execution
1. Implement `shell(command, stdin?)` function for command execution
2. Support string interpolation in shell commands
3. Add optional stdin parameter for piping data
4. Add timeout and resource limits
5. Handle stdout/stderr/exit codes
6. Add shell command history and caching

#### Phase 3: File Execution
1. Implement `exec()` function with isolation
2. Add file content caching:
   - Cache loaded file contents in memory
   - Reuse cached content across evaluations
   - Clear cache only on `restart` command
   - Track file dependencies for circular detection
3. Add recursive file execution limits
4. Handle circular dependencies
5. Implement variable scope isolation between files
6. Add file path validation and security
7. Implement `restart` command to clear all caches

#### Phase 4: UI Polish and Testing
1. Add progress indicators for long operations
2. Implement operation cancellation
3. Add comprehensive error messages
4. Write integration tests
5. Performance optimization

### Release 1.6.0 - Custom Functions
Target: 1-2 weeks after 1.5.0

#### Phase 1: Custom Functions Support
1. Implement dynamic import for `.mjs` files
2. Add `--functions` CLI flag for specifying function file
3. Add functions path to config file options
4. Create function registry and lookup system
5. Handle both sync and async custom functions
6. Add error handling and validation
7. Write documentation and examples
8. Security considerations for loaded code

## 7. Custom Functions (v1.5.0)

### Function File Format
Custom functions are defined in ESM modules (`.mjs` files):

```javascript
// ~/.config/calc/functions.mjs
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

// Synchronous function - no pending state in calc
export function readJSON(path) {
  const content = readFileSync(path, 'utf8');
  return JSON.parse(content);
}

// Asynchronous function - shows pending in calc
export async function fetchAPI(url, options = {}) {
  const response = await fetch(url, options);
  return response.json();
}

// Return calc-compatible types
export function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  
  // Return array of row objects
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j];
    });
    result.push(row);
  }
  return result;
}

// Access calc's type conversions
export function processData(data) {
  // Functions can return any JSON-serializable data
  return {
    count: Object.keys(data).length,
    hasData: Object.keys(data).length > 0
  };
}
```

### Loading Functions
```bash
# Via CLI flag
calc script.calc --functions ~/.config/calc/functions.mjs

# Via config file (~/.config/boomi/config.yaml)
functions_path: ~/.config/calc/functions.mjs

# Multiple function files (future enhancement)
calc script.calc --functions utils.mjs --functions api.mjs
```

### Usage in Calc
```calc
# Functions appear as built-ins
config = readJSON("./config.json")
data = fetchAPI("https://api.example.com/data")

# Can be used in expressions
total = sum(parseCSV(shell("cat sales.csv")).*.amount)

# Work with all calc features
result = cache_expired ? fetchAPI(url) : cached_data
```

## 8. Security Considerations

### Shell Execution Safety
```typescript
const SHELL_OPTIONS = {
  timeout: 30000, // 30 second default
  maxBuffer: 10 * 1024 * 1024, // 10MB output limit
  env: { ...process.env, CALC_SHELL: "true" },
  shell: true
};

// Validate commands before execution
function validateShellCommand(cmd: string): void {
  // Check for dangerous patterns
  const dangerous = /(\||&&|;|`|\$\()/;
  if (dangerous.test(cmd)) {
    // Require user confirmation in interactive mode
  }
}
```

### File Access Restrictions
- Only allow relative paths from current directory
- Prevent access to parent directories (`../`)
- Max recursion depth for exec()
- Isolated variable scopes between files

### File Caching Strategy
```typescript
class FileCache {
  private cache: Map<string, string> = new Map();
  
  load(path: string): string {
    if (!this.cache.has(path)) {
      this.cache.set(path, readFileSync(path, 'utf-8'));
    }
    return this.cache.get(path);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```
- Files are read once and cached in memory
- External file changes are not detected automatically
- Use `restart` command to clear all caches and reload files
- Prevents file system thrashing during re-evaluations

## 8. Testing Strategy

### Unit Tests
- String interpolation edge cases
- Object property access with missing keys
- Type casting validation
- JSON parsing errors

### Integration Tests
- Async evaluation flow
- Shell command with interpolation
- File execution with arguments
- Dependency re-evaluation

### Performance Tests
- Large object handling
- Multiple pending operations
- Deep property access chains
- Recursive file execution

## 9. Migration Guide

### Breaking Changes
- None - existing numeric calculations work identically

### New Features to Document
- String syntax with backticks and interpolation
- Object creation with `{}` and lodash-style access
- Shell command execution with `shell()` function
- Type casting with `as` operator
- New built-in functions: `env()`, `arg()`, `format()`, `exec()`, `wait()`, `shell()`
- `restart` command to clear all caches
- File execution with argument passing
- Command-line arguments via `--arg` flag or stdin piping
- Pipeline mode with `-o`/`--output` flag for composable scripts

## Release Summary

### v1.3.0-v1.3.9 - Foundation Release ✅ COMPLETED
- **String support**: Backtick strings with interpolation, operations (+, *, -)
- **Object support**: Object literals `{}`, array syntax `[]`, dot and bracket notation
- **Type system**: Booleans, null, type casting with `as`, ternary operator `? :`
- **Comparison operators**: `==`, `!=`, `<`, `>`, `<=`, `>=`
- **Array functions**: `format()`, `push()`, `first()`, `last()`, `sum()`, `avg()`, `length()`
- **Environment integration**: `env()` function, `arg()` with stdin/--arg support
- **Pipeline mode**: `-o` flag for composable scripts
- **Type checking**: `is` keyword for type validation (v1.3.9)
- **No breaking changes**: Full backward compatibility

### v1.4.0 - Dimensional Analysis Release ✅ COMPLETED
- **Dimensional analysis**: Full support for compound units (m/s, kg⋅m/s², etc.)
- **Physics units**: N (Newton), J (Joule), W (Watt), Hz (Hertz), Pa (Pascal)
- **Smart unit conversion**: Works with compound units (60 km/h to m/s)
- **Unit arithmetic**: Dimensions multiply, divide, and cancel properly
- **Automatic simplification**: Recognizes derived units (kg⋅m/s² → N)
- **Breaking change**: Removed old unit system in favor of dimensional analysis

### v1.5.0 - Async & Integration Release (Future)
- **Async evaluation**: Pending states, dependency tracking, debouncing
- **Shell execution**: `shell(cmd, stdin?)` function
- **File execution**: `exec(path, args?)` with caching
- **Testing utilities**: `wait()` function for async debugging
- **Advanced features**: Stale indicators, operation cancellation
- **Performance**: Smart caching and lazy evaluation

### v1.6.0 - Custom Functions Release (Future)
- **Custom JavaScript functions**: Load user-defined functions from `.mjs` files
- **Full Node.js API access**: Use fs, fetch, crypto, etc. in custom functions
- **Sync and async support**: Define both synchronous and asynchronous functions
- **Configuration**: `--functions` flag or config file setting
- **Security**: Controlled execution environment

This roadmap transforms the calculator into a powerful scripting environment while maintaining full backward compatibility and adding type safety through discriminated unions.

## Next Steps

### Immediate Priorities (v1.5.0)
1. **Shell Integration**: The `shell()` function will enable powerful data processing pipelines
2. **File Execution**: The `exec()` function will allow modular calculator scripts
3. **Async UI**: Pending states and dependency tracking for better UX

### Future Considerations
1. **Vector/Matrix Operations**: Building on dimensional analysis for linear algebra
2. **Uncertainty Propagation**: Error bars and confidence intervals
3. **Data Visualization**: Simple charts in the terminal
4. **Import/Export**: CSV, JSON, Excel integration

The pivot to dimensional analysis in v1.4.0 opened up new possibilities for scientific computing that we should continue to explore alongside the scripting capabilities.