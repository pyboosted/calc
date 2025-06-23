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

export enum TokenType {
  NUMBER = 'NUMBER',
  OPERATOR = 'OPERATOR',
  UNIT = 'UNIT',
  FUNCTION = 'FUNCTION',
  VARIABLE = 'VARIABLE',
  KEYWORD = 'KEYWORD',
  CURRENCY = 'CURRENCY',
  DATE_LITERAL = 'DATE_LITERAL',
  TIME_LITERAL = 'TIME_LITERAL',
  TIMEZONE = 'TIMEZONE',
  AT_SYMBOL = 'AT_SYMBOL',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COMMA = 'COMMA',
  EQUALS = 'EQUALS',
  EOF = 'EOF'
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export interface ASTNode {
  type: string;
}

export interface NumberNode extends ASTNode {
  type: 'number';
  value: number;
  unit?: string;
}

export interface BinaryOpNode extends ASTNode {
  type: 'binary';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode extends ASTNode {
  type: 'unary';
  operator: string;
  operand: ASTNode;
}

export interface FunctionNode extends ASTNode {
  type: 'function';
  name: string;
  args: ASTNode[];
}

export interface VariableNode extends ASTNode {
  type: 'variable';
  name: string;
}

export interface AssignmentNode extends ASTNode {
  type: 'assignment';
  variable: string;
  value: ASTNode;
}

export interface AggregateNode extends ASTNode {
  type: 'aggregate';
  operation: 'total' | 'average';
}

export interface DateNode extends ASTNode {
  type: 'date';
  value: string;
}

export interface TimeNode extends ASTNode {
  type: 'time';
  value: string;
  timezone?: string;
}

export interface DateTimeNode extends ASTNode {
  type: 'datetime';
  dateValue: string;
  timeValue: string;
  timezone?: string;
}

export interface DateOperationNode extends ASTNode {
  type: 'dateOperation';
  date: ASTNode;
  operation: 'add' | 'subtract' | 'difference';
  value?: ASTNode;
  unit?: string;
}