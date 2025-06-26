# Phase 2 Implementation Plan: Booleans, Nulls, and Comparisons (v1.3.1)

## Overview
This plan implements boolean types, null values, comparison operators, logical operators, and the ternary operator for v1.3.1. This builds on v1.3.0's string support to complete the basic type system.

## Prerequisites
- v1.3.0 must be completed (string support with discriminated union CalculatedValue)
- All v1.3.0 tests must pass

## 1. Type System Updates

### 1.1 Extend CalculatedValue Type (src/types/index.ts)
Add to the existing discriminated union:

```typescript
type CalculatedValue = 
  | { type: 'number'; value: number; unit?: string }
  | { type: 'string'; value: string }
  | { type: 'date'; value: Date; timezone?: string }
  | { type: 'boolean'; value: boolean }  // NEW
  | { type: 'null'; value: null };        // NEW
```

### 1.2 Add New Token Types (src/types/index.ts)
Add to TokenType enum:
- `TRUE`, `FALSE` - for boolean literals
- `NULL` - for null literal
- `QUESTION` - for ternary operator (?)
- Comparison operators:
  - `EQUAL` (==)
  - `NOT_EQUAL` (!=)
  - `LESS_THAN` (<)
  - `GREATER_THAN` (>)
  - `LESS_EQUAL` (<=)
  - `GREATER_EQUAL` (>=)
- Logical operators:
  - `AND` (and)
  - `OR` (or)
  - `NOT` (not)

### 1.3 Add New AST Node Types (src/types/index.ts)
```typescript
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

interface ComparisonNode {
  type: "comparison";
  operator: "==" | "!=" | "<" | ">" | "<=" | ">=";
  left: ASTNode;
  right: ASTNode;
}

interface LogicalNode {
  type: "logical";
  operator: "and" | "or" | "not";
  left?: ASTNode;  // not used for "not"
  right: ASTNode;
}
```

Update `ASTNode` union type to include new nodes.

## 2. Tokenizer Updates (src/parser/tokenizer.ts)

### 2.1 Boolean and Null Keywords
Update keyword recognition in `tryReadKeywordOrIdentifier()`:
```typescript
// After reading the identifier
if (value === "true") return { type: TokenType.TRUE, value, position: start };
if (value === "false") return { type: TokenType.FALSE, value, position: start };
if (value === "null") return { type: TokenType.NULL, value, position: start };
```

### 2.2 Comparison Operators
Update operator recognition to handle two-character operators:
```typescript
// In operator recognition section
if (this.current === "=") {
  this.advance();
  if (this.current === "=") {
    this.advance();
    return { type: TokenType.EQUAL, value: "==", position: start };
  }
  return { type: TokenType.EQUALS, value: "=", position: start };
}

if (this.current === "!") {
  this.advance();
  if (this.current === "=") {
    this.advance();
    return { type: TokenType.NOT_EQUAL, value: "!=", position: start };
  }
  // Handle as error or future negation operator
}

if (this.current === "<") {
  this.advance();
  if (this.current === "=") {
    this.advance();
    return { type: TokenType.LESS_EQUAL, value: "<=", position: start };
  }
  return { type: TokenType.LESS_THAN, value: "<", position: start };
}

if (this.current === ">") {
  this.advance();
  if (this.current === "=") {
    this.advance();
    return { type: TokenType.GREATER_EQUAL, value: ">=", position: start };
  }
  return { type: TokenType.GREATER_THAN, value: ">", position: start };
}
```

### 2.3 Ternary Operator
Add recognition for `?` and reuse `:` (COLON):
```typescript
if (this.current === "?") {
  this.advance();
  return { type: TokenType.QUESTION, value: "?", position: start };
}
```

### 2.4 Logical Operators
Add to src/data/keywords.ts:
```typescript
export const logicalOperators = ["and", "or", "not"];
```

Update word operator recognition to return appropriate tokens.

## 3. Parser Updates (src/parser/parser.ts)

### 3.1 Operator Precedence
Update precedence hierarchy (lowest to highest):
1. Ternary (`? :`)
2. Logical OR (`or`)
3. Logical AND (`and`)
4. Comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`)
5. Additive (`+`, `-`)
6. Multiplicative (`*`, `/`, `%`)
7. Unary (`-`, `not`)
8. Exponentiation (`^`)

### 3.2 Update Expression Parsing
Restructure expression parsing methods:

```typescript
parse(): ASTNode {
  return this.parseTernary();
}

parseTernary(): ASTNode {
  let expr = this.parseLogicalOr();
  
  if (this.current.type === TokenType.QUESTION) {
    this.advance(); // consume ?
    const trueExpr = this.parseTernary(); // Allow nested ternaries
    
    if (this.current.type !== TokenType.COLON) {
      throw new Error("Expected ':' in ternary expression");
    }
    this.advance(); // consume :
    
    const falseExpr = this.parseTernary();
    
    return {
      type: "ternary",
      condition: expr,
      trueExpr,
      falseExpr
    };
  }
  
  return expr;
}

parseLogicalOr(): ASTNode {
  let left = this.parseLogicalAnd();
  
  while (this.current.value === "or") {
    this.advance();
    const right = this.parseLogicalAnd();
    left = { type: "logical", operator: "or", left, right };
  }
  
  return left;
}

parseLogicalAnd(): ASTNode {
  let left = this.parseComparison();
  
  while (this.current.value === "and") {
    this.advance();
    const right = this.parseComparison();
    left = { type: "logical", operator: "and", left, right };
  }
  
  return left;
}

parseComparison(): ASTNode {
  let left = this.parseAdditive();
  
  if (isComparisonOperator(this.current.type)) {
    const operator = this.current.value;
    this.advance();
    const right = this.parseAdditive();
    return { type: "comparison", operator, left, right };
  }
  
  return left;
}
```

### 3.3 Update parsePrimary()
Add cases for boolean and null literals:
```typescript
case TokenType.TRUE:
  this.advance();
  return { type: "boolean", value: true };
  
case TokenType.FALSE:
  this.advance();
  return { type: "boolean", value: false };
  
case TokenType.NULL:
  this.advance();
  return { type: "null" };
```

### 3.4 Parse Unary NOT
Update parseUnary() to handle `not`:
```typescript
if (this.current.value === "not") {
  this.advance();
  const operand = this.parseUnary();
  return { type: "logical", operator: "not", right: operand };
}
```

## 4. Evaluator Updates (src/evaluator/evaluate.ts)

### 4.1 Boolean and Null Evaluation
Add cases in evaluateNode:

```typescript
case "boolean":
  return { type: 'boolean', value: node.value };
  
case "null":
  return { type: 'null', value: null };
```

### 4.2 Comparison Operations
```typescript
case "comparison": {
  const left = evaluateNode(node.left, variables);
  const right = evaluateNode(node.right, variables);
  
  const result = compareValues(left, right, node.operator);
  return { type: 'boolean', value: result };
}

function compareValues(
  left: CalculatedValue, 
  right: CalculatedValue, 
  operator: string
): boolean {
  // Type coercion rules
  switch (operator) {
    case "==":
      return isEqual(left, right);
    case "!=":
      return !isEqual(left, right);
    case "<":
      return isLessThan(left, right);
    case ">":
      return isLessThan(right, left);
    case "<=":
      return !isLessThan(right, left);
    case ">=":
      return !isLessThan(left, right);
  }
}

function isEqual(left: CalculatedValue, right: CalculatedValue): boolean {
  if (left.type !== right.type) {
    // Special case: null == null
    if (left.type === 'null' && right.type === 'null') return true;
    return false;
  }
  
  switch (left.type) {
    case 'number':
      return left.value === right.value && left.unit === right.unit;
    case 'string':
      return left.value === right.value;
    case 'boolean':
      return left.value === right.value;
    case 'date':
      return left.value.getTime() === right.value.getTime();
    case 'null':
      return true;
  }
}

function isLessThan(left: CalculatedValue, right: CalculatedValue): boolean {
  // Only compare compatible types
  if (left.type !== right.type) {
    throw new Error(`Cannot compare ${left.type} with ${right.type}`);
  }
  
  switch (left.type) {
    case 'number':
      // Handle unit conversion if needed
      return left.value < right.value;
    case 'string':
      return left.value < right.value;
    case 'date':
      return left.value.getTime() < right.value.getTime();
    default:
      throw new Error(`Cannot compare ${left.type} values`);
  }
}
```

### 4.3 Logical Operations
```typescript
case "logical": {
  switch (node.operator) {
    case "and": {
      const left = evaluateNode(node.left!, variables);
      if (!isTruthy(left)) return left; // Short-circuit
      return evaluateNode(node.right, variables);
    }
    
    case "or": {
      const left = evaluateNode(node.left!, variables);
      if (isTruthy(left)) return left; // Short-circuit
      return evaluateNode(node.right, variables);
    }
    
    case "not": {
      const value = evaluateNode(node.right, variables);
      return { type: 'boolean', value: !isTruthy(value) };
    }
  }
}

function isTruthy(value: CalculatedValue): boolean {
  switch (value.type) {
    case 'boolean':
      return value.value;
    case 'number':
      return value.value !== 0;
    case 'string':
      return value.value !== '';
    case 'null':
      return false;
    case 'date':
      return true; // Dates are always truthy
  }
}
```

### 4.4 Ternary Operator
```typescript
case "ternary": {
  const condition = evaluateNode(node.condition, variables);
  const conditionValue = isTruthy(condition);
  
  // Lazy evaluation - only evaluate the selected branch
  if (conditionValue) {
    return evaluateNode(node.trueExpr, variables);
  } else {
    return evaluateNode(node.falseExpr, variables);
  }
}
```

### 4.5 Extended Type Casting
Add boolean conversions to existing type casting:

```typescript
case "typeCast": {
  const value = evaluateNode(node.expression, variables);
  
  switch (node.targetType) {
    case "boolean":
      return { type: 'boolean', value: isTruthy(value) };
      
    case "string":
      // Existing string conversion
      if (value.type === 'boolean') {
        return { type: 'string', value: value.value ? 'true' : 'false' };
      }
      if (value.type === 'null') {
        return { type: 'string', value: 'null' };
      }
      // ... existing cases
      
    case "number":
      // Existing number conversion
      if (value.type === 'boolean') {
        return { type: 'number', value: value.value ? 1 : 0 };
      }
      // ... existing cases
  }
}
```

## 5. UI Updates

### 5.1 Result Display (src/evaluator/unit-formatter.ts)
Update `formatResultWithUnit()`:
```typescript
export function formatResultWithUnit(value: CalculatedValue): string {
  switch (value.type) {
    case 'boolean':
      return value.value ? 'true' : 'false';
    case 'null':
      return 'null';
    // ... existing cases
  }
}
```

### 5.2 Syntax Highlighting (src/ui/token-colors.ts)
Add colors for new tokens:
```typescript
case TokenType.TRUE:
case TokenType.FALSE:
case TokenType.NULL:
  return "blue";  // Or another appropriate color for keywords

case TokenType.EQUAL:
case TokenType.NOT_EQUAL:
case TokenType.LESS_THAN:
case TokenType.GREATER_THAN:
case TokenType.LESS_EQUAL:
case TokenType.GREATER_EQUAL:
  return "yellow";  // Operator color
```

## 6. Testing

### 6.1 Boolean Tests (tests/boolean-operations.test.ts)
```typescript
describe("Boolean Operations", () => {
  test("boolean literals", () => {
    expect(evaluate("true", new Map())).toEqual({ type: 'boolean', value: true });
    expect(evaluate("false", new Map())).toEqual({ type: 'boolean', value: false });
  });

  test("null literal", () => {
    expect(evaluate("null", new Map())).toEqual({ type: 'null', value: null });
  });

  test("comparison operators", () => {
    expect(evaluate("5 == 5", new Map())).toEqual({ type: 'boolean', value: true });
    expect(evaluate("5 != 10", new Map())).toEqual({ type: 'boolean', value: true });
    expect(evaluate("5 < 10", new Map())).toEqual({ type: 'boolean', value: true });
    expect(evaluate("10 > 5", new Map())).toEqual({ type: 'boolean', value: true });
    expect(evaluate("5 <= 5", new Map())).toEqual({ type: 'boolean', value: true });
    expect(evaluate("10 >= 10", new Map())).toEqual({ type: 'boolean', value: true });
  });

  test("string comparisons", () => {
    expect(evaluate("`abc` == `abc`", new Map())).toEqual({ type: 'boolean', value: true });
    expect(evaluate("`abc` < `def`", new Map())).toEqual({ type: 'boolean', value: true });
  });

  test("logical operators", () => {
    expect(evaluate("true and true", new Map())).toEqual({ type: 'boolean', value: true });
    expect(evaluate("true and false", new Map())).toEqual({ type: 'boolean', value: false });
    expect(evaluate("false or true", new Map())).toEqual({ type: 'boolean', value: true });
    expect(evaluate("not true", new Map())).toEqual({ type: 'boolean', value: false });
  });

  test("short-circuit evaluation", () => {
    const vars = new Map();
    evaluate("x = 5", vars);
    // Should not evaluate x/0
    expect(evaluate("false and x/0", vars)).toEqual({ type: 'boolean', value: false });
    expect(evaluate("true or x/0", vars)).toEqual({ type: 'boolean', value: true });
  });

  test("ternary operator", () => {
    expect(evaluate("true ? 10 : 20", new Map())).toEqual({ type: 'number', value: 10 });
    expect(evaluate("false ? 10 : 20", new Map())).toEqual({ type: 'number', value: 20 });
    expect(evaluate("5 > 3 ? `yes` : `no`", new Map())).toEqual({ type: 'string', value: 'yes' });
  });

  test("nested ternary", () => {
    const result = evaluate("true ? false ? 1 : 2 : 3", new Map());
    expect(result).toEqual({ type: 'number', value: 2 });
  });

  test("type conversions", () => {
    expect(evaluate("true as number", new Map())).toEqual({ type: 'number', value: 1 });
    expect(evaluate("false as number", new Map())).toEqual({ type: 'number', value: 0 });
    expect(evaluate("true as string", new Map())).toEqual({ type: 'string', value: 'true' });
    expect(evaluate("0 as boolean", new Map())).toEqual({ type: 'boolean', value: false });
    expect(evaluate("1 as boolean", new Map())).toEqual({ type: 'boolean', value: true });
    expect(evaluate("`` as boolean", new Map())).toEqual({ type: 'boolean', value: false });
    expect(evaluate("`hello` as boolean", new Map())).toEqual({ type: 'boolean', value: true });
  });

  test("truthiness", () => {
    expect(evaluate("0 ? `true` : `false`", new Map())).toEqual({ type: 'string', value: 'false' });
    expect(evaluate("1 ? `true` : `false`", new Map())).toEqual({ type: 'string', value: 'true' });
    expect(evaluate("`` ? `true` : `false`", new Map())).toEqual({ type: 'string', value: 'false' });
    expect(evaluate("`text` ? `true` : `false`", new Map())).toEqual({ type: 'string', value: 'true' });
    expect(evaluate("null ? `true` : `false`", new Map())).toEqual({ type: 'string', value: 'false' });
  });
});
```

### 6.2 Integration Tests
```typescript
describe("Boolean Integration", () => {
  test("comparisons with variables", () => {
    const vars = new Map();
    evaluate("x = 10", vars);
    evaluate("y = 20", vars);
    expect(evaluate("x < y", vars)).toEqual({ type: 'boolean', value: true });
    expect(evaluate("x == 10", vars)).toEqual({ type: 'boolean', value: true });
  });

  test("logical operations with expressions", () => {
    const vars = new Map();
    evaluate("x = 5", vars);
    const result = evaluate("x > 3 and x < 10", vars);
    expect(result).toEqual({ type: 'boolean', value: true });
  });

  test("ternary with calculations", () => {
    const vars = new Map();
    evaluate("price = 100", vars);
    evaluate("discount = true", vars);
    const result = evaluate("discount ? price * 0.9 : price", vars);
    expect(result).toEqual({ type: 'number', value: 90 });
  });

  test("mixed type operations", () => {
    const vars = new Map();
    evaluate("count = 0", vars);
    evaluate("message = count > 0 ? `Items: ${count}` : `No items`", vars);
    expect(vars.get("message")).toEqual({ type: 'string', value: 'No items' });
  });
});
```

## 7. Documentation Updates

### 7.1 README Examples
Add boolean and comparison examples:
```calc
# Boolean values and comparisons
is_valid = true
is_active = false
is_ready = count > 0 and is_valid

# Comparison operators
is_equal = x == y
is_different = x != y
in_range = value >= 10 and value <= 100

# Ternary operator
status = is_active ? `Active` : `Inactive`
price = is_member ? base_price * 0.9 : base_price

# Type conversions
bool_to_num = true as number     # 1
num_to_bool = 0 as boolean       # false
bool_to_str = false as string    # "false"

# Null handling
optional = null
result = optional ? optional * 2 : 0
```

### 7.2 Update CLAUDE.md
Document:
- Boolean and null types
- Comparison operator behavior
- Logical operator short-circuiting
- Ternary operator evaluation
- Type conversion rules
- Truthiness rules

## Implementation Order
1. **Type System** (1 hour)
   - Add boolean and null to CalculatedValue
   - Add new AST nodes
   - Add new token types

2. **Tokenizer** (2 hours)
   - Add boolean/null keyword recognition
   - Implement comparison operator tokenization
   - Add ternary operator tokens

3. **Parser** (3 hours)
   - Restructure precedence hierarchy
   - Implement comparison parsing
   - Implement logical operator parsing
   - Implement ternary operator parsing

4. **Evaluator** (3 hours)
   - Implement boolean/null evaluation
   - Implement comparison operations
   - Implement logical operations with short-circuit
   - Implement ternary operator
   - Add boolean type conversions

5. **UI Updates** (1 hour)
   - Update result formatting
   - Add syntax highlighting

6. **Testing** (2 hours)
   - Comprehensive boolean tests
   - Integration tests
   - Edge cases

7. **Documentation** (1 hour)
   - Update README
   - Update CLAUDE.md

**Total Estimated Time**: 13 hours

## Success Criteria
- [x] Boolean literals (true/false) work
- [x] Null literal works
- [x] All comparison operators function correctly
- [x] Logical operators (and/or/not) with short-circuit evaluation
- [x] Ternary operator with lazy evaluation
- [x] Type conversions to/from boolean
- [x] Proper precedence for all operators
- [x] All v1.3.0 tests still pass
- [x] No breaking changes
- [x] Documentation updated