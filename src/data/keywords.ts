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
  "is",
  "prev",
  "total",
  "agg",
  "aggregate",
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
  "shift",
  "unshift",
  "append",
  "prepend",
  "first",
  "last",
  "length",
  "slice",
  "find",
  "findIndex",
  "filter",
  "map",
  // Object functions
  "keys",
  "values",
  "has",
  // Environment and argument functions
  "env",
  "arg",
  // Type inspection functions
  "unit",
  "timezone",
  "type",
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
  const lowerValue = value.toLowerCase();
  // Check for exact match
  if (functions.includes(lowerValue)) {
    return true;
  }
  // Check for mutation function (ends with !)
  if (lowerValue.endsWith("!") && lowerValue.length > 1) {
    const baseName = lowerValue.slice(0, -1);
    // Only allow ! suffix for specific array functions
    return [
      "push",
      "pop",
      "shift",
      "unshift",
      "append",
      "prepend",
      "slice",
      "filter",
      "map",
    ].includes(baseName);
  }
  return false;
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
