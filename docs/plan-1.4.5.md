# Plan for v1.4.5 "Mario" - Pipe Operator and Functional Composition

## Overview

Version 1.4.5 introduces the pipe operator (`|`) for functional composition, enabling a more fluent programming style. This release is codenamed "Mario" because like Mario traveling through pipes, data flows through function pipelines.

## Key Features

### 1. Pipe Operator (`|`)

The pipe operator takes a value on the left and applies it as the first argument to the function on the right:

```calc
# Basic piping
[1, 2, 3, 4, 5] | filter(x => x > 3) | sum  # Returns 9

# With user-defined functions
double(x) = x * 2
square(x) = x * x
5 | double | square  # Returns 100

# With built-in functions
"  hello world  " | trim | len  # Returns 11
```

### 2. Partial Application

When a function expects multiple arguments but receives fewer via piping, it returns a partially applied function:

```calc
# Define a function with multiple parameters
add(a, b) = a + b
subtract(a, b) = a - b

# Partial application
add5 = add(5)  # or: 5 | add
[1, 2, 3] | map(add5)  # Returns [6, 7, 8]

# More complex example
myfunc(arr, test) = sum(arr) - test
[1, 2, 3] | myfunc(3)  # Returns 3 (sum=6, minus 3)
```

### 3. Aggregate Functions Refactor

Convert aggregate keywords (`sum`, `avg`, `average`) into regular functions while maintaining backward compatibility:

```calc
# Old style (still works)
100 eur
200 eur
300 usd
total  # Aggregate keyword

# New style with pipe
100 eur
200 eur
300 usd
result = agg | sum  # Using agg keyword to get array of previous results

# Direct array usage
expenses = [100 eur, 200 eur, 300 usd]
total = expenses | sum
average_expense = expenses | avg
```

## Implementation Details

### Phase 1: Pipe Operator Parsing

1. **Tokenizer Changes** (`src/parser/tokenizer.ts`):
   - Modify operator configuration to treat `|` as a single character operator
   - Ensure `||` is handled separately for logical OR

2. **Parser Changes** (`src/parser/parser.ts`):
   - Add pipe operator with precedence between conversion (`to`, `in`) and additive (`+`, `-`)
   - Parse `a | b` as equivalent to `b(a)`
   - Support chaining: `a | b | c` becomes `c(b(a))`

3. **AST Transformation**:
   - Transform pipe expressions into function call nodes
   - Handle both simple identifiers and partial applications on the right side

### Phase 2: Partial Application Support

1. **Type System Extension** (`src/types/index.ts`):
   ```typescript
   // New CalculatedValue type
   type PartiallyAppliedFunction = {
     type: 'partial';
     value: {
       func: FunctionInfo | LambdaInfo;
       appliedArgs: CalculatedValue[];
       remainingParams: string[];
     };
   };
   ```

2. **Parser Enhancement**:
   - When parsing function calls, detect partial application scenarios
   - Create partial application nodes when fewer arguments than parameters

3. **Evaluator Support** (`src/evaluator/evaluate.ts`):
   - Evaluate partial application nodes by capturing provided arguments
   - Return a new function that combines captured and future arguments

### Phase 3: Aggregate Function Migration

1. **New Built-in Functions** (`src/evaluator/array-functions.ts`):
   - Implement `sum(array)` and `avg(array)` as regular functions
   - Ensure they work with arrays of quantities (with units)

2. **Context-Aware Parsing**:
   - Distinguish between `sum` as a function call vs aggregate keyword
   - Maintain backward compatibility for existing scripts

3. **Documentation Updates**:
   - Update examples to show both old and new styles
   - Explain the transition path for users

## Technical Considerations

### Operator Precedence

The pipe operator will have precedence between conversion and additive operators:

1. Assignment (`=`)
2. Ternary (`? :`)
3. Logical OR (`or`, `||`)
4. Logical AND (`and`, `&&`)
5. Comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`)
6. Conversion (`to`, `in`, `as`, `is`)
7. **Pipe (`|`)** ← New
8. Additive (`+`, `-`)
9. Multiplicative (`*`, `/`, `%`)
10. Exponential (`^`)
11. Unary (`-`, `+`, `not`)
12. Postfix (units, percentages)

### Edge Cases

1. **Piping to non-functions**:
   ```calc
   5 | 10  # Error: 10 is not a function
   ```

2. **Piping with lambdas**:
   ```calc
   [1, 2, 3] | (arr => sum(arr) * 2)  # Should work
   ```

3. **Nested pipes**:
   ```calc
   data | (x => x | filter(isPositive) | sum)  # Inner pipes in lambda
   ```

4. **Unit preservation**:
   ```calc
   [10m, 20m, 30m] | sum  # Returns 60m
   [10m, 20ft] | sum | to ft  # Handles unit conversion
   ```

## Testing Strategy

1. **Parser Tests** (`tests/parser.test.ts`):
   - Pipe operator precedence
   - Chaining multiple pipes
   - Pipe with various expression types

2. **Evaluator Tests** (`tests/evaluator.test.ts`):
   - Basic piping functionality
   - Partial application scenarios
   - Error handling for non-functions

3. **Integration Tests** (`tests/pipe-operator.test.ts`):
   - Complex pipelines with built-in and user functions
   - Unit preservation through pipes
   - Aggregate function compatibility

4. **Backward Compatibility Tests**:
   - Ensure existing aggregate keywords still work
   - Verify logical OR (`||`) still functions correctly

## Migration Guide

For users transitioning from aggregate keywords to piped functions:

### Before (v1.4.4 and earlier):
```calc
100
200
300
total  # 600
avg    # 200
```

### After (v1.4.5):
```calc
# Option 1: Traditional style (still supported)
100
200
300
total  # 600

# Option 2: Functional style
values = [100, 200, 300]
values | sum  # 600
values | avg  # 200

# Option 3: Using agg keyword
100
200
300
result = agg | sum  # 600
```

## Future Enhancements

1. **Function Composition Operator**:
   ```calc
   # Possible future syntax
   processData = filter(isValid) >> map(normalize) >> sum
   [1, 2, 3] | processData
   ```

2. **Method-like Syntax** (considered but not implemented):
   ```calc
   # We explicitly chose NOT to implement this
   # to maintain functional purity
   arr.filter(x => x > 0)  # Not supported
   ```

3. **Pipeline Debugging**:
   ```calc
   # Possible future feature
   data | tap(console) | filter(isValid) | tap(console) | sum
   ```

## Release Notes

### Breaking Changes
- None. All existing functionality remains intact.

### New Features
- Pipe operator (`|`) for function composition
- Partial application support for all functions
- `sum` and `avg` now work as both aggregate keywords and array functions

### Improvements
- More functional programming capabilities
- Cleaner syntax for data transformations
- Better integration between different function types

## Conclusion

Version 1.4.5 "Mario" brings powerful functional programming features to the calculator while maintaining its ease of use and backward compatibility. The pipe operator enables intuitive data flow expressions that read naturally from left to right, making complex calculations more understandable and maintainable.