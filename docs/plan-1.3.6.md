# Version 1.3.6 Plan: Environment and Arguments

## Overview
Version 1.3.6 introduces environment variable access and command-line argument handling, enabling the calculator to work seamlessly in scripting and pipeline scenarios.

## Key Features

### 1. Environment Variable Access
- `env(name)` function to read environment variables
- Returns string value or null if not found
- Support for type casting: `env("PORT") as number`

### 2. Argument Handling
- `arg()` function with priority: stdin → --arg → null
- Supports JSON, string, and piped input
- Automatic type detection and conversion

### 3. CLI Enhancements
- `--arg` flag for passing arguments
- `-o` / `--output` flag for outputting only last result
- Stdin detection for pipeline usage

## Implementation Tasks

### Phase 1: Core Functions (2 days)
1. **env() Function**
   - Create `src/evaluator/env-arg-functions.ts`
   - Implement `evaluateEnvFunction(node: FunctionNode)`
   - Add ENV token type to tokenizer
   - Support for null returns when env var not found
   - Type casting support

2. **arg() Function**
   - Implement `evaluateArgFunction(node: FunctionNode)`
   - Add ARG token type to tokenizer
   - Store argument value in evaluator context
   - Priority handling: stdin → --arg → null

### Phase 2: CLI Integration (2 days)
3. **Stdin Detection**
   - Check if data is being piped: `!process.stdin.isTTY`
   - Read stdin data asynchronously
   - Parse JSON automatically if valid
   - Pass to evaluator context

4. **CLI Flags**
   - Add `--arg` flag to pass string argument
   - Add `-o` / `--output` flag for last result only
   - Update argument parser in `cli.tsx`
   - Handle flag combinations properly

### Phase 3: Type System (1 day)
5. **Type Conversions**
   - Extend type casting for env/arg results
   - `as number`: Parse strings to numbers
   - `as boolean`: Parse "true"/"false" strings
   - `as object`: Parse JSON strings
   - `as array`: Parse JSON arrays

### Phase 4: Testing & Documentation (1 day)
6. **Tests**
   - Unit tests for env() and arg() functions
   - Integration tests for CLI flags
   - Tests for stdin piping
   - Tests for type conversions
   - Edge cases: missing vars, invalid JSON, etc.

7. **Documentation**
   - Update README with examples
   - Add examples for common use cases
   - Document pipeline usage patterns
   - Update help.ts with new functions

## Usage Examples

### Basic Environment Variables
```calc
# Read environment variable
port = env("PORT") as number
debug = env("DEBUG") as boolean

# With defaults
port = env("PORT") ? env("PORT") as number : 3000
```

### Command Line Arguments
```bash
# String argument
calc script.calc --arg "production"

# JSON argument
calc script.calc --arg '{"mode": "production", "limit": 100}'

# Piped data (takes precedence)
echo '{"users": [{"name": "Alice"}]}' | calc process.calc
```

### In Scripts
```calc
# Access argument
config = arg() as object
mode = arg() ? arg() : "development"

# Check if data was piped
data = arg()
data ? process(data) : "No input provided"
```

### Pipeline Usage
```bash
# Process JSON data
curl -s https://api.example.com/data | calc analyze.calc -o

# Chain calculations
echo '{"price": 100}' | calc tax.calc -o | calc format.calc -o

# With jq
cat data.json | jq '.items[]' | calc transform.calc
```

## Technical Design

### Function Signatures
```typescript
// env() function
function evaluateEnvFunction(name: string): CalculatedValue {
  const value = process.env[name];
  return value !== undefined 
    ? { type: 'string', value } 
    : { type: 'null', value: null };
}

// arg() function
function evaluateArgFunction(context: EvaluationContext): CalculatedValue {
  // Priority: stdin → --arg → null
  if (context.stdinData !== undefined) {
    return parseArgument(context.stdinData);
  }
  if (context.cliArg !== undefined) {
    return parseArgument(context.cliArg);
  }
  return { type: 'null', value: null };
}
```

### Context Extension
```typescript
interface EvaluationContext {
  previousResults?: CalculatedValue[];
  debugMode?: boolean;
  stdinData?: string;  // New: piped stdin data
  cliArg?: string;     // New: --arg value
}
```

### CLI Output Mode
When `-o` or `--output` is specified:
- Only output the final result
- No intermediate calculations shown
- No formatting or colors
- Suitable for piping to other commands

## Testing Strategy

### Unit Tests
- `tests/env-arg-functions.test.ts`
  - env() with existing/missing variables
  - arg() with different input sources
  - Type conversions
  - Error handling

### Integration Tests
- `tests/cli-env-arg.test.ts`
  - CLI flag parsing
  - Stdin piping
  - Output modes
  - Complex pipelines

### E2E Examples
```bash
# Test env access
PORT=3000 calc -e "env('PORT') as number + 1"

# Test arg passing
calc -e "arg()" --arg "hello"

# Test piping
echo "test" | calc -e "arg()"

# Test output mode
echo '{"x": 10}' | calc -e "data = arg() as object; data.x * 2" -o
```

## Success Criteria

1. ✅ env() function reads environment variables correctly
2. ✅ arg() function handles all input sources with correct priority
3. ✅ Type conversions work for common cases
4. ✅ CLI flags are parsed and handled properly
5. ✅ Stdin detection works on all platforms
6. ✅ Output mode produces clean, pipeable output
7. ✅ All tests pass
8. ✅ Documentation is comprehensive
9. ✅ Examples cover common use cases

## Timeline

- Day 1-2: Implement env() and arg() functions
- Day 3-4: CLI integration and flags
- Day 5: Type conversions and edge cases
- Day 6: Testing and documentation
- Day 7: Final review and release

## Release Notes Preview

### Boosted Calculator v1.3.6

**New Features:**
- 🌍 Environment variable access with `env()` function
- 📥 Command-line argument support with `arg()` function
- 🚀 Pipeline-friendly with stdin detection
- 🎯 New CLI flags: `--arg` and `-o/--output`
- 🔄 Type conversions for external data

**Use Cases:**
- Read configuration from environment
- Process JSON data from APIs
- Chain calculations in shell pipelines
- Build data transformation scripts

**Examples:**
```bash
# Use in pipelines
curl -s api.example.com/data | calc process.calc -o

# Pass arguments
calc analyze.calc --arg '{"threshold": 100}'

# Read environment
PORT=3000 calc -e "env('PORT') as number"
```