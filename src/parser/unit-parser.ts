import { type Token, TokenType } from "../types";

export interface ParsedUnit {
  unit: string;
  exponent: number;
}

/**
 * Parses compound unit expressions like "kg/s", "m/s²", "kg*m*s^-2"
 * Returns an array of units with their exponents
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this function to reduce complexity
export function parseCompoundUnit(
  tokens: Token[],
  startPos: number
): {
  units: ParsedUnit[];
  endPos: number;
} | null {
  const units: ParsedUnit[] = [];
  let pos = startPos;
  let expectingUnit = true;
  let currentSign = 1; // 1 for multiplication, -1 for division

  while (pos < tokens.length) {
    const token = tokens[pos];

    if (expectingUnit) {
      // We expect a unit or currency token
      if (
        token?.type !== TokenType.UNIT &&
        token?.type !== TokenType.CURRENCY
      ) {
        // If we haven't parsed any units yet, this isn't a compound unit
        if (units.length === 0) {
          return null;
        }
        // Otherwise, we're done parsing
        break;
      }

      let exponent = currentSign;

      // Check if there's an exponent after the unit
      if (
        pos + 1 < tokens.length &&
        tokens[pos + 1]?.type === TokenType.OPERATOR &&
        tokens[pos + 1]?.value === "^" &&
        pos + 2 < tokens.length
      ) {
        // Check for the exponent value
        const expToken = tokens[pos + 2];
        if (expToken?.type === TokenType.NUMBER) {
          exponent = currentSign * Number.parseFloat(expToken.value);
          pos += 2; // Skip ^ and the number
        } else if (
          expToken?.type === TokenType.OPERATOR &&
          expToken.value === "-" &&
          pos + 3 < tokens.length &&
          tokens[pos + 3]?.type === TokenType.NUMBER
        ) {
          // Handle negative exponents
          exponent =
            currentSign * -Number.parseFloat(tokens[pos + 3]?.value || "1");
          pos += 3; // Skip ^, -, and the number
        }
      }

      units.push({ unit: token.value, exponent });
      pos++;
      expectingUnit = false;
    } else if (token?.type === TokenType.OPERATOR) {
      // We expect an operator (* or /)
      if (token.value === "*") {
        currentSign = 1;
        pos++;
        expectingUnit = true;
      } else if (token.value === "/") {
        currentSign = -1;
        pos++;
        expectingUnit = true;
      } else {
        // Other operators end the compound unit
        break;
      }
    } else {
      // No operator, we're done
      break;
    }
  }

  // If we ended expecting a unit, the expression is incomplete
  if (expectingUnit && units.length > 0) {
    return null;
  }

  // Return the parsed units and the position after the last consumed token
  return units.length > 0 ? { units, endPos: pos } : null;
}

/**
 * Converts parsed units to a multiplication/exponentiation expression string
 * For example: [{unit: "kg", exponent: 1}, {unit: "s", exponent: -1}] -> "kg*s^-1"
 */
export function unitsToExpression(units: ParsedUnit[]): string {
  return units
    .map(({ unit, exponent }) => {
      if (exponent === 1) {
        return unit;
      }
      return `${unit}^${exponent}`;
    })
    .join("*");
}
