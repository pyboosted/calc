# Plan 1.3.2: Object and Array Support

## Overview
Add object and array support to the calculator, enabling structured data manipulation and complex calculations with collections.

## Features to Implement

### 1. Object and Array Literal Parsing
- **Empty objects**: `{}` creates an empty object
- **Object syntax**: `{key: value, key2: value2}` creates object with properties
- **Nested objects**: `{user: {name: "John", age: 30}}`
- **Array syntax**: `[1, 2, 3]` creates a native array type
- **Empty arrays**: `[]` creates an empty array
- **Mixed types**: Objects and arrays can contain any CalculatedValue type

### 2. Property Access
- **Dot notation**: `obj.prop` for static property access
- **Bracket notation**: `obj["prop"]` or `obj[variable]` for dynamic access
- **Nested access**: `data.users[0].name`
- **Property assignment**: `obj.key = value` creates or updates property
- **Chained assignment**: `obj.a.b.c = value` (creates intermediate objects if needed)

### 3. Array Functions
Arrays will support these built-in functions:
- `push(arr, value)`: Adds value to the end of array
- `first(arr)`: Returns first element
- `last(arr)`: Returns last element
- `sum(arr)`: Sums all numeric values in array
- `avg(arr)`: Averages all numeric values in array
- `length(arr)`: Returns array length
- `keys(obj)`: Returns array of object property names
- `values(obj)`: Returns array of object property values
- `map(arr, expr)`: Transform each element (future enhancement)
- `filter(arr, expr)`: Filter elements (future enhancement)

### 4. Type System Updates
- Add `object` and `array` types to `CalculatedValue` union:
  ```typescript
  | { type: 'object'; value: Map<string, CalculatedValue> }
  | { type: 'array'; value: CalculatedValue[] }
  ```
- Update `as` operator to support object/array conversions
- Objects and arrays can be cast to strings (JSON representation)
- Arrays can be cast to objects and vice versa:
  - Array to object: `[1, 2, 3]` → `{0: 1, 1: 2, 2: 3, length: 3}`
  - Object to array: Extracts numeric keys in order

### 5. Result Display
- Pretty-print objects in results with proper indentation
- Show arrays with bracket syntax `[1, 2, 3]`
- Limit depth/size for large collections (with "..." for truncated parts)
- Color-code object properties and array elements

### 6. Error Handling
- Graceful handling of missing properties (returns `null`)
- Clear error messages for invalid operations
- Prevent infinite recursion in circular references
- Type checking for array functions

## Implementation Tasks

### Parser Changes
1. Add new token types:
   - `LBRACE` (`{`), `RBRACE` (`}`)
   - `LBRACKET` (`[`), `RBRACKET` (`]`)
   - `DOT` (`.`), `COLON` (`:`)
   
2. Add new AST node types:
   - `ObjectNode`: `{ properties: Map<string, ASTNode> }`
   - `ArrayNode`: `{ elements: ASTNode[] }`
   - `PropertyAccessNode`: `{ object: ASTNode, property: ASTNode, computed: boolean }`
   - `PropertyAssignmentNode`: `{ object: ASTNode, property: ASTNode, value: ASTNode }`

3. Update parser precedence:
   - Property access (`.` and `[]`) has high precedence
   - Assignment remains low precedence

### Evaluator Changes
1. Implement object and array evaluation:
   - Create Map for object storage
   - Create Array for array storage
   - Handle property access and assignment for objects
   - Handle index access for arrays (bracket notation)
   - Implement proper array methods

2. Add built-in functions:
   - Implement array-specific functions (push, first, last, etc.)
   - Implement object-specific functions (keys, values)
   - Ensure proper type checking

3. Update type coercion:
   - Object/Array to string (JSON)
   - Array to object conversion
   - Object to array conversion (numeric keys)
   - Handle `as object` and `as array` casting

### UI Changes
1. Update syntax highlighting:
   - Color brackets and braces
   - Highlight property names differently

2. Enhance result formatting:
   - Pretty-print objects and arrays
   - Handle nested structures
   - Implement truncation for large objects

### Testing
1. Object creation and manipulation tests
2. Array syntax and functions tests
3. Property access (dot and bracket) tests
4. Nested object/array tests
5. Type conversion tests
6. Error handling tests
7. Edge cases (circular references, large objects)

## Examples

```javascript
// Object creation
person = {name: "Alice", age: 30}
person.name                    // "Alice"

// Array creation
numbers = [1, 2, 3, 4, 5]
numbers[0]                     // 1
sum(numbers)                   // 15
avg(numbers)                   // 3

// Nested structures
data = {
  users: [
    {name: "Alice", score: 95},
    {name: "Bob", score: 87}
  ]
}
data.users[0].name            // "Alice"
avg(data.users.map(u => u.score))  // 91

// Dynamic property access
key = "name"
person[key]                   // "Alice"

// Property assignment
person.email = "alice@example.com"
numbers.push(numbers, 6)      // Adds 6 to array

// Type conversions
obj = {x: 1, y: 2}
obj as string                 // '{"x": 1, "y": 2}'
obj as array                  // [] (no numeric keys)

arr = [1, 2, 3]
arr as string                 // '[1, 2, 3]'
arr as object                 // {0: 1, 1: 2, 2: 3, length: 3}

// Mixed numeric/string keys
mixed = {0: "a", 1: "b", name: "test"}
mixed as array                // ["a", "b"] (extracts numeric keys)
```

## Success Criteria
- [ ] Can create objects with literal syntax
- [ ] Can create arrays with bracket syntax
- [ ] Property access works with dot and bracket notation
- [ ] Can assign and update object properties
- [ ] Array-like functions work correctly
- [ ] Objects display nicely in results
- [ ] Type conversions work as expected
- [ ] No crashes with invalid property access
- [ ] Comprehensive test coverage

## Estimated Effort
This is a significant feature that will require:
- 2-3 days for parser updates
- 2-3 days for evaluator implementation
- 1-2 days for UI updates
- 1-2 days for testing and bug fixes

Total: 6-10 days of focused development