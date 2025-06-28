import type { LambdaNode } from "../types";
import { TokenType } from "../types";
import type { Parser } from "./parser";

/**
 * Parse a lambda expression
 * Syntax: param => body or (param1, param2) => body
 * This function assumes the current token is at the start of the lambda
 */
export function parseLambda(parser: Parser): LambdaNode | null {
  const parameters: string[] = [];

  // Single parameter without parentheses
  if (parser.current.type === TokenType.VARIABLE) {
    parameters.push(parser.current.value);
    parser.advance(); // consume parameter

    // Must be followed by arrow
    if (parser.current.type !== TokenType.ARROW) {
      return null;
    }
    parser.advance(); // consume =>
  }
  // Multiple parameters with parentheses
  else if (parser.current.type === TokenType.LPAREN) {
    parser.advance(); // consume (

    // Empty parameter list
    if (parser.current.type === TokenType.RPAREN) {
      parser.advance(); // consume )
    } else {
      // Parse comma-separated parameters
      while (true) {
        if (parser.current.type !== TokenType.VARIABLE) {
          throw new Error("Expected parameter name in lambda");
        }

        parameters.push(parser.current.value);
        parser.advance();

        if (parser.current.type === TokenType.COMMA) {
          parser.advance(); // consume comma
        } else if (parser.current.type === TokenType.RPAREN) {
          parser.advance(); // consume )
          break;
        } else {
          throw new Error("Expected ',' or ')' in lambda parameter list");
        }
      }
    }

    // Must be followed by arrow
    if (parser.current.type !== TokenType.ARROW) {
      return null;
    }
    parser.advance(); // consume =>
  } else {
    return null;
  }

  // Parse the body expression
  const body = parser.parseExpression();

  return {
    type: "lambda",
    parameters,
    body,
  };
}

/**
 * Check if the current position might be the start of a lambda expression
 */
export function isLambdaStart(parser: Parser): boolean {
  const current = parser.current;

  // Single parameter: variable => ...
  if (current.type === TokenType.VARIABLE) {
    const next = parser.peek();
    return next !== null && next.type === TokenType.ARROW;
  }

  // Multiple parameters: (param1, param2) => ...
  if (current.type === TokenType.LPAREN) {
    // Look ahead to see if this looks like a lambda parameter list
    let i = 1;
    let token = parser.peek(i);

    // Empty params: () =>
    if (token && token.type === TokenType.RPAREN) {
      const arrow = parser.peek(i + 1);
      return arrow !== null && arrow.type === TokenType.ARROW;
    }

    // Non-empty params: (a, b) =>
    // This is a bit tricky - we need to check if it looks like a parameter list
    // For now, let's check if the first token after ( is a variable
    if (token && token.type === TokenType.VARIABLE) {
      // Look for pattern: (var [, var]* ) =>
      i++;
      token = parser.peek(i);

      while (token) {
        if (token.type === TokenType.COMMA) {
          i++;
          token = parser.peek(i);
          if (!token || token.type !== TokenType.VARIABLE) {
            return false;
          }
          i++;
          token = parser.peek(i);
        } else if (token.type === TokenType.RPAREN) {
          const arrow = parser.peek(i + 1);
          return arrow !== null && arrow.type === TokenType.ARROW;
        } else {
          return false;
        }
      }
    }
  }

  return false;
}
