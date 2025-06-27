import type { CalculatedValue } from "../types";
import { createDimensionFromUnit } from "./dimensions";

/**
 * Creates a unit expression (quantity with value 1)
 */
export function createUnitExpression(unit: string): CalculatedValue {
  try {
    const dimensions = createDimensionFromUnit(unit);
    return {
      type: "quantity",
      value: 1,
      dimensions,
    };
  } catch {
    throw new Error(`Unknown unit: ${unit}`);
  }
}

/**
 * Check if a string is a known unit name
 */
export function isKnownUnit(str: string): boolean {
  try {
    createDimensionFromUnit(str);
    return true;
  } catch {
    return false;
  }
}
