# Plan for Version 1.4.3: Lambda Functions and Pipeline Operations

## Overview
Version 1.4.3 will introduce lambda expressions and higher-order array functions (filter, reduce, map, sort, groupBy), building on the existing function infrastructure from v1.4.1.

## Key Features

### 1. Lambda Expression Syntax
Lambdas use arrow syntax (`=>`) with explicit parameters:
- Single parameter: `i => expression`
- Multiple parameters: `(a, b) => expression` or `a, b => expression`
- Access to nested fields: `i => i.field.value`

Examples:
```calc
filter(arr, i => i > 0)
reduce(arr, (acc, i) => acc + i, 0)
map(arr, i => i.field.value)
sort(arr, (a, b) => a - b)
groupBy(arr, i => i.field)
```

### 2. New Built-in Functions

#### filter(array, predicate)
- Returns new array with elements where predicate is truthy
- Lambda receives: `i` (current item)
- Example: `filter([1, -2, 3, -4], i => i > 0) → [1, 3]`

#### reduce(array, lambda, initial)
- Reduces array to single value using accumulator
- Lambda receives: `acc` (accumulator), `i` (current item)
- Example: `reduce([1, 2, 3], (acc, i) => acc + i, 0) → 6`

#### map(array, lambda)
- Transforms each element
- Lambda receives: `i` (current item)
- Example: `map([1, 2, 3], i => i * 2) → [2, 4, 6]`

#### sort(array, comparator)
- Sorts using comparator function (like JavaScript)
- Lambda receives: `a`, `b` (two items to compare)
- Should return: negative for a<b, positive for a>b, 0 for equal
- Example: `sort([3, 1, 4], (a, b) => a - b) → [1, 3, 4]`
- Example: `sort(["c", "a", "b"], (a, b) => a > b ? 1 : a < b ? -1 : 0) → ["a", "b", "c"]`

#### groupBy(array, lambda)
- Groups elements by lambda result
- Lambda receives: `i` (current item)
- Returns object with keys as group values
- Example: `groupBy([{type: "a", val: 1}, {type: "b", val: 2}, {type: "a", val: 3}], i => i.type) → {a: [{type: "a", val: 1}, {type: "a", val: 3}], b: [{type: "b", val: 2}]}`

### 3. Lambda Support in User Functions
Users can pass lambdas to their own functions:
```calc
any(arr, pred) = reduce(arr, (acc, i) => acc or pred(i), false)
all(arr, pred) = reduce(arr, (acc, i) => acc and pred(i), true)
sortDescending(arr) = sort(arr, (a, b) => b - a)
```

## Implementation Details

### 1. New AST Node Types
```typescript
interface LambdaNode {
  type: "lambda";
  parameters: string[];  // ["i"] or ["acc", "i"] or ["a", "b"]
  body: ASTNode;
}
```

### 2. Parser Changes
- Parse arrow syntax: `param => body` or `(param1, param2) => body`
- Support shorthand for single parameters without parentheses
- Handle property access on lambda parameters (i.field)
- Ensure lambdas are only parsed in appropriate contexts (function arguments)

### 3. Tokenizer Changes
- Add `=>` token type (ARROW) for lambda expressions
- Ensure proper tokenization of arrow operator

### 4. Evaluator Changes
- Add lambda evaluation logic
- Implement new built-in functions
- Support lambda passing to user functions
- Implement proper JavaScript-style array sorting

### 5. Type System Updates
```typescript
// Add to CalculatedValue union
| { type: "lambda"; value: LambdaInfo }

interface LambdaInfo {
  parameters: string[];
  body: ASTNode;
  closure?: Map<string, CalculatedValue>;  // For captured variables
}
```

## File Changes

### New Files
1. `src/evaluator/lambda-functions.ts` - New built-in functions
2. `src/parser/lambda-parser.ts` - Lambda parsing logic
3. `tests/lambda-functions.test.ts` - Comprehensive tests

### Modified Files
1. `src/types/index.ts` - Add LambdaNode and lambda CalculatedValue
2. `src/parser/parser.ts` - Integrate lambda parsing
3. `src/evaluator/evaluate.ts` - Add lambda evaluation
4. `src/evaluator/array-object-functions.ts` - Update to handle lambdas
5. `package.json` - Update version to 1.4.3

## Testing Strategy
1. Unit tests for each new function
2. Lambda syntax parsing tests
3. Nested lambda tests
4. Property access in lambdas
5. Lambda closure tests
6. Integration with user functions
7. Sort comparator tests (numeric, string, object sorting)
8. Error handling tests

## Success Metrics
- [ ] All 5 built-in functions working correctly
- [ ] Lambda syntax parsed properly with context-appropriate parameters
- [ ] Lambdas work in user-defined functions
- [ ] Property access works in lambdas
- [ ] Sort function works with -1/0/1 comparator pattern
- [ ] All functions return new arrays/objects (immutable)
- [ ] Comprehensive test coverage
- [ ] No breaking changes to existing functionality

## Example Usage
```calc
# Filter positive numbers
numbers = [-2, -1, 0, 1, 2]
positive = filter(numbers, i => i > 0)  # [1, 2]

# Calculate sum using reduce
sum = reduce(numbers, (acc, i) => acc + i, 0)  # 0

# Transform data
doubled = map(positive, i => i * 2)  # [2, 4]

# Sort ascending
ascending = sort(numbers, (a, b) => a - b)  # [-2, -1, 0, 1, 2]

# Sort descending
descending = sort(numbers, (a, b) => b - a)  # [2, 1, 0, -1, -2]

# Sort by absolute value
byAbs = sort(numbers, (a, b) => abs(a) - abs(b))  # [0, -1, 1, -2, 2]

# Sort strings
words = ["banana", "apple", "cherry"]
sorted = sort(words, (a, b) => a > b ? 1 : a < b ? -1 : 0)  # ["apple", "banana", "cherry"]

# Sort objects by field
people = [{name: "Bob", age: 30}, {name: "Alice", age: 25}, {name: "Charlie", age: 35}]
byAge = sort(people, (a, b) => a.age - b.age)  # Alice, Bob, Charlie

# Group by category
data = [{cat: "A", val: 1}, {cat: "B", val: 2}, {cat: "A", val: 3}]
grouped = groupBy(data, i => i.cat)  # {A: [...], B: [...]}

# User function with lambda
any(arr, pred) = reduce(arr, (acc, i) => acc or pred(i), false)
hasNegative = any(numbers, i => i < 0)  # true

# Alternative syntax without parentheses for single parameter
squared = map(numbers, n => n * n)
```