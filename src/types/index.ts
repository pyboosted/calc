export interface CalculatorState {
  input: string;
  result: CalculatedValue | null;
  error: string | null;
  history: HistoryEntry[];
  cursorPosition: number;
  variables: Map<string, CalculatedValue>;
}

export interface HistoryEntry {
  input: string;
  result: CalculatedValue;
}

// Import dimension types
import type { DimensionMap } from "../evaluator/dimensions";
import type { Decimal } from "../utils/decimal-math";

// Function information for user-defined functions
export interface FunctionInfo {
  name: string;
  parameters: string[];
  body: ASTNode;
  isBuiltin: false;
}

// Lambda information
export interface LambdaInfo {
  parameters: string[];
  body: ASTNode;
  closure?: Map<string, CalculatedValue>;
}

// Partial application information
export interface PartialInfo {
  callable: CalculatedValue; // The function or lambda being partially applied
  appliedArgs: CalculatedValue[]; // Arguments already applied
  remainingParams: string[]; // Parameters still needed
}

// Discriminated union type for all calculated values
export type CalculatedValue =
  | { type: "number"; value: Decimal } // Pure numbers only, no units
  | { type: "percentage"; value: Decimal } // Special type for percentages
  | { type: "quantity"; value: Decimal; dimensions: DimensionMap }
  | { type: "string"; value: string }
  | { type: "date"; value: Date; timezone?: string }
  | { type: "boolean"; value: boolean }
  | { type: "null"; value: null }
  | { type: "array"; value: CalculatedValue[] }
  | { type: "object"; value: Map<string, CalculatedValue> }
  | { type: "function"; value: FunctionInfo }
  | { type: "lambda"; value: LambdaInfo }
  | { type: "partial"; value: PartialInfo };

export const TokenType = {
  NUMBER: "NUMBER",
  OPERATOR: "OPERATOR",
  UNIT: "UNIT",
  FUNCTION: "FUNCTION",
  VARIABLE: "VARIABLE",
  KEYWORD: "KEYWORD",
  CURRENCY: "CURRENCY",
  CONSTANT: "CONSTANT",
  DATE_LITERAL: "DATE_LITERAL",
  TIME_LITERAL: "TIME_LITERAL",
  TIMEZONE: "TIMEZONE",
  AT_SYMBOL: "AT_SYMBOL",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  COMMA: "COMMA",
  EQUALS: "EQUALS",
  PLUS_EQUALS: "PLUS_EQUALS",
  MINUS_EQUALS: "MINUS_EQUALS",
  STRING_LITERAL: "STRING_LITERAL",
  SINGLE_QUOTE_STRING: "SINGLE_QUOTE_STRING",
  DOUBLE_QUOTE_STRING: "DOUBLE_QUOTE_STRING",
  DOT: "DOT",
  AS: "AS",
  TRUE: "TRUE",
  FALSE: "FALSE",
  NULL: "NULL",
  QUESTION: "QUESTION",
  COLON: "COLON",
  EQUAL: "EQUAL",
  NOT_EQUAL: "NOT_EQUAL",
  LESS_THAN: "LESS_THAN",
  GREATER_THAN: "GREATER_THAN",
  LESS_EQUAL: "LESS_EQUAL",
  GREATER_EQUAL: "GREATER_EQUAL",
  AND: "AND",
  OR: "OR",
  NOT: "NOT",
  PIPE: "PIPE",
  NULLISH_COALESCING: "NULLISH_COALESCING",
  LBRACE: "LBRACE",
  RBRACE: "RBRACE",
  LBRACKET: "LBRACKET",
  RBRACKET: "RBRACKET",
  ARROW: "ARROW",
  EOF: "EOF",
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export interface NumberNode {
  type: "number";
  value: Decimal;
}

export interface BinaryOpNode {
  type: "binary";
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode {
  type: "unary";
  operator: string;
  operand: ASTNode;
}

export interface FunctionNode {
  type: "function";
  name: string;
  args: ASTNode[];
}

export interface VariableNode {
  type: "variable";
  name: string;
}

export interface ConstantNode {
  type: "constant";
  name: string;
}

export interface AssignmentNode {
  type: "assignment";
  variable: string;
  value: ASTNode;
}

export interface AggregateNode {
  type: "aggregate";
  operation: "total" | "average" | "agg";
  targetUnit?: string;
}

export interface DateNode {
  type: "date";
  value: string;
  timezone?: string;
}

export interface TimeNode {
  type: "time";
  value: string;
  timezone?: string;
}

export interface DateTimeNode {
  type: "datetime";
  dateValue: string;
  timeValue: string;
  timezone?: string;
}

export interface DateOperationNode {
  type: "dateOperation";
  date: ASTNode;
  operation: "add" | "subtract" | "difference";
  value?: ASTNode;
  unit?: string;
}

export interface StringNode {
  type: "string";
  value: string;
  interpolations?: { position: number; expression: ASTNode }[];
}

export interface TypeCastNode {
  type: "typeCast";
  expression: ASTNode;
  targetType: "string" | "number" | "boolean" | "array" | "object" | "json";
}

export interface BooleanNode {
  type: "boolean";
  value: boolean;
}

export interface NullNode {
  type: "null";
}

export interface TernaryNode {
  type: "ternary";
  condition: ASTNode;
  trueExpr: ASTNode;
  falseExpr: ASTNode;
}

export interface ComparisonNode {
  type: "comparison";
  operator: "==" | "!=" | "<" | ">" | "<=" | ">=";
  left: ASTNode;
  right: ASTNode;
}

export interface LogicalNode {
  type: "logical";
  operator: "and" | "or" | "not";
  left?: ASTNode;
  right: ASTNode;
}

export interface NullishCoalescingNode {
  type: "nullishCoalescing";
  left: ASTNode;
  right: ASTNode;
}

export interface ArrayNode {
  type: "array";
  elements: ASTNode[];
}

export interface ObjectNode {
  type: "object";
  properties: Map<string, ASTNode>;
}

export interface PropertyAccessNode {
  type: "propertyAccess";
  object: ASTNode;
  property: ASTNode;
  computed: boolean;
}

export interface IndexAccessNode {
  type: "indexAccess";
  array: ASTNode;
  index: ASTNode;
}

export interface PropertyAssignmentNode {
  type: "propertyAssignment";
  object: ASTNode;
  property: string | ASTNode; // Can be a string for static, or ASTNode for dynamic
  value: ASTNode;
  computed?: boolean; // Whether it's bracket notation
}

export interface TypeCheckNode {
  type: "typeCheck";
  expression: ASTNode;
  checkType: string;
}

export interface FunctionDefinitionNode {
  type: "functionDefinition";
  name: string;
  parameters: string[];
  body: ASTNode;
}

export interface LambdaNode {
  type: "lambda";
  parameters: string[];
  body: ASTNode;
}

// ASTNode is now a discriminated union type
export type ASTNode =
  | NumberNode
  | BinaryOpNode
  | UnaryOpNode
  | FunctionNode
  | VariableNode
  | ConstantNode
  | AssignmentNode
  | AggregateNode
  | DateNode
  | TimeNode
  | DateTimeNode
  | DateOperationNode
  | StringNode
  | TypeCastNode
  | BooleanNode
  | NullNode
  | TernaryNode
  | ComparisonNode
  | LogicalNode
  | NullishCoalescingNode
  | ArrayNode
  | ObjectNode
  | PropertyAccessNode
  | IndexAccessNode
  | PropertyAssignmentNode
  | TypeCheckNode
  | FunctionDefinitionNode
  | LambdaNode;
