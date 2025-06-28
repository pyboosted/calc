import { TokenType } from "../types";

export interface OperatorConfig {
  tokenType: TokenType;
  value: string;
  consumeNext?: string; // Character to consume if present
  multiChar?: boolean; // Whether this is part of a multi-char operator
}

// Single and multi-character operators
export const operatorMap: Record<string, OperatorConfig> = {
  "+": { tokenType: TokenType.OPERATOR, value: "+" },
  "-": { tokenType: TokenType.OPERATOR, value: "-" },
  "*": { tokenType: TokenType.OPERATOR, value: "*" },
  "/": { tokenType: TokenType.OPERATOR, value: "/" },
  "^": { tokenType: TokenType.OPERATOR, value: "^" },
  "%": { tokenType: TokenType.OPERATOR, value: "%" },
  "&": { tokenType: TokenType.OPERATOR, value: "&", consumeNext: "&" },
  "|": { tokenType: TokenType.PIPE, value: "|" },
  "||": { tokenType: TokenType.OR, value: "||", multiChar: true },
  "??": {
    tokenType: TokenType.NULLISH_COALESCING,
    value: "??",
    multiChar: true,
  },
  "<<": { tokenType: TokenType.OPERATOR, value: "<<", multiChar: true },
  ">>": { tokenType: TokenType.OPERATOR, value: ">>", multiChar: true },
};

// Other single character tokens
export const singleCharTokens: Record<string, TokenType> = {
  "(": TokenType.LPAREN,
  ")": TokenType.RPAREN,
  ",": TokenType.COMMA,
  "=": TokenType.EQUALS,
  "@": TokenType.AT_SYMBOL,
  "{": TokenType.LBRACE,
  "}": TokenType.RBRACE,
  "[": TokenType.LBRACKET,
  "]": TokenType.RBRACKET,
};

// Word operators mapping to symbols
export const wordOperators: Record<string, string> = {
  plus: "+",
  minus: "-",
  times: "*",
  multiplied: "*",
  divided: "/",
  mod: "%",
  xor: "^",
};
