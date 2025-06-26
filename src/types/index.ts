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

// Discriminated union type for all calculated values
export type CalculatedValue =
  | { type: "number"; value: number; unit?: string }
  | { type: "string"; value: string }
  | { type: "date"; value: Date; timezone?: string };

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
  STRING_LITERAL: "STRING_LITERAL",
  SINGLE_QUOTE_STRING: "SINGLE_QUOTE_STRING",
  DOUBLE_QUOTE_STRING: "DOUBLE_QUOTE_STRING",
  DOT: "DOT",
  AS: "AS",
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
  value: number;
  unit?: string;
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
  operation: "total" | "average";
  targetUnit?: string;
}

export interface DateNode {
  type: "date";
  value: string;
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
  targetType: "string" | "number";
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
  | TypeCastNode;
