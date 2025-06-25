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
    default:
      return "white";
  }
}
