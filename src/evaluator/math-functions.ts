import type { Decimal } from "../utils/decimal-math";
import {
  abs,
  acos,
  add,
  asin,
  atan,
  ceil,
  cos,
  divide,
  floor,
  fromDecimal,
  isInteger,
  isNegative,
  ln,
  log10,
  multiply,
  ONE,
  power,
  round,
  sin,
  sqrt,
  tan,
  toDecimal,
  ZERO,
} from "../utils/decimal-math";

export const mathFunctions: Record<string, (...args: Decimal[]) => Decimal> = {
  // Basic math functions
  sqrt: (x: Decimal) => sqrt(x),
  cbrt: (x: Decimal) => x.cbrt(),
  root: (x: Decimal, n: Decimal) => power(x, ONE.div(n)),
  abs: (x: Decimal) => abs(x),
  log: (x: Decimal, base?: Decimal) =>
    base ? x.log(fromDecimal(base)) : log10(x),
  ln: (x: Decimal) => ln(x),
  fact: factorial,

  // Rounding functions
  round: (x: Decimal, decimals?: Decimal) => {
    if (decimals === undefined) {
      return round(x);
    }
    return round(x, fromDecimal(decimals));
  },
  ceil: (x: Decimal) => ceil(x),
  floor: (x: Decimal) => floor(x),

  // Trigonometric functions
  sin: (x: Decimal) => sin(x),
  cos: (x: Decimal) => cos(x),
  tan: (x: Decimal) => tan(x),
  arcsin: (x: Decimal) => asin(x),
  arccos: (x: Decimal) => acos(x),
  arctan: (x: Decimal) => atan(x),

  // Hyperbolic functions
  sinh: (x: Decimal) => x.sinh(),
  cosh: (x: Decimal) => x.cosh(),
  tanh: (x: Decimal) => x.tanh(),

  // Aggregate functions
  sum: (...args: Decimal[]) => args.reduce((a, b) => add(a, b), ZERO),
  average: (...args: Decimal[]) => {
    const sum = args.reduce((a, b) => add(a, b), ZERO);
    return divide(sum, toDecimal(args.length));
  },
  avg: (...args: Decimal[]) => {
    const sum = args.reduce((a, b) => add(a, b), ZERO);
    return divide(sum, toDecimal(args.length));
  },

  // Date/time functions (placeholders for now)
  fromunix: (timestamp: Decimal) => timestamp, // Will implement proper date handling later
};

function factorial(n: Decimal): Decimal {
  if (isNegative(n)) {
    throw new Error("Factorial of negative number");
  }
  if (!isInteger(n)) {
    throw new Error("Factorial of non-integer");
  }
  const nNum = fromDecimal(n);
  if (nNum === 0 || nNum === 1) {
    return ONE;
  }
  if (n.greaterThan(170)) {
    throw new Error("Factorial too large");
  }

  let result = ONE;
  for (let i = 2; i <= nNum; i++) {
    result = multiply(result, toDecimal(i));
  }
  return result;
}
