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

  if (predicate.type !== "lambda") {
    throw new Error("Second argument to filter must be a lambda");
  }

  const lambda = predicate.value;
  if (lambda.parameters.length !== 1) {
    throw new Error("Filter predicate must take exactly one parameter");
  }

  const filtered: CalculatedValue[] = [];

  for (const item of arr.value) {
    const result = evaluateLambda(lambda, [item], variables, context);

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

  if (transform.type !== "lambda") {
    throw new Error("Second argument to map must be a lambda");
  }

  const lambda = transform.value;
  if (lambda.parameters.length !== 1) {
    throw new Error("Map transform must take exactly one parameter");
  }

  const mapped: CalculatedValue[] = [];

  for (const item of arr.value) {
    const result = evaluateLambda(lambda, [item], variables, context);
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

  if (reducer.type !== "lambda") {
    throw new Error("Second argument to reduce must be a lambda");
  }

  const lambda = reducer.value;
  if (lambda.parameters.length !== 2) {
    throw new Error(
      "Reduce function must take exactly two parameters (accumulator, item)"
    );
  }

  let accumulator = initial;

  for (const item of arr.value) {
    accumulator = evaluateLambda(
      lambda,
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

  if (comparator.type !== "lambda") {
    throw new Error("Second argument to sort must be a lambda");
  }

  const lambda = comparator.value;
  if (lambda.parameters.length !== 2) {
    throw new Error("Sort comparator must take exactly two parameters");
  }

  // Create a copy of the array to sort
  const sorted = [...arr.value];

  // Sort using the comparator
  sorted.sort((a, b) => {
    const result = evaluateLambda(lambda, [a, b], variables, context);

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

  if (keyFunc.type !== "lambda") {
    throw new Error("Second argument to groupBy must be a lambda");
  }

  const lambda = keyFunc.value;
  if (lambda.parameters.length !== 1) {
    throw new Error("GroupBy key function must take exactly one parameter");
  }

  const groups = new Map<string, CalculatedValue[]>();

  for (const item of arr.value) {
    const keyResult = evaluateLambda(lambda, [item], variables, context);

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
