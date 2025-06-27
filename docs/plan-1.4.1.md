# Plan for Version 1.4.1 "Turing-Complete": User-Defined Functions with Future Pipe Support

## Status: COMPLETED ✅

## Overview

Version 1.4.1 introduces user-defined functions to the calculator, making it Turing-complete with support for recursion. The implementation has been designed with future pipe syntax and partial application in mind (planned for v1.4.2).

## Implemented Features

### Function Definition Syntax
Users can now define functions using the syntax:
```calc
functionName(param1, param2, ...) = expression
```

### Examples of Working Functions

#### Basic Functions
```calc
# Simple mathematical functions
double(x) = x * 2
square(x) = x * x
max(a, b) = a > b ? a : b

# Functions with units
to_meters(value) = value to m
velocity(dist, time) = dist / time  # Note: avoid 't' as parameter name

# Type checking functions
is_positive(n) = n > 0
is_even(n) = n % 2 == 0
```

#### Recursive Functions
```calc
# Factorial
fact(n) = n <= 1 ? 1 : n * fact(n - 1)
fact(5)  # Returns 120

# Fibonacci
fib(n) = n <= 1 ? n : fib(n - 1) + fib(n - 2)
fib(10)  # Returns 55

# Greatest Common Divisor
gcd(a, b) = b == 0 ? a : gcd(b, a % b)
gcd(48, 18)  # Returns 6
```

#### Mutual Recursion
```calc
# Even/odd checker using mutual recursion
is_even(n) = n == 0 ? true : is_odd(n - 1)
is_odd(n) = n == 0 ? false : is_even(n - 1)
```

### Key Features Implemented

1. **Function Storage**: Functions are stored as first-class values in the variable map
2. **Parameter Binding**: Function parameters create a new scope that shadows outer variables
3. **Recursion Support**: Functions can call themselves with a configurable depth limit (1000)
4. **Function References**: Functions can be referenced without calling them
5. **Error Handling**: Clear error messages for parameter mismatches and recursion limits

### Technical Implementation

#### New Types
```typescript
// Function information stored in CalculatedValue
interface FunctionInfo {
  name: string;
  parameters: string[];
  body: ASTNode;
  isBuiltin: false;
}

// AST node for function definitions
interface FunctionDefinitionNode {
  type: "functionDefinition";
  name: string;
  parameters: string[];
  body: ASTNode;
}
```

#### Parser Changes
- Variable tokens followed by `(` are now parsed as function calls
- Function definitions are recognized when a function call pattern appears before `=`
- Parameters must be simple variable names

#### Evaluator Changes
- New `evaluateUserFunction` function handles parameter binding and scope creation
- Recursion depth tracking prevents stack overflow
- Function definitions are stored in the variable map

## Known Issues

### Parameter Name Conflicts with Units
There is a known issue where function parameter names that match unit names cause incorrect behavior:

```calc
# BAD: 't' is interpreted as tons unit
bad_func(d, t) = d / t
bad_func(100m, 10s)  # Returns 100 m/t instead of 10 m/s

# GOOD: Use parameter names that don't conflict with units
good_func(dist, time) = dist / time
good_func(100m, 10s)  # Returns 10 m/s correctly
```

Common unit names to avoid as parameters:
- `t` (tons)
- `s` (seconds) 
- `m` (meters/minutes)
- `g` (grams)
- `d` (days)
- `h` (hours)
- `A` (amperes)

## Future Enhancements (v1.4.2)

### Pipe Syntax
```calc
# Future syntax (not yet implemented)
42 | is_positive  # → is_positive(42) → true
100 | divide(10)  # → divide(100, 10) → 10

# Chaining
-5 | abs | is_positive  # → true
```

### Built-in Function Metadata
The implementation has been designed to support future piping by maintaining function arity and parameter order information.

## Testing

Comprehensive tests have been written covering:
- Basic function definition and calling
- Multiple parameters
- Recursive functions (factorial, fibonacci, GCD)
- Mutual recursion
- Function scope isolation
- Error handling
- Type checking functions
- Functions with units
- String manipulation functions

All 17 tests pass successfully.

## Success Metrics

✅ Functions can be defined and called  
✅ Recursion works with proper termination  
✅ Functions are first-class values  
✅ Parameter order is preserved  
✅ Clear error messages  
✅ No breaking changes to existing functionality  
✅ Foundation laid for future pipe syntax  

## Version Notes

This release makes the calculator Turing-complete by adding user-defined functions with recursion support. The implementation has been carefully designed to support future enhancements like pipe syntax and partial application.