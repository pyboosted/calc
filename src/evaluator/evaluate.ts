import { format } from "date-fns";
import { isTemperature, unitDefinitions } from "../data/units";
import { Parser } from "../parser/parser";
import { Tokenizer } from "../parser/tokenizer";
import type {
  AggregateNode,
  ArrayNode,
  ASTNode,
  AssignmentNode,
  BinaryOpNode,
  BooleanNode,
  CalculatedValue,
  ComparisonNode,
  ConstantNode,
  DateNode,
  DateOperationNode,
  DateTimeNode,
  FunctionInfo,
  FunctionNode,
  IndexAccessNode,
  LogicalNode,
  NullNode,
  NumberNode,
  ObjectNode,
  PropertyAccessNode,
  PropertyAssignmentNode,
  StringNode,
  TernaryNode,
  TimeNode,
  TypeCastNode,
  TypeCheckNode,
  UnaryOpNode,
  VariableNode,
} from "../types";
import { DateManager } from "../utils/date-manager";
import {
  debugAST,
  debugEvaluation,
  debugLog,
  debugToken,
} from "../utils/debug";
import { TimezoneManager } from "../utils/timezone-manager";
import {
  evaluateArrayFunction,
  evaluateObjectFunction,
} from "./array-object-functions";
import {
  areDimensionsCompatible,
  convertCompoundUnit,
  createDimensionFromUnit,
  type DimensionMap,
  divideDimensions,
  getDimensionForUnit,
  isDimensionless,
  multiplyDimensions,
  parseUnit,
} from "./dimensions";
import { evaluateArgFunction, evaluateEnvFunction } from "./env-arg-functions";
import {
  evaluateLambda,
  filterArray,
  groupByArray,
  mapArray,
  reduceArray,
  sortArray,
} from "./lambda-functions";
import { mathFunctions } from "./math-functions";
import {
  addQuantities,
  convertQuantity,
  divideQuantities,
  hasUnitDifference,
  multiplyQuantities,
  powerQuantity,
  subtractQuantities,
} from "./quantity-operations";
import { convertUnits } from "./unit-converter";
import { createUnitExpression, isKnownUnit } from "./unit-expression";
import { formatQuantity } from "./unit-formatter";

// Regex patterns
const DATE_PATTERN = /(\d{1,2})[./](\d{1,2})[./](\d{4})/;

// Mathematical constants
const MATH_CONSTANTS_VALUES: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

// Maximum recursion depth for user-defined functions
const MAX_RECURSION_DEPTH = 1000;

function isTimePeriodUnit(unit: string | undefined): boolean {
  if (!unit) {
    return false;
  }
  return [
    "second",
    "seconds",
    "s",
    "sec",
    "minute",
    "minutes",
    "min",
    "m",
    "hour",
    "hours",
    "h",
    "hr",
    "day",
    "days",
    "d",
    "week",
    "weeks",
    "w",
    "month",
    "months",
    "year",
    "years",
    "yr",
  ].includes(unit);
}

function _isUnitInCategory(unit: string, category: string): boolean {
  const unitLower = unit.toLowerCase();
  const unitDef = unitDefinitions[unitLower];

  if (!unitDef) {
    // Check if it's a temperature unit
    if (category === "temperature" && isTemperature(unitLower)) {
      return true;
    }
    return false;
  }

  // Map categories to base units
  const categoryMapping: Record<string, string[]> = {
    length: ["meter"],
    weight: ["gram"],
    volume: ["liter"],
    time: ["second"],
    data: ["byte"],
    area: ["meter^2"],
  };

  const baseUnits = categoryMapping[category];
  return baseUnits ? baseUnits.includes(unitDef.baseUnit) : false;
}

export interface EvaluationContext {
  previousResults?: CalculatedValue[];
  debugMode?: boolean;
  stdinData?: string;
  cliArg?: string;
  callStack?: Map<string, number>; // Track recursion depth per function
}

export function evaluate(
  input: string,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  if (context?.debugMode) {
    debugLog("EVAL", `Starting evaluation: ${input}`);
  }

  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();

  if (context?.debugMode) {
    for (const token of tokens) {
      debugToken(token);
    }
  }

  const parser = new Parser(tokens);
  const ast = parser.parse();

  if (context?.debugMode) {
    debugAST(ast);
  }

  try {
    const result = evaluateNode(ast, variables, context);
    if (context?.debugMode) {
      debugEvaluation(input, result);
    }
    return result;
  } catch (error) {
    if (context?.debugMode) {
      debugEvaluation(input, null, error as Error);
    }
    throw error;
  }
}

// Helper function to format values for display
function formatValue(value: CalculatedValue): string {
  switch (value.type) {
    case "string":
      return value.value;
    case "number":
      return String(value.value);
    case "percentage":
      return `${value.value}%`;
    case "quantity":
      return formatQuantity(value.value, value.dimensions);
    case "date":
      return value.value.toISOString();
    case "boolean":
      return value.value ? "true" : "false";
    case "null":
      return "null";
    case "array":
      return `[${value.value.map(formatValue).join(", ")}]`;
    case "object": {
      const entries: string[] = [];
      for (const [key, val] of value.value) {
        entries.push(`${key}: ${formatValue(val)}`);
      }
      return `{${entries.join(", ")}}`;
    }
    case "function":
      return `<function ${value.value.name}(${value.value.parameters.join(", ")})>`;
    case "lambda":
      return `<lambda(${value.value.parameters.join(", ")})>`;
    default:
      // This should never happen with our exhaustive type checking
      throw new Error("Unknown value type");
  }
}

// Helper function to process escape sequences
function processEscapeSequences(str: string): string {
  // Process escape sequences in the order that won't conflict
  return (
    str
      .replace(/\\\\/g, "\u0000") // Temporarily replace \\ with null char
      .replace(/\\n/g, "\n") // Replace \n with newline
      .replace(/\\t/g, "\t") // Replace \t with tab
      .replace(/\\`/g, "`") // Replace \` with backtick
      // biome-ignore lint/suspicious/noControlCharactersInRegex: Using null char as temporary placeholder
      .replace(/\u0000/g, "\\")
  ); // Replace null char back with single backslash
}

// Handler functions for each node type
function evaluateNumberNode(node: NumberNode): CalculatedValue {
  // Numbers are now always dimensionless
  return { type: "number", value: node.value };
}

function evaluateVariableNode(
  node: VariableNode,
  variables: Map<string, CalculatedValue>
): CalculatedValue {
  const value = variables.get(node.name);
  if (value === undefined) {
    // Check if this is a unit name
    if (isKnownUnit(node.name)) {
      return createUnitExpression(node.name);
    }
    throw new Error(`Unknown variable: ${node.name}`);
  }
  return value;
}

function evaluateAssignmentNode(
  node: AssignmentNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const result = evaluateNode(node.value, variables, context);
  variables.set(node.variable, result);
  return result;
}

function evaluateStringNode(
  node: StringNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  let result = node.value;

  // Process interpolations if present
  if (node.interpolations) {
    // Process from end to start to maintain correct positions
    for (const interp of [...node.interpolations].reverse()) {
      const value = evaluateNode(interp.expression, variables, context);
      const stringValue = formatValue(value);

      // Find and replace the interpolation marker
      const markerPattern = new RegExp(
        `\\x00INTERP${node.interpolations.indexOf(interp)}\\x00`
      );
      result = result.replace(markerPattern, stringValue);
    }
  }

  // Process escape sequences
  result = processEscapeSequences(result);

  return { type: "string", value: result };
}

// Helper function to determine truthiness
function isTruthy(value: CalculatedValue): boolean {
  switch (value.type) {
    case "boolean":
      return value.value;
    case "number":
      return value.value !== 0;
    case "percentage":
      return value.value !== 0;
    case "string":
      return value.value !== "";
    case "null":
      return false;
    case "date":
      return true; // Dates are always truthy
    case "array":
      return value.value.length > 0;
    case "object":
      return value.value.size > 0;
    case "quantity":
      return value.value !== 0; // Quantities are truthy if non-zero
    case "function":
      return true; // Functions are always truthy
    case "lambda":
      return true; // Lambdas are always truthy
    default: {
      // Exhaustive check
      const _exhaustiveCheck: never = value;
      return _exhaustiveCheck;
    }
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Type casting requires handling multiple source and target type combinations
function evaluateTypeCastNode(
  node: TypeCastNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const value = evaluateNode(node.expression, variables, context);

  if (node.targetType === "string" || node.targetType === "json") {
    if (value.type === "array" || value.type === "object") {
      // Convert to JSON string
      return { type: "string", value: JSON.stringify(valueToJSON(value)) };
    }
    return { type: "string", value: formatValue(value) };
  }

  if (node.targetType === "number") {
    if (value.type === "string") {
      const num = Number.parseFloat(value.value);
      if (Number.isNaN(num)) {
        throw new Error(`Cannot convert "${value.value}" to number`);
      }
      return { type: "number", value: num };
    }
    if (value.type === "number") {
      return value;
    }
    if (value.type === "quantity") {
      // Convert quantity to dimensionless number, keeping the value
      return { type: "number", value: value.value };
    }
    if (value.type === "percentage") {
      // Convert percentage to decimal
      return { type: "number", value: value.value / 100 };
    }
    if (value.type === "boolean") {
      return { type: "number", value: value.value ? 1 : 0 };
    }
    throw new Error(`Cannot convert ${value.type} to number`);
  }

  if (node.targetType === "boolean") {
    return { type: "boolean", value: isTruthy(value) };
  }

  if (node.targetType === "array") {
    if (value.type === "array") {
      return value;
    }
    if (value.type === "string") {
      // Try to parse JSON
      try {
        const parsed = JSON.parse(value.value);
        if (Array.isArray(parsed)) {
          return jsonToCalculatedValue(parsed);
        }
        throw new Error("Parsed value is not an array");
      } catch {
        throw new Error("Cannot convert string to array: invalid JSON");
      }
    }
    if (value.type === "object") {
      // Convert object to array by extracting numeric keys in order
      const entries: CalculatedValue[] = [];
      const numericKeys: number[] = [];

      for (const key of value.value.keys()) {
        const num = Number.parseInt(key, 10);
        if (!Number.isNaN(num) && num.toString() === key) {
          numericKeys.push(num);
        }
      }

      numericKeys.sort((a, b) => a - b);

      for (const key of numericKeys) {
        const val = value.value.get(key.toString());
        if (val) {
          entries.push(val);
        }
      }

      return { type: "array", value: entries };
    }
    throw new Error(`Cannot convert ${value.type} to array`);
  }

  if (node.targetType === "object") {
    if (value.type === "object") {
      return value;
    }
    if (value.type === "string") {
      // Try to parse JSON
      try {
        const parsed = JSON.parse(value.value);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          return jsonToCalculatedValue(parsed);
        }
        throw new Error("Parsed value is not an object");
      } catch {
        throw new Error("Cannot convert string to object: invalid JSON");
      }
    }
    if (value.type === "array") {
      // Convert array to object with numeric keys and length property
      const obj = new Map<string, CalculatedValue>();

      value.value.forEach((element, index) => {
        obj.set(index.toString(), element);
      });

      obj.set("length", { type: "number", value: value.value.length });

      return { type: "object", value: obj };
    }
    throw new Error(`Cannot convert ${value.type} to object`);
  }

  throw new Error(`Unknown target type: ${node.targetType}`);
}

// Helper function to convert CalculatedValue to JSON-compatible format
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

function valueToJSON(value: CalculatedValue): JSONValue {
  switch (value.type) {
    case "number":
      return value.value;
    case "percentage":
      // Convert percentage to its numeric value
      return value.value;
    case "string":
      return value.value;
    case "boolean":
      return value.value;
    case "null":
      return null;
    case "date":
      return value.value.toISOString();
    case "array":
      return value.value.map(valueToJSON);
    case "object": {
      const obj: Record<string, JSONValue> = {};
      for (const [key, val] of value.value) {
        obj[key] = valueToJSON(val);
      }
      return obj;
    }
    case "quantity":
      // Convert quantity to object representation
      return {
        type: "quantity",
        value: value.value,
        dimensions: value.dimensions,
      };
    case "function":
      // Convert function to object representation
      return {
        type: "function",
        name: value.value.name,
        parameters: value.value.parameters,
      };
    case "lambda":
      // Convert lambda to object representation
      return {
        type: "lambda",
        parameters: value.value.parameters,
      };
    default: {
      const _exhaustiveCheck: never = value;
      return _exhaustiveCheck;
    }
  }
}

// Helper function to convert JSON to CalculatedValue
function jsonToCalculatedValue(json: JSONValue): CalculatedValue {
  if (json === null) {
    return { type: "null", value: null };
  }
  if (typeof json === "boolean") {
    return { type: "boolean", value: json };
  }
  if (typeof json === "number") {
    return { type: "number", value: json };
  }
  if (typeof json === "string") {
    return { type: "string", value: json };
  }
  if (Array.isArray(json)) {
    const elements = json.map(jsonToCalculatedValue);
    return { type: "array", value: elements };
  }
  if (typeof json === "object") {
    const properties = new Map<string, CalculatedValue>();
    for (const [key, value] of Object.entries(json)) {
      properties.set(key, jsonToCalculatedValue(value));
    }
    return { type: "object", value: properties };
  }
  throw new Error(`Cannot convert JSON value: ${typeof json}`);
}

function evaluateUnaryNode(
  node: UnaryOpNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const operand = evaluateNode(node.operand, variables, context);

  switch (node.operator) {
    case "+":
      return operand;
    case "-":
      if (operand.type === "number") {
        return { type: "number", value: -operand.value };
      }
      if (operand.type === "quantity") {
        return {
          type: "quantity",
          value: -operand.value,
          dimensions: operand.dimensions,
        };
      }
      throw new Error(`Cannot negate ${operand.type}`);
    default:
      throw new Error(`Unknown unary operator: ${node.operator}`);
  }
}

// String function implementations
function evaluateFormat(args: CalculatedValue[]): CalculatedValue {
  if (args.length !== 2) {
    throw new Error("format() requires exactly 2 arguments");
  }
  const dateArg = args[0];
  const patternArg = args[1];

  if (!dateArg || dateArg.type !== "date") {
    throw new Error("First argument to format() must be a date");
  }
  if (!patternArg || patternArg.type !== "string") {
    throw new Error("Second argument to format() must be a string");
  }

  // Use timezone-aware formatting if the date has a timezone
  if (dateArg.timezone) {
    const timezoneManager = TimezoneManager.getInstance();
    const formatted = timezoneManager.formatInTimezone(
      dateArg.value,
      dateArg.timezone,
      patternArg.value
    );
    return { type: "string", value: formatted };
  }

  // Otherwise use local time formatting
  const formatted = format(dateArg.value, patternArg.value);
  return { type: "string", value: formatted };
}

function evaluateLen(args: CalculatedValue[]): CalculatedValue {
  if (args.length !== 1) {
    throw new Error("len() requires exactly 1 argument");
  }
  const strArg = args[0];
  if (!strArg || strArg.type !== "string") {
    throw new Error("len() requires a string argument");
  }
  return { type: "number", value: strArg.value.length };
}

function evaluateSubstr(args: CalculatedValue[]): CalculatedValue {
  if (args.length < 2 || args.length > 3) {
    throw new Error("substr() requires 2 or 3 arguments");
  }
  const strArg = args[0];
  const startArg = args[1];
  const lengthArg = args[2];

  if (!strArg || strArg.type !== "string") {
    throw new Error("First argument to substr() must be a string");
  }
  if (!startArg || startArg.type !== "number") {
    throw new Error("Second argument to substr() must be a number");
  }

  const start = Math.floor(startArg.value);
  let substring: string;

  if (lengthArg) {
    if (lengthArg.type !== "number") {
      throw new Error("Third argument to substr() must be a number");
    }
    const length = Math.floor(lengthArg.value);
    substring = strArg.value.substring(start, start + length);
  } else {
    substring = strArg.value.substring(start);
  }

  return { type: "string", value: substring };
}

function evaluateCharAt(args: CalculatedValue[]): CalculatedValue {
  if (args.length !== 2) {
    throw new Error("charAt() requires exactly 2 arguments");
  }
  const strArg = args[0];
  const indexArg = args[1];

  if (!strArg || strArg.type !== "string") {
    throw new Error("First argument to charAt() must be a string");
  }
  if (!indexArg || indexArg.type !== "number") {
    throw new Error("Second argument to charAt() must be a number");
  }

  const index = Math.floor(indexArg.value);
  const char = strArg.value.charAt(index);
  return { type: "string", value: char };
}

function evaluateTrim(args: CalculatedValue[]): CalculatedValue {
  if (args.length !== 1) {
    throw new Error("trim() requires exactly 1 argument");
  }
  const strArg = args[0];
  if (!strArg || strArg.type !== "string") {
    throw new Error("trim() requires a string argument");
  }
  return { type: "string", value: strArg.value.trim() };
}

function evaluateStringFunction(
  name: string,
  args: CalculatedValue[]
): CalculatedValue {
  switch (name) {
    case "format":
      return evaluateFormat(args);
    case "len":
      return evaluateLen(args);
    case "substr":
      return evaluateSubstr(args);
    case "charat":
      return evaluateCharAt(args);
    case "trim":
      return evaluateTrim(args);
    default:
      throw new Error(`Unknown string function: ${name}`);
  }
}

function evaluateUserFunction(
  funcDef: { type: "function"; value: FunctionInfo },
  args: ASTNode[],
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const func = funcDef.value;

  // Evaluate arguments
  const evaluatedArgs = args.map((arg) =>
    evaluateNode(arg, variables, context)
  );

  // Check parameter count
  if (evaluatedArgs.length !== func.parameters.length) {
    throw new Error(
      `Function ${func.name} expects ${func.parameters.length} arguments, got ${evaluatedArgs.length}`
    );
  }

  // Create new scope with parameter bindings
  const functionScope = new Map(variables);
  func.parameters.forEach((param, index) => {
    const argValue = evaluatedArgs[index];
    if (argValue !== undefined) {
      functionScope.set(param, argValue);
    }
  });

  // Check recursion depth
  const callStack = context?.callStack || new Map<string, number>();
  const currentDepth = callStack.get(func.name) || 0;
  const newDepth = currentDepth + 1;

  if (newDepth > MAX_RECURSION_DEPTH) {
    throw new Error(
      `Maximum recursion depth exceeded for function ${func.name}`
    );
  }

  // Update call stack for recursion tracking
  const newCallStack = new Map(callStack);
  newCallStack.set(func.name, newDepth);

  // Evaluate function body with new scope and context
  const result = evaluateNode(func.body, functionScope, {
    ...context,
    callStack: newCallStack,
  });

  return result;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this function to reduce complexity
function evaluateFunctionNode(
  node: FunctionNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  // Check if it's a user-defined function or lambda
  const funcDef = variables.get(node.name);
  if (funcDef) {
    if (funcDef.type === "function") {
      return evaluateUserFunction(funcDef, node.args, variables, context);
    }
    if (funcDef.type === "lambda") {
      // Call lambda directly
      const lambda = funcDef.value;
      const evaluatedArgs = node.args.map((arg) =>
        evaluateNode(arg, variables, context)
      );

      // Check parameter count
      if (evaluatedArgs.length !== lambda.parameters.length) {
        throw new Error(
          `Lambda expects ${lambda.parameters.length} arguments, got ${evaluatedArgs.length}`
        );
      }

      return evaluateLambda(lambda, evaluatedArgs, variables, context);
    }
  }

  // Handle env() function
  if (node.name === "env") {
    const args = node.args.map((arg) => evaluateNode(arg, variables, context));
    return evaluateEnvFunction(args);
  }

  // Handle arg() function
  if (node.name === "arg") {
    if (node.args.length !== 0) {
      throw new Error("arg() takes no arguments");
    }
    return evaluateArgFunction({
      stdinData: context?.stdinData,
      cliArg: context?.cliArg,
    });
  }

  // Handle lambda-based array functions
  if (node.name === "filter") {
    if (node.args.length !== 2) {
      throw new Error("filter requires exactly 2 arguments");
    }
    const firstArg = node.args[0];
    const secondArg = node.args[1];
    if (!firstArg || !secondArg) {
      throw new Error("filter requires exactly 2 arguments");
    }
    const arr = evaluateNode(firstArg, variables, context);
    const predicate = evaluateNode(secondArg, variables, context);
    return filterArray(arr, predicate, variables, context);
  }

  if (node.name === "map") {
    if (node.args.length !== 2) {
      throw new Error("map requires exactly 2 arguments");
    }
    const firstArg = node.args[0];
    const secondArg = node.args[1];
    if (!firstArg || !secondArg) {
      throw new Error("map requires exactly 2 arguments");
    }
    const arr = evaluateNode(firstArg, variables, context);
    const transform = evaluateNode(secondArg, variables, context);
    return mapArray(arr, transform, variables, context);
  }

  if (node.name === "reduce") {
    if (node.args.length !== 3) {
      throw new Error("reduce requires exactly 3 arguments");
    }
    const firstArg = node.args[0];
    const secondArg = node.args[1];
    const thirdArg = node.args[2];
    if (!firstArg || !secondArg || !thirdArg) {
      throw new Error("reduce requires exactly 3 arguments");
    }
    const arr = evaluateNode(firstArg, variables, context);
    const reducer = evaluateNode(secondArg, variables, context);
    const initial = evaluateNode(thirdArg, variables, context);
    return reduceArray(arr, reducer, initial, variables, context);
  }

  if (node.name === "sort") {
    if (node.args.length !== 2) {
      throw new Error("sort requires exactly 2 arguments");
    }
    const firstArg = node.args[0];
    const secondArg = node.args[1];
    if (!firstArg || !secondArg) {
      throw new Error("sort requires exactly 2 arguments");
    }
    const arr = evaluateNode(firstArg, variables, context);
    const comparator = evaluateNode(secondArg, variables, context);
    return sortArray(arr, comparator, variables, context);
  }

  if (node.name === "groupBy") {
    if (node.args.length !== 2) {
      throw new Error("groupBy requires exactly 2 arguments");
    }
    const firstArg = node.args[0];
    const secondArg = node.args[1];
    if (!firstArg || !secondArg) {
      throw new Error("groupBy requires exactly 2 arguments");
    }
    const arr = evaluateNode(firstArg, variables, context);
    const keyFunc = evaluateNode(secondArg, variables, context);
    return groupByArray(arr, keyFunc, variables, context);
  }

  // Handle type inspection functions
  if (node.name === "unit") {
    if (node.args.length !== 1) {
      throw new Error("unit() takes exactly one argument");
    }
    const arg = node.args[0];
    if (!arg) {
      throw new Error("unit() requires an argument");
    }
    const value = evaluateNode(arg, variables, context);
    if (value.type === "quantity") {
      // Special handling for currency dimensions
      if (value.dimensions.currency) {
        const currencyDim = value.dimensions.currency as {
          exponent: number;
          code: string;
        };
        return { type: "string", value: currencyDim.code.toLowerCase() };
      }

      // Find the first dimension with a unit
      for (const dim of Object.keys(value.dimensions)) {
        const dimension =
          value.dimensions[dim as keyof typeof value.dimensions];
        if (dimension && "unit" in dimension && dimension.unit) {
          return { type: "string", value: dimension.unit.toLowerCase() };
        }
      }
    }
    return { type: "null", value: null };
  }

  if (node.name === "timezone") {
    if (node.args.length !== 1) {
      throw new Error("timezone() takes exactly one argument");
    }
    const arg = node.args[0];
    if (!arg) {
      throw new Error("timezone() requires an argument");
    }
    const value = evaluateNode(arg, variables, context);
    if (value.type === "date") {
      return { type: "string", value: value.timezone || "local" };
    }
    return { type: "null", value: null };
  }

  if (node.name === "type") {
    if (node.args.length !== 1) {
      throw new Error("type() takes exactly one argument");
    }
    const arg = node.args[0];
    if (!arg) {
      throw new Error("type() requires an argument");
    }
    const value = evaluateNode(arg, variables, context);
    return { type: "string", value: value.type };
  }

  const args = node.args.map((arg) => evaluateNode(arg, variables, context));

  // Handle string functions
  if (["format", "len", "substr", "charat", "trim"].includes(node.name)) {
    return evaluateStringFunction(node.name, args);
  }

  // Handle array functions (length is handled in both array and string functions)
  if (
    [
      "push",
      "pop",
      "first",
      "last",
      "length",
      "sum",
      "avg",
      "average",
      "slice",
    ].includes(node.name)
  ) {
    return evaluateArrayFunction(node.name, args);
  }

  // Handle object functions
  if (["keys", "values", "has"].includes(node.name)) {
    return evaluateObjectFunction(node.name, args);
  }

  // Handle length function (works on arrays, strings, and objects)
  if (node.name === "length") {
    return evaluateArrayFunction(node.name, args);
  }

  const func = mathFunctions[node.name];
  if (!func) {
    throw new Error(`Unknown function: ${node.name}`);
  }

  // Most math functions strip units
  const numericArgs = args.map((a) => {
    if (a.type === "number") {
      return a.value;
    }
    throw new Error(`Function ${node.name} requires numeric arguments`);
  });

  const result = func(...numericArgs);
  return { type: "number", value: result };
}

function evaluateDateNode(node: DateNode): CalculatedValue {
  const dateManager = DateManager.getInstance();
  const timezoneManager = TimezoneManager.getInstance();

  try {
    // Special handling for date keywords with timezone
    if (node.timezone) {
      // Validate timezone first
      if (!timezoneManager.isValidTimezone(node.timezone)) {
        throw new Error(`Invalid timezone: ${node.timezone}`);
      }

      if (node.value === "now") {
        // Get current time in the specified timezone
        const now = new Date();
        return { type: "date", value: now, timezone: node.timezone };
      }
      if (node.value === "today") {
        // Get start of day in the specified timezone
        const now = new Date();
        const startOfDay = timezoneManager.createDateInTimezone(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate(),
          0,
          0,
          node.timezone
        );
        return { type: "date", value: startOfDay, timezone: node.timezone };
      }
      if (node.value === "tomorrow") {
        // Get start of tomorrow in the specified timezone
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfTomorrow = timezoneManager.createDateInTimezone(
          tomorrow.getFullYear(),
          tomorrow.getMonth() + 1,
          tomorrow.getDate(),
          0,
          0,
          node.timezone
        );
        return {
          type: "date",
          value: startOfTomorrow,
          timezone: node.timezone,
        };
      }
      if (node.value === "yesterday") {
        // Get start of yesterday in the specified timezone
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = timezoneManager.createDateInTimezone(
          yesterday.getFullYear(),
          yesterday.getMonth() + 1,
          yesterday.getDate(),
          0,
          0,
          node.timezone
        );
        return {
          type: "date",
          value: startOfYesterday,
          timezone: node.timezone,
        };
      }
      // For weekdays with timezone, we'd need more complex logic
      // For now, fall through to regular parsing and add timezone
    }

    const date = dateManager.parseRelativeDate(node.value);

    if (!date) {
      throw new Error(`Invalid date: ${node.value}`);
    }

    // Return the date with timezone (explicit or local)
    return node.timezone
      ? { type: "date", value: date, timezone: node.timezone }
      : { type: "date", value: date, timezone: "local" };
  } catch (_error) {
    throw new Error(
      `Invalid date: ${node.value}${node.timezone ? `@${node.timezone}` : ""}`
    );
  }
}

function evaluateTimeNode(node: TimeNode): CalculatedValue {
  const timezoneManager = TimezoneManager.getInstance();

  try {
    // Parse time components
    const [hours, minutes] = node.value.split(":").map(Number);

    // Get current date
    const now = new Date();

    // Validate timezone if provided
    if (node.timezone && !timezoneManager.isValidTimezone(node.timezone)) {
      throw new Error(`Invalid timezone: ${node.timezone}`);
    }

    // Create date with time
    let date: Date;
    let timezone: string | undefined = node.timezone;

    if (node.timezone) {
      // Create date in specified timezone
      date = timezoneManager.createDateInTimezone(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        hours ?? 0,
        minutes ?? 0,
        node.timezone
      );
    } else {
      // Create date in local timezone
      date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours ?? 0,
        minutes ?? 0
      );
      // Mark as local timezone
      timezone = "local";
    }

    // Check if the date is valid
    if (!date || Number.isNaN(date.getTime())) {
      throw new Error(`Invalid time value: ${node.value}`);
    }

    // Return with timezone
    return { type: "date", value: date, timezone };
  } catch (_error) {
    // If there's an error creating the date with timezone, throw a proper error
    throw new Error(
      `Invalid time: ${node.value}${node.timezone ? `@${node.timezone}` : ""}`
    );
  }
}

function evaluateDateTimeNode(node: DateTimeNode): CalculatedValue {
  const timezoneManager = TimezoneManager.getInstance();

  try {
    // Parse date components
    const dateParts = node.dateValue.match(DATE_PATTERN);
    if (!dateParts) {
      throw new Error(`Invalid date format: ${node.dateValue}`);
    }

    const day = Number.parseInt(dateParts[1] ?? "1", 10);
    const month = Number.parseInt(dateParts[2] ?? "1", 10);
    const year = Number.parseInt(dateParts[3] ?? "2000", 10);

    // Parse time components
    const [hours, minutes] = node.timeValue.split(":").map(Number);

    // Validate timezone if provided
    if (node.timezone && !timezoneManager.isValidTimezone(node.timezone)) {
      throw new Error(`Invalid timezone: ${node.timezone}`);
    }

    // Create date
    let date: Date;
    let timezone: string;

    if (node.timezone) {
      // Create date in specified timezone
      date = timezoneManager.createDateInTimezone(
        year,
        month,
        day,
        hours ?? 0,
        minutes ?? 0,
        node.timezone
      );
      timezone = node.timezone;
    } else {
      // Create date in local timezone
      date = new Date(year, month - 1, day, hours ?? 0, minutes ?? 0);
      timezone = "local";
    }

    // Return with timezone
    return { type: "date", value: date, timezone };
  } catch (_error) {
    throw new Error(
      `Invalid datetime: ${node.dateValue}T${node.timeValue}${node.timezone ? `@${node.timezone}` : ""}`
    );
  }
}

function evaluateDateOperationNode(
  node: DateOperationNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const dateResult = evaluateNode(node.date, variables, context);

  // Convert to proper date format if needed
  if (dateResult.type !== "date") {
    throw new Error("Date operation requires a date");
  }
  const date = dateResult.value;

  const dateManager = DateManager.getInstance();

  if (node.operation === "add" || node.operation === "subtract") {
    if (!(node.value && node.unit)) {
      throw new Error("Date operation requires value and unit");
    }
    const valueResult = evaluateNode(node.value, variables, context);

    let value: number;
    const unit = node.unit;

    if (valueResult.type === "number") {
      // Legacy support for plain numbers
      value = valueResult.value;
    } else if (valueResult.type === "quantity") {
      // Handle quantities with time dimensions
      if (valueResult.dimensions.time) {
        // Convert the quantity to the target unit
        const quantityUnit = valueResult.dimensions.time.unit;
        if (quantityUnit && quantityUnit !== unit) {
          // Convert from quantity's unit to the operation's unit
          value = convertUnits(valueResult.value, quantityUnit, unit);
        } else {
          value = valueResult.value;
        }
      } else if (unit === "m" && valueResult.dimensions.length?.unit === "m") {
        // Special case: "m" can mean meters or minutes
        // In date context, if we have a length quantity with unit "m", treat it as minutes
        value = valueResult.value; // Use the value directly as minutes
      } else {
        throw new Error("Date operation requires a time quantity");
      }
    } else {
      throw new Error(
        "Date operation requires a numeric or time quantity value"
      );
    }

    const newDate =
      node.operation === "add"
        ? dateManager.addPeriod(date, value, unit)
        : dateManager.subtractPeriod(date, value, unit);

    // Preserve timezone if present
    return {
      type: "date",
      value: newDate,
      timezone: dateResult.timezone,
    };
  }

  throw new Error(`Unknown date operation: ${node.operation}`);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this function to reduce complexity
function evaluateBinaryNode(
  node: BinaryOpNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  // Check if right side is a percentage - if so, skip unit combination logic
  const isPercentageOperation =
    node.operator === "-" &&
    node.right.type === "binary" &&
    (node.right as BinaryOpNode).operator === "percent";

  // Special handling for unit arithmetic - check if this is units being combined
  if (
    !isPercentageOperation &&
    (node.operator === "/" || node.operator === "*")
  ) {
    // Case 1: binary unit operation / variable that is a unit (e.g., "10 m" / "s")
    if (
      node.left.type === "binary" &&
      (node.left as BinaryOpNode).operator === "unit" &&
      node.right.type === "variable"
    ) {
      const rightVar = (node.right as VariableNode).name;
      if (getDimensionForUnit(rightVar)) {
        // Evaluate the left side to get the quantity
        const leftResult = evaluateNode(node.left, variables, context);
        if (leftResult.type !== "quantity") {
          throw new Error("Expected quantity on left side");
        }

        const rightDimensions = createDimensionFromUnit(rightVar);

        const resultDimensions =
          node.operator === "/"
            ? divideDimensions(leftResult.dimensions, rightDimensions)
            : multiplyDimensions(leftResult.dimensions, rightDimensions);

        // Check if result is dimensionless
        if (isDimensionless(resultDimensions)) {
          return {
            type: "number",
            value: leftResult.value,
          };
        }

        return {
          type: "quantity",
          value: leftResult.value,
          dimensions: resultDimensions,
        };
      }
    }

    // Case 2: quantity / variable that is a unit (e.g., "velocity / s")
    const leftResult = evaluateNode(node.left, variables, context);
    if (leftResult.type === "quantity" && node.right.type === "variable") {
      const rightVar = (node.right as VariableNode).name;
      if (getDimensionForUnit(rightVar)) {
        const rightDimensions = createDimensionFromUnit(rightVar);

        const resultDimensions =
          node.operator === "/"
            ? divideDimensions(leftResult.dimensions, rightDimensions)
            : multiplyDimensions(leftResult.dimensions, rightDimensions);

        // Check if result is dimensionless
        if (isDimensionless(resultDimensions)) {
          return {
            type: "number",
            value: leftResult.value,
          };
        }

        return {
          type: "quantity",
          value: leftResult.value,
          dimensions: resultDimensions,
        };
      }
    }
  }

  // Special handling for unit conversion
  if (node.operator === "convert") {
    const leftResult = evaluateNode(node.left, variables, context);
    const rightNode = node.right as VariableNode;
    const targetUnit = rightNode.name;

    return convertQuantity(leftResult, targetUnit);
  }

  // Special handling for unit operator (e.g., 5 m, 10 kg)
  if (node.operator === "unit") {
    const leftResult = evaluateNode(node.left, variables, context);
    const rightNode = node.right as VariableNode;
    const unit = rightNode.name;

    if (leftResult.type !== "number") {
      throw new Error(`Cannot apply unit to ${leftResult.type}`);
    }

    // Create a quantity with the specified unit
    // Check if this is a compound unit expression
    const dimensions =
      unit.includes("*") || unit.includes("^")
        ? parseUnit(unit)
        : createDimensionFromUnit(unit);

    // If dimensions are empty (dimensionless), return a plain number
    if (isDimensionless(dimensions)) {
      return {
        type: "number",
        value: leftResult.value,
      };
    }

    return {
      type: "quantity",
      value: leftResult.value,
      dimensions,
    };
  }

  // Special handling for timezone conversion
  if (node.operator === "timezone_convert") {
    const leftResult = evaluateNode(node.left, variables, context);
    const rightNode = node.right as VariableNode;
    const targetTimezone = rightNode.name;

    // Check if it's a date type
    if (leftResult.type === "date") {
      const timezoneManager = TimezoneManager.getInstance();

      // For timezone conversion, we just change the timezone label
      // The actual moment in time (timestamp) remains the same
      if (!timezoneManager.isValidTimezone(targetTimezone)) {
        throw new Error(`Invalid timezone: ${targetTimezone}`);
      }
      return {
        type: "date",
        value: leftResult.value, // Keep the same timestamp
        timezone: targetTimezone,
      };
    }

    // Not a timestamp - try regular unit conversion instead
    if (leftResult.type === "quantity") {
      try {
        return convertQuantity(leftResult, targetTimezone);
      } catch (_error) {
        // If unit conversion also fails, throw the original error
        throw new Error("Timezone conversion requires a timestamp value");
      }
    }

    throw new Error("Timezone conversion requires a timestamp value");
  }

  const left = evaluateNode(node.left, variables, context);
  const right = evaluateNode(node.right, variables, context);

  // Extract binary operations into separate helper functions
  return evaluateBinaryOperation(node.operator, left, right);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this function to reduce complexity
function evaluateBinaryOperation(
  operator: string,
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  // Handle array operations first (before string operations)
  if (left.type === "array") {
    if (operator === "+") {
      return evaluateArrayAddition(left, right);
    }
    if (operator === "-") {
      return evaluateArraySubtraction(left, right);
    }
  }

  // Handle string operations
  if (left.type === "string" || right.type === "string") {
    return evaluateStringOperation(operator, left, right);
  }

  // Special handling for dates
  if (
    (left.type === "date" || right.type === "date") &&
    (operator === "+" || operator === "-")
  ) {
    return evaluateAddSubtract(operator, left, right);
  }

  // Special handling for percentages
  if ((operator === "+" || operator === "-") && right.type === "percentage") {
    if (left.type === "number") {
      const percentageAmount = left.value * (right.value / 100);
      return {
        type: "number",
        value:
          operator === "+"
            ? left.value + percentageAmount
            : left.value - percentageAmount,
      };
    }
    if (left.type === "quantity") {
      const percentageAmount = left.value * (right.value / 100);
      return {
        type: "quantity",
        value:
          operator === "+"
            ? left.value + percentageAmount
            : left.value - percentageAmount,
        dimensions: left.dimensions,
      };
    }
    throw new Error(`Cannot ${operator} ${left.type} with percentage`);
  }

  // Special handling for date arithmetic with quantities
  if (
    (operator === "+" || operator === "-") &&
    (left.type === "date" || right.type === "date")
  ) {
    return evaluateDateArithmetic(operator, left, right);
  }

  // Handle quantity operations
  if (left.type === "quantity" || right.type === "quantity") {
    switch (operator) {
      case "+":
        return addQuantities(left, right);
      case "-":
        return subtractQuantities(left, right);
      case "*":
        return multiplyQuantities(left, right);
      case "/":
        return divideQuantities(left, right);
      case "^":
        return powerQuantity(left, right);
      default:
        throw new Error(`Cannot perform ${operator} on quantities`);
    }
  }

  // Ensure we have numbers for numeric operations
  if (left.type !== "number" || right.type !== "number") {
    throw new Error(
      `Cannot perform ${operator} on ${left.type} and ${right.type}`
    );
  }

  switch (operator) {
    case "+":
    case "-":
      return evaluateAddSubtract(operator, left, right);

    case "*":
      return evaluateMultiply(left, right);

    case "/":
      return evaluateDivide(left, right);

    case "%":
      return { type: "number", value: left.value % right.value };

    case "percent":
      // Return percentage as its own type
      return { type: "percentage", value: left.value };

    case "^":
      return { type: "number", value: left.value ** right.value };

    case "&":
      // biome-ignore lint/nursery/noBitwiseOperators: Calculator supports bitwise operations
      return { type: "number", value: left.value & right.value };

    case "|":
      // biome-ignore lint/nursery/noBitwiseOperators: Calculator supports bitwise operations
      return { type: "number", value: left.value | right.value };

    case "<<":
      // biome-ignore lint/nursery/noBitwiseOperators: Calculator supports bitwise operations
      return { type: "number", value: left.value << right.value };

    case ">>":
      // biome-ignore lint/nursery/noBitwiseOperators: Calculator supports bitwise operations
      return { type: "number", value: left.value >> right.value };

    default:
      throw new Error(`Unknown binary operator: ${operator}`);
  }
}

function evaluateArrayAddition(
  left: CalculatedValue & { type: "array" },
  right: CalculatedValue
): CalculatedValue {
  // If right is an array, concatenate arrays
  if (right.type === "array") {
    return {
      type: "array",
      value: [...left.value, ...right.value],
    };
  }

  // Otherwise, append the single item to the array
  return {
    type: "array",
    value: [...left.value, right],
  };
}

function evaluateArraySubtraction(
  left: CalculatedValue & { type: "array" },
  right: CalculatedValue
): CalculatedValue {
  // Remove all occurrences of the value from the array
  if (right.type === "array") {
    // Remove all elements that exist in the right array
    const toRemove = new Set(right.value.map((v) => JSON.stringify(v)));
    return {
      type: "array",
      value: left.value.filter((item) => !toRemove.has(JSON.stringify(item))),
    };
  }

  // Remove all occurrences of the single value
  const valueStr = JSON.stringify(right);
  return {
    type: "array",
    value: left.value.filter((item) => JSON.stringify(item) !== valueStr),
  };
}

function evaluateStringOperation(
  operator: string,
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  switch (operator) {
    case "+": {
      // String concatenation
      const leftStr = formatValue(left);
      const rightStr = formatValue(right);
      return { type: "string", value: leftStr + rightStr };
    }

    case "*": {
      // String multiplication: "abc" * 3 → "abcabcabc"
      if (left.type === "string" && right.type === "number") {
        return {
          type: "string",
          value: left.value.repeat(Math.floor(right.value)),
        };
      }
      if (left.type === "number" && right.type === "string") {
        return {
          type: "string",
          value: right.value.repeat(Math.floor(left.value)),
        };
      }
      throw new Error(`Cannot multiply ${left.type} and ${right.type}`);
    }

    case "-": {
      // String subtraction: "hello.txt" - ".txt" → "hello"
      if (left.type === "string" && right.type === "string") {
        if (left.value.endsWith(right.value)) {
          return {
            type: "string",
            value: left.value.slice(0, -right.value.length),
          };
        }
        return left; // No change if not a suffix
      }
      throw new Error(`Cannot subtract ${right.type} from ${left.type}`);
    }

    default:
      throw new Error(`Cannot perform ${operator} on strings`);
  }
}

function evaluateAddSubtract(
  operator: string,
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  // Special handling for date arithmetic
  if (left.type === "date" || right.type === "date") {
    return evaluateDateArithmetic(operator, left, right);
  }

  // Ensure we have numbers for numeric operations
  if (left.type !== "number" || right.type !== "number") {
    throw new Error(
      `Cannot ${operator === "+" ? "add" : "subtract"} ${left.type} and ${right.type}`
    );
  }

  // Simple arithmetic (no units)
  const result =
    operator === "+" ? left.value + right.value : left.value - right.value;
  return { type: "number", value: result };
}

function evaluateDateArithmetic(
  operator: string,
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  const dateManager = DateManager.getInstance();

  // Extract dates from new format
  const leftDate = left.type === "date" ? left.value : null;
  const rightDate = right.type === "date" ? right.value : null;

  const leftTimezone = left.type === "date" ? left.timezone : undefined;
  const rightTimezone = right.type === "date" ? right.timezone : undefined;

  // Handle: date - date (returns difference as a quantity with time dimension)
  if (leftDate && rightDate) {
    if (operator === "-") {
      const diffMs = leftDate.getTime() - rightDate.getTime();
      // Convert to seconds for easier unit conversion
      const diffSeconds = diffMs / 1000;
      return {
        type: "quantity",
        value: diffSeconds,
        dimensions: {
          time: { exponent: 1, unit: "s" },
        },
      };
    }
    throw new Error("Cannot add two dates");
  }

  // Get numeric value and unit from right side
  let rightValue = 0;
  let rightUnit: string | undefined;

  if (right.type === "quantity") {
    if (right.dimensions.time) {
      rightValue = right.value;
      rightUnit = right.dimensions.time.unit;
    } else if (right.dimensions.length?.unit === "m") {
      // Special case: "m" can mean meters or minutes
      // In date arithmetic context, treat it as minutes
      rightValue = right.value;
      rightUnit = "m"; // minutes
    }
  }

  // Handle: date + time period
  if (leftDate && rightUnit && isTimePeriodUnit(rightUnit)) {
    const newDate =
      operator === "+"
        ? dateManager.addPeriod(leftDate, rightValue, rightUnit)
        : dateManager.subtractPeriod(leftDate, rightValue, rightUnit);
    // Preserve timezone if present
    return {
      type: "date",
      value: newDate,
      timezone: leftTimezone,
    };
  }

  // Get numeric value and unit from left side
  let leftValue = 0;
  let leftUnit: string | undefined;

  if (left.type === "quantity") {
    if (left.dimensions.time) {
      leftValue = left.value;
      leftUnit = left.dimensions.time.unit;
    } else if (left.dimensions.length?.unit === "m") {
      // Special case: "m" can mean meters or minutes
      // In date arithmetic context, treat it as minutes
      leftValue = left.value;
      leftUnit = "m"; // minutes
    }
  }

  // Handle: time period + date
  if (rightDate && leftUnit && isTimePeriodUnit(leftUnit)) {
    if (operator === "+") {
      const newDate = dateManager.addPeriod(rightDate, leftValue, leftUnit);
      // Preserve timezone if present
      return {
        type: "date",
        value: newDate,
        timezone: rightTimezone,
      };
    }
    throw new Error("Cannot subtract a date from a time period");
  }

  // Shouldn't reach here, but return a default
  throw new Error("Invalid date arithmetic operation");
}

// Note: Unit conversion and percentage operations are now handled through the quantity system

function evaluateMultiply(
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  // This function is now only called for dimensionless numbers
  if (left.type !== "number" || right.type !== "number") {
    throw new Error("Multiplication requires numeric values");
  }
  return { type: "number", value: left.value * right.value };
}

function evaluateDivide(
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  // This function is now only called for dimensionless numbers
  if (left.type !== "number" || right.type !== "number") {
    throw new Error("Division requires numeric values");
  }
  if (right.value === 0) {
    throw new Error("Division by zero");
  }
  return { type: "number", value: left.value / right.value };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this function to reduce complexity
function evaluateAggregateNode(
  node: AggregateNode,
  context?: EvaluationContext
): CalculatedValue {
  if (!context?.previousResults || context.previousResults.length === 0) {
    throw new Error(`No values to ${node.operation}`);
  }

  // Handle the new "agg" operation - collect values into an array
  if (node.operation === "agg") {
    // Filter out comments, errors, and empty lines by looking for valid values
    const validResults = context.previousResults.filter(
      (result) => result !== null && result !== undefined
    );

    return {
      type: "array",
      value: validResults,
    };
  }

  // Check if we have a date/timestamp and time periods for smart date arithmetic
  const dateResults = context.previousResults.filter(
    (result) => result && result.type === "date"
  );
  const timePeriodResults = context.previousResults.filter(
    (result) => result && result.type === "quantity" && result.dimensions.time
  );

  // If we have exactly one date and one or more time periods, add them together
  if (
    node.operation === "total" &&
    dateResults.length === 1 &&
    timePeriodResults.length > 0 &&
    !node.targetUnit
  ) {
    const dateResult = dateResults[0];

    // Sum all time periods, converting to seconds
    let totalSeconds = 0;
    for (const period of timePeriodResults) {
      try {
        if (period.type === "quantity" && period.dimensions.time) {
          const unit = period.dimensions.time.unit;
          if (unit) {
            const seconds = convertUnits(period.value, unit, "seconds");
            totalSeconds += seconds;
          }
        }
      } catch (_error) {
        // If conversion fails, skip this period
      }
    }

    // Add the total time period to the date
    if (totalSeconds !== 0 && dateResult) {
      const dateManagerInstance = DateManager.getInstance();
      let date: Date;
      let timezone: string | undefined;

      if (dateResult.type === "date") {
        date = dateResult.value;
        timezone = dateResult.timezone;
      } else {
        throw new Error("Invalid date result");
      }

      const newDate = dateManagerInstance.addPeriod(
        date,
        totalSeconds,
        "seconds"
      );
      return {
        type: "date",
        value: newDate,
        timezone,
      };
    }
  }

  // Check if we have string values for concatenation
  const stringResults = context.previousResults.filter(
    (result) => result && result.type === "string"
  );

  // If we have strings and operation is total, concatenate them
  if (
    node.operation === "total" &&
    stringResults.length > 0 &&
    !node.targetUnit
  ) {
    const concatenated = stringResults
      .map((r) => (r.type === "string" ? r.value : ""))
      .join("");
    return { type: "string", value: concatenated };
  }

  // Filter for numeric values (numbers and quantities)
  const numericResults = context.previousResults.filter((result) => {
    if (!result) {
      return false;
    }
    return (
      (result.type === "number" || result.type === "quantity") &&
      !Number.isNaN(
        result.type === "number" || result.type === "quantity"
          ? result.value
          : Number.NaN
      )
    );
  });

  if (numericResults.length === 0) {
    throw new Error(`No numeric values to ${node.operation}`);
  }

  // Calculate the aggregate
  const { value: totalValue, dimensions } = calculateAggregateQuantity(
    numericResults,
    node.targetUnit
  );

  if (node.operation === "total") {
    // If we have dimensions, return a quantity
    if (dimensions && !isDimensionless(dimensions)) {
      return {
        type: "quantity",
        value: totalValue,
        dimensions,
      };
    }
    // Otherwise return a plain number
    return { type: "number", value: totalValue };
  }

  // average
  const avg = totalValue / numericResults.length;
  if (dimensions && !isDimensionless(dimensions)) {
    return {
      type: "quantity",
      value: avg,
      dimensions,
    };
  }
  return { type: "number", value: avg };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this function to reduce complexity
function calculateAggregateQuantity(
  values: CalculatedValue[],
  targetUnit?: string
): { value: number; dimensions?: DimensionMap } {
  // If we have a target unit, convert all compatible values to that unit
  if (targetUnit) {
    let totalValue = 0;
    const targetDimensions = createDimensionFromUnit(targetUnit);

    for (const item of values) {
      if (item.type === "number") {
        totalValue += item.value;
      } else if (item.type === "quantity") {
        try {
          // Try to convert to target unit
          const converted = convertQuantity(item, targetUnit);
          if (converted.type === "quantity") {
            totalValue += converted.value;
          }
        } catch (_error) {
          // If conversion fails, skip this value
        }
      }
    }

    return { value: totalValue, dimensions: targetDimensions };
  }

  // Without target unit, find the first quantity with dimensions
  let firstDimensions: DimensionMap | undefined;
  let firstUnit: string | undefined;
  let hasIncompatibleUnits = false;

  for (const item of values) {
    if (item.type === "quantity" && !isDimensionless(item.dimensions)) {
      if (firstDimensions) {
        // Check if this quantity is compatible with the first one
        if (!areDimensionsCompatible(item.dimensions, firstDimensions)) {
          hasIncompatibleUnits = true;
        }
      } else {
        firstDimensions = item.dimensions;
        // Find the first unit in the dimensions
        for (const dim of Object.keys(
          item.dimensions
        ) as (keyof DimensionMap)[]) {
          const dimInfo = item.dimensions[dim];
          if (dimInfo && "unit" in dimInfo && dimInfo.unit) {
            firstUnit = dimInfo.unit;
            break;
          }
        }
      }
    }
  }

  // Sum all compatible values
  let totalValue = 0;

  for (const item of values) {
    if (item.type === "number") {
      totalValue += item.value;
    } else if (item.type === "quantity") {
      if (!firstDimensions || isDimensionless(item.dimensions)) {
        // No dimensions or dimensionless - just add the value
        totalValue += item.value;
      } else {
        // Try to convert to the first unit's dimensions
        try {
          if (areDimensionsCompatible(item.dimensions, firstDimensions)) {
            if (
              firstUnit &&
              hasUnitDifference(item.dimensions, firstDimensions)
            ) {
              // Convert to the first unit
              const converted = convertCompoundUnit(
                item.value,
                item.dimensions,
                firstDimensions
              );
              totalValue += converted;
            } else {
              totalValue += item.value;
            }
          } else {
            // Incompatible dimensions - just add raw value
            totalValue += item.value;
          }
        } catch (_error) {
          // If conversion fails, just add raw value
          totalValue += item.value;
        }
      }
    }
  }

  // If we have incompatible units, return a plain number
  if (hasIncompatibleUnits) {
    return { value: totalValue };
  }

  return { value: totalValue, dimensions: firstDimensions };
}

// Using hasUnitDifference from quantity-operations.ts

function evaluateConstantNode(
  node: ConstantNode,
  variables: Map<string, CalculatedValue>
): CalculatedValue {
  // Check if there's a variable with the same name first
  const varValue = variables.get(node.name);
  if (varValue !== undefined) {
    return varValue;
  }

  // Otherwise, use the constant value
  const value = MATH_CONSTANTS_VALUES[node.name];
  if (value === undefined) {
    throw new Error(`Unknown constant: ${node.name}`);
  }
  return { type: "number", value };
}

function evaluateBooleanNode(node: BooleanNode): CalculatedValue {
  return { type: "boolean", value: node.value };
}

function evaluateNullNode(_node: NullNode): CalculatedValue {
  return { type: "null", value: null };
}

function evaluateComparisonNode(
  node: ComparisonNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const left = evaluateNode(node.left, variables, context);
  const right = evaluateNode(node.right, variables, context);

  const result = compareValues(left, right, node.operator);
  return { type: "boolean", value: result };
}

function evaluateTypeCheckNode(
  node: TypeCheckNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const value = evaluateNode(node.expression, variables, context);
  const checkType = node.checkType.toLowerCase();

  // Basic type checks
  if (checkType === value.type) {
    return { type: "boolean", value: true };
  }

  // Special type checks
  switch (checkType) {
    case "datetime":
      // Check if it's a date with time component (not at start of day)
      if (value.type === "date") {
        const date = value.value;
        const isStartOfDay =
          date.getHours() === 0 &&
          date.getMinutes() === 0 &&
          date.getSeconds() === 0 &&
          date.getMilliseconds() === 0;
        return { type: "boolean", value: !isStartOfDay };
      }
      return { type: "boolean", value: false };

    case "currency":
      // Check if it's a quantity with currency dimension
      if (value.type === "quantity" && value.dimensions.currency) {
        return { type: "boolean", value: true };
      }
      return { type: "boolean", value: false };

    case "length":
    case "weight":
    case "volume":
    case "temperature":
    case "data":
    case "area":
    case "time":
      // Check if it's a quantity with the appropriate dimension
      if (value.type === "quantity") {
        // Map checkType to dimension name
        const dimensionMap: Record<string, keyof DimensionMap> = {
          length: "length",
          weight: "mass",
          volume: "volume", // volume has its own dimension
          temperature: "temperature",
          data: "data",
          area: "length", // area is length^2
          time: "time",
        };

        const dimension = dimensionMap[checkType];
        if (dimension && value.dimensions[dimension]) {
          // For area, check if it's length^2
          if (checkType === "area") {
            return {
              type: "boolean",
              value: value.dimensions.length?.exponent === 2,
            };
          }
          return { type: "boolean", value: true };
        }

        // Special check for volume as length^3 (for cubic units)
        if (checkType === "volume" && value.dimensions.length?.exponent === 3) {
          return { type: "boolean", value: true };
        }
      }
      return { type: "boolean", value: false };

    default:
      // Unknown type check
      return { type: "boolean", value: false };
  }
}

function compareValues(
  left: CalculatedValue,
  right: CalculatedValue,
  operator: ComparisonNode["operator"]
): boolean {
  switch (operator) {
    case "==":
      return isEqual(left, right);
    case "!=":
      return !isEqual(left, right);
    case "<":
      return isLessThan(left, right);
    case ">":
      return isLessThan(right, left);
    case "<=":
      return !isLessThan(right, left);
    case ">=":
      return !isLessThan(left, right);
    default: {
      // Exhaustive check
      const _exhaustiveCheck: never = operator;
      return _exhaustiveCheck;
    }
  }
}

function isEqual(left: CalculatedValue, right: CalculatedValue): boolean {
  if (left.type !== right.type) {
    return false;
  }

  switch (left.type) {
    case "number":
      // Plain numbers without units
      return left.value === (right as typeof left).value;
    case "string":
      return left.value === (right as typeof left).value;
    case "boolean":
      return left.value === (right as typeof left).value;
    case "date":
      return left.value.getTime() === (right as typeof left).value.getTime();
    case "null":
      return true;
    case "array": {
      const rightArray = right as typeof left;
      if (left.value.length !== rightArray.value.length) {
        return false;
      }
      for (let i = 0; i < left.value.length; i++) {
        const leftItem = left.value[i];
        const rightItem = rightArray.value[i];
        if (!(leftItem && rightItem && isEqual(leftItem, rightItem))) {
          return false;
        }
      }
      return true;
    }
    case "object": {
      const rightObject = right as typeof left;
      if (left.value.size !== rightObject.value.size) {
        return false;
      }
      for (const [key, value] of left.value) {
        const rightValue = rightObject.value.get(key);
        if (!(rightValue && isEqual(value, rightValue))) {
          return false;
        }
      }
      return true;
    }
    case "quantity": {
      const rightQuantity = right as typeof left;
      // Check if values are equal after unit conversion
      if (!areDimensionsCompatible(left.dimensions, rightQuantity.dimensions)) {
        return false;
      }
      // Convert right to left's units and compare
      try {
        const convertedRight = convertCompoundUnit(
          rightQuantity.value,
          rightQuantity.dimensions,
          left.dimensions
        );
        return Math.abs(left.value - convertedRight) < 1e-10; // Allow for floating point errors
      } catch {
        return false;
      }
    }
    case "percentage":
      return left.value === (right as typeof left).value;
    case "function":
      // Functions are equal if they have the same name
      return left.value.name === (right as typeof left).value.name;
    case "lambda":
      // Lambdas are equal if they reference the same object
      return left === right;
    default: {
      // Exhaustive check
      const _exhaustiveCheck: never = left;
      return _exhaustiveCheck;
    }
  }
}

function isLessThan(left: CalculatedValue, right: CalculatedValue): boolean {
  // Only compare compatible types
  if (left.type !== right.type) {
    throw new Error(`Cannot compare ${left.type} with ${right.type}`);
  }

  switch (left.type) {
    case "number":
      // Plain numbers without units
      return left.value < (right as typeof left).value;
    case "string":
      return left.value < (right as typeof left).value;
    case "date":
      return left.value.getTime() < (right as typeof left).value.getTime();
    case "boolean":
      // In JavaScript, false < true (false is 0, true is 1)
      return !left.value && (right as typeof left).value;
    case "null":
    case "array":
    case "object":
      throw new Error(`Cannot compare ${left.type} values with < operator`);
    case "quantity": {
      const rightQuantity = right as typeof left;
      // Check if dimensions are compatible
      if (!areDimensionsCompatible(left.dimensions, rightQuantity.dimensions)) {
        throw new Error(
          "Cannot compare quantities with incompatible dimensions"
        );
      }
      // Convert right to left's units and compare
      try {
        const convertedRight = convertCompoundUnit(
          rightQuantity.value,
          rightQuantity.dimensions,
          left.dimensions
        );
        return left.value < convertedRight;
      } catch {
        throw new Error("Cannot compare quantities with different units");
      }
    }
    case "percentage":
      return left.value < (right as typeof left).value;
    case "function":
      throw new Error("Cannot compare functions");
    case "lambda":
      throw new Error("Cannot compare lambdas");
    default: {
      // Exhaustive check
      const _exhaustiveCheck: never = left;
      return _exhaustiveCheck;
    }
  }
}

function evaluateLogicalNode(
  node: LogicalNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  switch (node.operator) {
    case "and": {
      if (node.left) {
        const left = evaluateNode(node.left, variables, context);
        if (!isTruthy(left)) {
          return left; // Short-circuit
        }
      }
      return evaluateNode(node.right, variables, context);
    }

    case "or": {
      if (node.left) {
        const left = evaluateNode(node.left, variables, context);
        if (isTruthy(left)) {
          return left; // Short-circuit
        }
      }
      return evaluateNode(node.right, variables, context);
    }

    case "not": {
      const value = evaluateNode(node.right, variables, context);
      return { type: "boolean", value: !isTruthy(value) };
    }

    default: {
      // Exhaustive check
      const _exhaustiveCheck: never = node.operator;
      return _exhaustiveCheck;
    }
  }
}

function evaluateTernaryNode(
  node: TernaryNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const condition = evaluateNode(node.condition, variables, context);
  const conditionValue = isTruthy(condition);

  // Lazy evaluation - only evaluate the selected branch
  if (conditionValue) {
    return evaluateNode(node.trueExpr, variables, context);
  }
  return evaluateNode(node.falseExpr, variables, context);
}

function evaluateArrayNode(
  node: ArrayNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const elements = node.elements.map((element) =>
    evaluateNode(element, variables, context)
  );
  return { type: "array", value: elements };
}

function evaluateObjectNode(
  node: ObjectNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const properties = new Map<string, CalculatedValue>();

  for (const [key, valueNode] of node.properties) {
    const value = evaluateNode(valueNode, variables, context);
    properties.set(key, value);
  }

  return { type: "object", value: properties };
}

function evaluatePropertyAccessNode(
  node: PropertyAccessNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const object = evaluateNode(node.object, variables, context);

  if (!node.computed) {
    // Dot notation: obj.prop
    if (object.type !== "object") {
      throw new Error(
        `Cannot access property of non-object type: ${object.type}`
      );
    }

    const propertyName = (node.property as StringNode).value;
    const value = object.value.get(propertyName);

    if (value === undefined) {
      return { type: "null", value: null };
    }

    return value;
  }

  // Bracket notation: obj[prop] or arr[index]
  const property = evaluateNode(node.property, variables, context);

  if (object.type === "array") {
    // Array index access
    if (property.type !== "number") {
      throw new Error(`Array index must be a number, got ${property.type}`);
    }

    let index = Math.floor(property.value);

    // Support negative indices (Python-style)
    if (index < 0) {
      index = object.value.length + index;
    }

    if (index < 0 || index >= object.value.length) {
      return { type: "null", value: null };
    }

    return object.value[index] || { type: "null", value: null };
  }

  if (object.type === "object") {
    // Object property access with bracket notation
    let key: string;

    switch (property.type) {
      case "string":
        key = property.value;
        break;
      case "number":
        key = property.value.toString();
        break;
      default:
        throw new Error(
          `Property key must be string or number, got ${property.type}`
        );
    }

    const value = object.value.get(key);

    if (value === undefined) {
      return { type: "null", value: null };
    }

    return value;
  }

  throw new Error(
    `Cannot access property of non-object/array type: ${object.type}`
  );
}

function evaluateIndexAccessNode(
  _node: IndexAccessNode,
  _variables: Map<string, CalculatedValue>,
  _context?: EvaluationContext
): CalculatedValue {
  // This is for backward compatibility - we're using PropertyAccessNode for both
  throw new Error("IndexAccessNode should not be used directly");
}

function evaluatePropertyAssignmentNode(
  node: PropertyAssignmentNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const object = evaluateNode(node.object, variables, context);

  if (object.type !== "object") {
    throw new Error(
      `Cannot assign property to non-object type: ${object.type}`
    );
  }

  const value = evaluateNode(node.value, variables, context);
  object.value.set(node.property, value);

  return value;
}

export function evaluateNode(
  node: ASTNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  switch (node.type) {
    case "number":
      return evaluateNumberNode(node);

    case "variable":
      return evaluateVariableNode(node, variables);

    case "constant":
      return evaluateConstantNode(node, variables);

    case "assignment":
      return evaluateAssignmentNode(node, variables, context);

    case "unary":
      return evaluateUnaryNode(node, variables, context);

    case "binary":
      return evaluateBinaryNode(node, variables, context);

    case "function":
      return evaluateFunctionNode(node, variables, context);

    case "date":
      return evaluateDateNode(node);

    case "time":
      return evaluateTimeNode(node);

    case "datetime":
      return evaluateDateTimeNode(node);

    case "dateOperation":
      return evaluateDateOperationNode(node, variables, context);

    case "aggregate":
      return evaluateAggregateNode(node, context);

    case "string":
      return evaluateStringNode(node, variables, context);

    case "typeCast":
      return evaluateTypeCastNode(node, variables, context);

    case "boolean":
      return evaluateBooleanNode(node);

    case "null":
      return evaluateNullNode(node);

    case "comparison":
      return evaluateComparisonNode(node, variables, context);

    case "typeCheck":
      return evaluateTypeCheckNode(node, variables, context);

    case "logical":
      return evaluateLogicalNode(node, variables, context);

    case "ternary":
      return evaluateTernaryNode(node, variables, context);

    case "array":
      return evaluateArrayNode(node, variables, context);

    case "object":
      return evaluateObjectNode(node, variables, context);

    case "propertyAccess":
      return evaluatePropertyAccessNode(node, variables, context);

    case "indexAccess":
      return evaluateIndexAccessNode(node, variables, context);

    case "propertyAssignment":
      return evaluatePropertyAssignmentNode(node, variables, context);

    case "functionDefinition": {
      // Store the function definition in variables
      const functionValue: CalculatedValue = {
        type: "function",
        value: {
          name: node.name,
          parameters: node.parameters,
          body: node.body,
          isBuiltin: false,
        },
      };
      variables.set(node.name, functionValue);
      return functionValue;
    }

    case "lambda": {
      // Create a lambda value with closure
      const lambdaValue: CalculatedValue = {
        type: "lambda",
        value: {
          parameters: node.parameters,
          body: node.body,
          closure: new Map(variables), // Capture current scope
        },
      };
      return lambdaValue;
    }

    default: {
      // This ensures exhaustiveness - TypeScript will error if we miss a case
      const _exhaustiveCheck: never = node;
      return _exhaustiveCheck;
    }
  }
}
