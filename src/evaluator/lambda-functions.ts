import type { CalculatedValue, LambdaInfo } from "../types";
import { type EvaluationContext, evaluateNode } from "./evaluate";

/**
 * Evaluate a lambda function with given arguments
 */
export function evaluateLambda(
  lambda: LambdaInfo,
  args: CalculatedValue[],
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  // Create new scope with lambda parameters bound to arguments
  const lambdaScope = new Map(lambda.closure || variables);

  // Bind parameters to arguments
  lambda.parameters.forEach((param, index) => {
    if (index < args.length) {
      const arg = args[index];
      if (arg !== undefined) {
        lambdaScope.set(param, arg);
      }
    }
  });

  // Evaluate lambda body with the new scope
  return evaluateNode(lambda.body, lambdaScope, context);
}

/**
 * Evaluate a callable (lambda or user-defined function) with given arguments
 */
export function evaluateCallable(
  callable: CalculatedValue,
  args: CalculatedValue[],
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  if (callable.type === "lambda") {
    const lambda = callable.value;

    // If fewer arguments than parameters, create partial application
    if (args.length < lambda.parameters.length) {
      const remainingParams = lambda.parameters.slice(args.length);
      return {
        type: "partial",
        value: {
          callable,
          appliedArgs: args,
          remainingParams,
        },
      };
    }

    return evaluateLambda(lambda, args, variables, context);
  }
  if (callable.type === "function") {
    const func = callable.value;

    // If fewer arguments than parameters, create partial application
    if (args.length < func.parameters.length) {
      const remainingParams = func.parameters.slice(args.length);
      return {
        type: "partial",
        value: {
          callable,
          appliedArgs: args,
          remainingParams,
        },
      };
    }

    // Check parameter count
    if (args.length > func.parameters.length) {
      throw new Error(
        `Function ${func.name} expects ${func.parameters.length} arguments, got ${args.length}`
      );
    }

    // Create new scope with parameter bindings
    const funcScope = new Map(variables);
    func.parameters.forEach((param, index) => {
      if (index < args.length) {
        const arg = args[index];
        if (arg !== undefined) {
          funcScope.set(param, arg);
        }
      }
    });

    // Track recursion depth using callStack
    const callStack = context?.callStack || new Map<string, number>();
    const functionKey = `function_${func.name}`;
    const currentDepth = callStack.get(functionKey) || 0;
    const newDepth = currentDepth + 1;

    if (newDepth > 1000) {
      throw new Error("Maximum recursion depth exceeded");
    }

    const newCallStack = new Map(callStack);
    newCallStack.set(functionKey, newDepth);

    const newContext = {
      ...context,
      callStack: newCallStack,
    };

    // Evaluate function body with new scope
    return evaluateNode(func.body, funcScope, newContext);
  }
  if (callable.type === "partial") {
    const { callable: innerCallable, appliedArgs } = callable.value;

    // Combine previous and new arguments
    const allArgs = [...appliedArgs, ...args];

    // Recursively evaluate with all arguments
    return evaluateCallable(innerCallable, allArgs, variables, context);
  }

  throw new Error("Value is not callable");
}

/**
 * Filter array elements based on predicate
 */
export function filterArray(
  arr: CalculatedValue,
  predicate: CalculatedValue,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  if (arr.type !== "array") {
    throw new Error("First argument to filter must be an array");
  }

  if (
    predicate.type !== "lambda" &&
    predicate.type !== "function" &&
    predicate.type !== "partial"
  ) {
    throw new Error("Second argument to filter must be a function or lambda");
  }

  // Check parameter count
  let paramCount: number;
  if (predicate.type === "partial") {
    paramCount = predicate.value.remainingParams.length;
  } else if (predicate.type === "lambda") {
    paramCount = predicate.value.parameters.length;
  } else {
    paramCount = predicate.value.parameters.length;
  }

  if (paramCount !== 1) {
    throw new Error("Filter predicate must take exactly one parameter");
  }

  const filtered: CalculatedValue[] = [];

  for (const item of arr.value) {
    const result = evaluateCallable(predicate, [item], variables, context);

    // Check truthiness
    if (isTruthy(result)) {
      filtered.push(item);
    }
  }

  return { type: "array", value: filtered };
}

/**
 * Map array elements through a transformation function
 */
export function mapArray(
  arr: CalculatedValue,
  transform: CalculatedValue,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  if (arr.type !== "array") {
    throw new Error("First argument to map must be an array");
  }

  if (
    transform.type !== "lambda" &&
    transform.type !== "function" &&
    transform.type !== "partial"
  ) {
    throw new Error("Second argument to map must be a function or lambda");
  }

  // Check parameter count
  let paramCount: number;
  if (transform.type === "partial") {
    paramCount = transform.value.remainingParams.length;
  } else if (transform.type === "lambda") {
    paramCount = transform.value.parameters.length;
  } else {
    paramCount = transform.value.parameters.length;
  }

  if (paramCount !== 1) {
    throw new Error("Map transform must take exactly one parameter");
  }

  const mapped: CalculatedValue[] = [];

  for (const item of arr.value) {
    const result = evaluateCallable(transform, [item], variables, context);
    mapped.push(result);
  }

  return { type: "array", value: mapped };
}

/**
 * Reduce array to a single value
 */
export function reduceArray(
  arr: CalculatedValue,
  reducer: CalculatedValue,
  initial: CalculatedValue,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  if (arr.type !== "array") {
    throw new Error("First argument to reduce must be an array");
  }

  if (
    reducer.type !== "lambda" &&
    reducer.type !== "function" &&
    reducer.type !== "partial"
  ) {
    throw new Error("Second argument to reduce must be a function or lambda");
  }

  // Check parameter count
  let paramCount: number;
  if (reducer.type === "partial") {
    paramCount = reducer.value.remainingParams.length;
  } else if (reducer.type === "lambda") {
    paramCount = reducer.value.parameters.length;
  } else {
    paramCount = reducer.value.parameters.length;
  }

  if (paramCount !== 2) {
    throw new Error(
      "Reduce function must take exactly two parameters (accumulator, item)"
    );
  }

  let accumulator = initial;

  for (const item of arr.value) {
    accumulator = evaluateCallable(
      reducer,
      [accumulator, item],
      variables,
      context
    );
  }

  return accumulator;
}

/**
 * Sort array using comparator function
 */
export function sortArray(
  arr: CalculatedValue,
  comparator: CalculatedValue,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  if (arr.type !== "array") {
    throw new Error("First argument to sort must be an array");
  }

  if (
    comparator.type !== "lambda" &&
    comparator.type !== "function" &&
    comparator.type !== "partial"
  ) {
    throw new Error("Second argument to sort must be a function or lambda");
  }

  // Check parameter count
  let paramCount: number;
  if (comparator.type === "partial") {
    paramCount = comparator.value.remainingParams.length;
  } else if (comparator.type === "lambda") {
    paramCount = comparator.value.parameters.length;
  } else {
    paramCount = comparator.value.parameters.length;
  }

  if (paramCount !== 2) {
    throw new Error("Sort comparator must take exactly two parameters");
  }

  // Create a copy of the array to sort
  const sorted = [...arr.value];

  // Sort using the comparator
  sorted.sort((a, b) => {
    const result = evaluateCallable(comparator, [a, b], variables, context);

    if (result.type !== "number") {
      throw new Error("Sort comparator must return a number");
    }

    return result.value;
  });

  return { type: "array", value: sorted };
}

/**
 * Group array elements by key
 */
export function groupByArray(
  arr: CalculatedValue,
  keyFunc: CalculatedValue,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  if (arr.type !== "array") {
    throw new Error("First argument to groupBy must be an array");
  }

  if (
    keyFunc.type !== "lambda" &&
    keyFunc.type !== "function" &&
    keyFunc.type !== "partial"
  ) {
    throw new Error("Second argument to groupBy must be a function or lambda");
  }

  // Check parameter count
  let paramCount: number;
  if (keyFunc.type === "partial") {
    paramCount = keyFunc.value.remainingParams.length;
  } else if (keyFunc.type === "lambda") {
    paramCount = keyFunc.value.parameters.length;
  } else {
    paramCount = keyFunc.value.parameters.length;
  }

  if (paramCount !== 1) {
    throw new Error("GroupBy key function must take exactly one parameter");
  }

  const groups = new Map<string, CalculatedValue[]>();

  for (const item of arr.value) {
    const keyResult = evaluateCallable(keyFunc, [item], variables, context);

    // Convert key to string
    let key: string;
    switch (keyResult.type) {
      case "string":
        key = keyResult.value;
        break;
      case "number":
        key = String(keyResult.value);
        break;
      case "boolean":
        key = String(keyResult.value);
        break;
      case "null":
        key = "null";
        break;
      default:
        throw new Error(`Cannot use ${keyResult.type} as groupBy key`);
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(item);
  }

  // Convert to object with array values
  const result = new Map<string, CalculatedValue>();
  for (const [key, items] of groups) {
    result.set(key, { type: "array", value: items });
  }

  return { type: "object", value: result };
}

/**
 * Helper function to check truthiness
 */
function isTruthy(value: CalculatedValue): boolean {
  switch (value.type) {
    case "boolean":
      return value.value;
    case "number":
      return value.value !== 0;
    case "string":
      return value.value !== "";
    case "null":
      return false;
    case "array":
      return true; // All arrays are truthy
    case "object":
      return true; // All objects are truthy
    case "date":
      return true; // All dates are truthy
    default:
      return true;
  }
}
