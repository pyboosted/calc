import Decimal from "decimal.js";

// Configure Decimal.js for financial/mathematical precision
// Using 40 significant digits and rounding mode similar to IEEE 754
Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -20,
  toExpPos: 20,
  maxE: 9e15,
  minE: -9e15,
  modulo: Decimal.ROUND_DOWN,
});

// Type alias for cleaner code
export type DecimalValue = Decimal;

// Re-export Decimal for external use
export { Decimal } from "decimal.js";

// Conversion utilities
export function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) {
    return value;
  }

  // Handle hex and binary string literals
  if (typeof value === "string") {
    if (value.startsWith("0x") || value.startsWith("0X")) {
      // Convert hex to decimal
      return new Decimal(Number.parseInt(value, 16));
    }
    if (value.startsWith("0b") || value.startsWith("0B")) {
      // Convert binary to decimal - parseInt needs the digits without prefix
      return new Decimal(Number.parseInt(value.slice(2), 2));
    }
  }

  return new Decimal(value);
}

export function fromDecimal(value: Decimal): number {
  return value.toNumber();
}

// Basic arithmetic operations
export const add = (a: Decimal, b: Decimal): Decimal => a.plus(b);
export const subtract = (a: Decimal, b: Decimal): Decimal => a.minus(b);
export const multiply = (a: Decimal, b: Decimal): Decimal => a.times(b);
export const divide = (a: Decimal, b: Decimal): Decimal => a.div(b);
export const modulo = (a: Decimal, b: Decimal): Decimal => a.mod(b);
export const power = (a: Decimal, b: Decimal): Decimal => a.pow(b);

// Comparison operations
export const equals = (a: Decimal, b: Decimal): boolean => a.equals(b);
export const lessThan = (a: Decimal, b: Decimal): boolean => a.lessThan(b);
export const lessThanOrEqual = (a: Decimal, b: Decimal): boolean =>
  a.lessThanOrEqualTo(b);
export const greaterThan = (a: Decimal, b: Decimal): boolean =>
  a.greaterThan(b);
export const greaterThanOrEqual = (a: Decimal, b: Decimal): boolean =>
  a.greaterThanOrEqualTo(b);
export const notEquals = (a: Decimal, b: Decimal): boolean => !a.equals(b);

// Mathematical functions
export const abs = (a: Decimal): Decimal => a.abs();
export const negate = (a: Decimal): Decimal => a.neg();
export const sqrt = (a: Decimal): Decimal => a.sqrt();
export const floor = (a: Decimal): Decimal => a.floor();
export const ceil = (a: Decimal): Decimal => a.ceil();
export const round = (a: Decimal, places = 0): Decimal =>
  a.toDecimalPlaces(places);
export const trunc = (a: Decimal): Decimal => a.truncated();

// Trigonometric functions using Decimal.js built-in methods
export const sin = (a: Decimal): Decimal => a.sin();
export const cos = (a: Decimal): Decimal => a.cos();
export const tan = (a: Decimal): Decimal => a.tan();
export const asin = (a: Decimal): Decimal => a.asin();
export const acos = (a: Decimal): Decimal => a.acos();
export const atan = (a: Decimal): Decimal => a.atan();
export const atan2 = (y: Decimal, x: Decimal): Decimal => Decimal.atan2(y, x);

// Logarithmic functions
export const ln = (a: Decimal): Decimal => a.ln();
export const log10 = (a: Decimal): Decimal => a.log(10);
export const log2 = (a: Decimal): Decimal => a.log(2);
export const exp = (a: Decimal): Decimal => a.exp();

// Utility functions
export const isZero = (a: Decimal): boolean => a.isZero();
export const isNegative = (a: Decimal): boolean => a.isNegative();
export const isPositive = (a: Decimal): boolean => a.isPositive();
export const isInteger = (a: Decimal): boolean => a.isInteger();
export const isDecimalFinite = (a: Decimal): boolean => a.isFinite();
export const isDecimalNaN = (a: Decimal): boolean => a.isNaN();

// Min/Max functions
export const min = (...values: Decimal[]): Decimal => Decimal.min(...values);
export const max = (...values: Decimal[]): Decimal => Decimal.max(...values);

// Random number generation using Decimal.js
export const random = (): Decimal => Decimal.random();

// Constants
export const ZERO = toDecimal(0);
export const ONE = toDecimal(1);
export const TWO = toDecimal(2);
export const TEN = toDecimal(10);
export const PI = toDecimal(
  "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679"
);
export const E = toDecimal(
  "2.7182818284590452353602874713526624977572470936999595749669676277240766303535475945713821785251664274"
);

// Percentage operations
export const toPercentage = (a: Decimal): Decimal => a.times(100);
export const fromPercentage = (a: Decimal): Decimal => a.div(100);

// Format for display (with configurable precision)
export function formatDecimal(value: Decimal, precision?: number): string {
  if (precision !== undefined) {
    return value.toFixed(precision);
  }
  // Use toPrecision for cleaner output, avoiding unnecessary trailing zeros
  return value.toSignificantDigits().toString();
}

// Check if a value can be safely converted to Decimal
export function isValidDecimal(value: unknown): boolean {
  try {
    new Decimal(value as Decimal.Value);
    return true;
  } catch {
    return false;
  }
}
