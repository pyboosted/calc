export const mathFunctions: Record<string, (...args: number[]) => number> = {
  // Basic math functions
  sqrt: (x: number) => Math.sqrt(x),
  cbrt: (x: number) => Math.cbrt(x),
  root: (x: number, n: number) => x ** (1 / n),
  abs: (x: number) => Math.abs(x),
  log: (x: number, base?: number) =>
    base ? Math.log(x) / Math.log(base) : Math.log10(x),
  ln: (x: number) => Math.log(x),
  fact: factorial,

  // Rounding functions
  round: (x: number, decimals?: number) => {
    if (decimals === undefined) {
      return Math.round(x);
    }
    const factor = 10 ** decimals;
    return Math.round(x * factor) / factor;
  },
  ceil: (x: number) => Math.ceil(x),
  floor: (x: number) => Math.floor(x),

  // Trigonometric functions
  sin: (x: number) => Math.sin(x),
  cos: (x: number) => Math.cos(x),
  tan: (x: number) => Math.tan(x),
  arcsin: (x: number) => Math.asin(x),
  arccos: (x: number) => Math.acos(x),
  arctan: (x: number) => Math.atan(x),

  // Hyperbolic functions
  sinh: (x: number) => Math.sinh(x),
  cosh: (x: number) => Math.cosh(x),
  tanh: (x: number) => Math.tanh(x),

  // Aggregate functions
  sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
  average: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
  avg: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,

  // Date/time functions (placeholders for now)
  fromunix: (timestamp: number) => timestamp, // Will implement proper date handling later
};

function factorial(n: number): number {
  if (n < 0) {
    throw new Error("Factorial of negative number");
  }
  if (n === 0 || n === 1) {
    return 1;
  }
  if (n > 170) {
    throw new Error("Factorial too large");
  }

  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}
