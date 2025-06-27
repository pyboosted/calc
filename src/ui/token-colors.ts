import { DATE_KEYWORDS } from "../parser/tokenizer";
import { TokenType } from "../types";

export function getTokenColor(type: TokenType, value?: string): string {
  switch (type) {
    case TokenType.NUMBER:
      return "green";
    case TokenType.OPERATOR:
      return "blue";
    case TokenType.UNIT:
    case TokenType.CURRENCY:
      return "yellow";
    case TokenType.FUNCTION:
      return "magenta";
    case TokenType.VARIABLE:
      return "#d19a66"; // Orange
    case TokenType.CONSTANT:
      return "cyan"; // Same as date keywords
    case TokenType.KEYWORD:
      // Date keywords get special color
      if (value && (DATE_KEYWORDS as readonly string[]).includes(value)) {
        return "cyan";
      }
      return "blue";
    case TokenType.STRING_LITERAL:
    case TokenType.SINGLE_QUOTE_STRING:
    case TokenType.DOUBLE_QUOTE_STRING:
      return "green";
    case TokenType.AS:
      return "blue";
    case TokenType.TRUE:
    case TokenType.FALSE:
    case TokenType.NULL:
      return "cyan"; // Same color as constants
    case TokenType.EQUAL:
    case TokenType.NOT_EQUAL:
    case TokenType.LESS_THAN:
    case TokenType.GREATER_THAN:
    case TokenType.LESS_EQUAL:
    case TokenType.GREATER_EQUAL:
      return "yellow"; // Comparison operators
    case TokenType.AND:
    case TokenType.OR:
    case TokenType.NOT:
      return "magenta"; // Logical operators
    case TokenType.QUESTION:
    case TokenType.COLON:
      return "blue"; // Ternary operator
    case TokenType.LBRACE:
    case TokenType.RBRACE:
    case TokenType.LBRACKET:
    case TokenType.RBRACKET:
      return "yellow"; // Array/object delimiters
    case TokenType.DOT:
      return "white"; // Property access
    case TokenType.COMMA:
      return "white"; // Separator
    default:
      return "white";
  }
}

export function getFunctionDefinitionColor(): string {
  return "#c678dd"; // Purple - different from regular function calls (magenta)
}
