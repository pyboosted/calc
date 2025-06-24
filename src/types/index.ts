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

export interface CalculatedValue {
  value: number;
  unit?: string;
  date?: Date;
  timezone?: string;
}

export const TokenType = {
  NUMBER: "NUMBER",
  OPERATOR: "OPERATOR",
  UNIT: "UNIT",
  FUNCTION: "FUNCTION",
  VARIABLE: "VARIABLE",
  KEYWORD: "KEYWORD",
  CURRENCY: "CURRENCY",
  DATE_LITERAL: "DATE_LITERAL",
  TIME_LITERAL: "TIME_LITERAL",
  TIMEZONE: "TIMEZONE",
  AT_SYMBOL: "AT_SYMBOL",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  COMMA: "COMMA",
  EQUALS: "EQUALS",
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

// ASTNode is now a discriminated union type
export type ASTNode =
  | NumberNode
  | BinaryOpNode
  | UnaryOpNode
  | FunctionNode
  | VariableNode
  | AssignmentNode
  | AggregateNode
  | DateNode
  | TimeNode
  | DateTimeNode
  | DateOperationNode;
