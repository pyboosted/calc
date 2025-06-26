# Phase 1 Implementation Plan: String Support (v1.3.0)

## Overview
This plan implements string support for the calculator in v1.3.0, adding string literals, interpolation, and basic string operations. This is a focused release that maintains full backward compatibility while introducing the foundation for text manipulation.

## 1. Type System Updates

### 1.1 Update CalculatedValue Type (src/types/index.ts)
Convert `CalculatedValue` to a discriminated union to support multiple types:

```typescript
type CalculatedValue = 
  | { type: 'number'; value: number; unit?: string }
  | { type: 'string'; value: string }
  | { type: 'date'; value: Date; timezone?: string };
```

Add helper function for backward compatibility:
```typescript
function isLegacyCalculatedValue(val: any): boolean {
  return typeof val.value === 'number' && !val.type;
}
```

### 1.2 Add New Token Types (src/types/index.ts)
Add to TokenType enum:
- `STRING_LITERAL` - for backtick strings with interpolation support
- `DOT` - for future property access (prepare for objects)
- `AS` - for type casting operator

### 1.3 Add New AST Node Types (src/types/index.ts)
```typescript
interface StringNode {
  type: "string";
  value: string;
  interpolations?: { position: number; expression: ASTNode }[];
}

interface TypeCastNode {
  type: "typeCast";
  expression: ASTNode;
  targetType: "string" | "number";  // Start with these two
}
```

Update `ASTNode` union type to include new nodes.

## 2. Tokenizer Updates (src/parser/tokenizer.ts)

### 2.1 String Literal Tokenization
Add `tryReadStringLiteral()` method:
- Triggered by backtick character (`)
- Parse until closing backtick
- Identify `${...}` interpolation blocks
- Handle escape sequences: `\n`, `\t`, `\\`, `\``
- Store raw string with markers for interpolation positions

Example tokenization:
```
Input: `Hello ${name}, total: ${x + y}`
Token: STRING_LITERAL with interpolation data
```

### 2.2 Type Casting Operator
- Add "as" to keywords in src/data/keywords.ts
- Recognize "as" followed by type name

## 3. Parser Updates (src/parser/parser.ts)

### 3.1 String Expression Parsing
Add `parseStringLiteral()` method:
- Create StringNode with interpolation expressions
- Parse each interpolation block as a full expression
- Maintain position information for error reporting

### 3.2 Update parsePrimary()
- Add case for STRING_LITERAL tokens
- Call parseStringLiteral() for string handling

### 3.3 Type Casting
Add type casting at low precedence:
- Parse `expression as type` syntax
- Initial support for `as string` and `as number`
- Create TypeCastNode

## 4. Evaluator Updates (src/evaluator/evaluate.ts)

### 4.1 Update evaluateNode Return Type
Change signature to return discriminated union:
```typescript
function evaluateNode(
  node: ASTNode, 
  variables: Map<string, CalculatedValue>
): CalculatedValue
```

### 4.2 String Operations
Add string evaluation in evaluateNode:

```typescript
case "string": {
  let result = node.value;
  if (node.interpolations) {
    // Process interpolations from end to start
    for (const interp of [...node.interpolations].reverse()) {
      const value = evaluateNode(interp.expression, variables);
      const stringValue = formatValue(value);
      // Replace interpolation marker with value
      result = result.substring(0, interp.position) + 
               stringValue + 
               result.substring(interp.position + marker.length);
    }
  }
  // Process escape sequences
  result = processEscapeSequences(result);
  return { type: 'string', value: result };
}
```

### 4.3 Binary Operations with Strings
Update binary operator handling:

**String Concatenation (+)**:
```typescript
if (left.type === 'string' || right.type === 'string') {
  const leftStr = formatValue(left);
  const rightStr = formatValue(right);
  return { type: 'string', value: leftStr + rightStr };
}
```

**String Multiplication (*)**:
```typescript
// "abc" * 3 → "abcabcabc"
if (left.type === 'string' && right.type === 'number') {
  return { type: 'string', value: left.value.repeat(Math.floor(right.value)) };
}
```

**String Subtraction (-)**:
```typescript
// "hello.txt" - ".txt" → "hello"
if (left.type === 'string' && right.type === 'string') {
  if (left.value.endsWith(right.value)) {
    return { 
      type: 'string', 
      value: left.value.slice(0, -right.value.length) 
    };
  }
  return left; // No change if not a suffix
}
```

### 4.4 Type Conversions
Implement type casting:

**as string**:
```typescript
case "typeCast": {
  const value = evaluateNode(node.expression, variables);
  if (node.targetType === "string") {
    return { type: 'string', value: formatValue(value) };
  }
  if (node.targetType === "number") {
    if (value.type === 'string') {
      const num = parseFloat(value.value);
      if (isNaN(num)) throw new Error(`Cannot convert "${value.value}" to number`);
      return { type: 'number', value: num };
    }
    // Add other type conversions
  }
}
```

### 4.5 Add format() Function
Add to math functions:
```typescript
format: (args: CalculatedValue[]) => {
  if (args.length !== 2) throw new Error("format expects 2 arguments");
  const date = args[0];
  const pattern = args[1];
  
  if (date.type !== 'date') throw new Error("First argument must be a date");
  if (pattern.type !== 'string') throw new Error("Second argument must be a string");
  
  const formatted = formatDate(date.value, pattern.value);
  return { type: 'string', value: formatted };
}
```

### 4.6 Helper Functions
Add formatting helpers:
```typescript
function formatValue(value: CalculatedValue): string {
  switch (value.type) {
    case 'string': return value.value;
    case 'number': return formatNumber(value.value, value.unit);
    case 'date': return formatDate(value.value);
  }
}

function processEscapeSequences(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\`/g, '`');
}
```

## 5. UI Updates

### 5.1 Result Display (src/evaluator/unit-formatter.ts)
Update `formatResultWithUnit()`:
```typescript
export function formatResultWithUnit(value: CalculatedValue): string {
  switch (value.type) {
    case 'string':
      // Show with quotes to indicate string type
      return `"${value.value}"`;
    case 'number':
      // Existing number formatting
      return formatNumberWithUnit(value.value, value.unit);
    case 'date':
      // Existing date formatting
      return formatDate(value.value, value.timezone);
  }
}
```

### 5.2 Syntax Highlighting (src/ui/token-colors.ts)
Add string literal color:
```typescript
case TokenType.STRING_LITERAL:
  return "green";  // Or another appropriate color
```

## 6. Testing

### 6.1 Create String Tests (tests/string-operations.test.ts)
```typescript
describe("String Operations", () => {
  test("string literals", () => {
    const result = evaluate("`hello world`", new Map());
    expect(result).toEqual({ type: 'string', value: 'hello world' });
  });

  test("string interpolation", () => {
    const vars = new Map();
    evaluate("x = 10", vars);
    const result = evaluate("`Value: ${x}`", vars);
    expect(result).toEqual({ type: 'string', value: 'Value: 10' });
  });

  test("string concatenation", () => {
    const result = evaluate("`hello` + ` ` + `world`", new Map());
    expect(result).toEqual({ type: 'string', value: 'hello world' });
  });

  test("string multiplication", () => {
    const result = evaluate("`abc` * 3", new Map());
    expect(result).toEqual({ type: 'string', value: 'abcabcabc' });
  });

  test("string subtraction", () => {
    const result = evaluate("`hello.txt` - `.txt`", new Map());
    expect(result).toEqual({ type: 'string', value: 'hello' });
  });

  test("escape sequences", () => {
    const result = evaluate("`line1\\nline2\\ttab`", new Map());
    expect(result).toEqual({ type: 'string', value: 'line1\nline2\ttab' });
  });

  test("type casting to string", () => {
    const result = evaluate("123 as string", new Map());
    expect(result).toEqual({ type: 'string', value: '123' });
  });

  test("type casting to number", () => {
    const result = evaluate("`123.45` as number", new Map());
    expect(result).toEqual({ type: 'number', value: 123.45 });
  });

  test("format function", () => {
    const result = evaluate("format(today, `dd.MM.yyyy`)", new Map());
    expect(result.type).toBe('string');
    expect(result.value).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });
});
```

### 6.2 Integration Tests
- Test string interpolation with complex expressions
- Test mixed numeric and string operations
- Test string operations with variables
- Test error cases (invalid type conversions)

## 7. Migration and Compatibility

### 7.1 Backward Compatibility
- All existing numeric calculations work unchanged
- Legacy CalculatedValue format auto-converted to new format
- No breaking changes to public APIs

### 7.2 Variable Storage
- Variables can now store strings
- Update variable map to handle new CalculatedValue format
- Ensure string variables work in interpolations

## 8. Documentation Updates

### 8.1 README Updates
Add string operation examples:
```calc
# String literals with interpolation
name = `John`
greeting = `Hello, ${name}!`

# String operations
separator = `=` * 50
filename = `report_2025.txt` - `.txt`

# Type conversions
num_str = 123 as string
str_num = `456` as number

# Date formatting
date_str = format(today, `dd.MM.yyyy`)
```

### 8.2 Add to CLAUDE.md
Document string support implementation details and patterns.

## Implementation Order
1. **Type System** (2 hours)
   - Update CalculatedValue to discriminated union
   - Add new AST nodes
   - Add new token types

2. **Tokenizer** (3 hours)
   - Implement string literal tokenization
   - Handle interpolation parsing
   - Add escape sequence support

3. **Parser** (2 hours)
   - Add string literal parsing
   - Implement type casting syntax
   - Update expression parsing

4. **Evaluator Core** (3 hours)
   - Update evaluateNode for new types
   - Implement string interpolation
   - Add type checking

5. **String Operations** (2 hours)
   - Implement concatenation, multiplication, subtraction
   - Add format() function
   - Handle type conversions

6. **UI Updates** (1 hour)
   - Update result formatting
   - Add syntax highlighting

7. **Testing** (2 hours)
   - Comprehensive string operation tests
   - Integration tests
   - Edge case handling

8. **Documentation** (1 hour)
   - Update README
   - Update CLAUDE.md
   - Add examples

**Total Estimated Time**: 16 hours

## Success Criteria
- [x] String literals with backticks work
- [x] String interpolation evaluates expressions
- [x] String concatenation with + operator
- [x] String multiplication with * operator  
- [x] String subtraction with - operator
- [x] Type casting with `as string` and `as number`
- [x] format() function for dates
- [x] All existing tests pass
- [x] No breaking changes
- [x] Documentation updated