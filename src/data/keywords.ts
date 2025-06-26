// Date/time keywords
export const dateKeywords = [
  "today",
  "tomorrow",
  "yesterday",
  "now",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

// Language keywords
export const keywords = [
  "in",
  "to",
  "as",
  "of",
  "what",
  "is",
  "prev",
  "total",
  "sum",
  "average",
  "avg",
  ...dateKeywords,
];

// Mathematical functions
export const functions = [
  "sqrt",
  "cbrt",
  "root",
  "abs",
  "log",
  "ln",
  "fact",
  "round",
  "ceil",
  "floor",
  "sin",
  "cos",
  "tan",
  "arcsin",
  "arccos",
  "arctan",
  "sinh",
  "cosh",
  "tanh",
  "sum",
  "average",
  "avg",
  "fromunix",
  "format",
  "len",
  "substr",
  "charat",
  "trim",
  // Array functions
  "push",
  "pop",
  "first",
  "last",
  "length",
  "slice",
  // Object functions
  "keys",
  "values",
  "has",
  // Environment and argument functions
  "env",
  "arg",
];

// Mathematical constants
export const mathConstants = ["pi", "e"] as const;

// Conversion keywords
export const conversionKeywords = ["in", "to", "as"];

// Logical operators
export const logicalOperators = ["and", "or", "not"];

// Helper functions
export function isKeyword(value: string): boolean {
  return keywords.includes(value.toLowerCase());
}

export function isFunction(value: string): boolean {
  return functions.includes(value.toLowerCase());
}

export function isMathConstant(value: string): boolean {
  return mathConstants.includes(
    value.toLowerCase() as (typeof mathConstants)[number]
  );
}

export function isDateKeyword(value: string): boolean {
  return dateKeywords.includes(
    value.toLowerCase() as (typeof dateKeywords)[number]
  );
}
