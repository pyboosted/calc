import type { CalculatedValue } from "../types";

/**
 * Deep clones a CalculatedValue to prevent mutation issues during recalculation
 */
export function deepCloneCalculatedValue(
  value: CalculatedValue
): CalculatedValue {
  switch (value.type) {
    case "number":
      return { type: "number", value: value.value };

    case "string":
      return { type: "string", value: value.value };

    case "date":
      return {
        type: "date",
        value: new Date(value.value),
        timezone: value.timezone,
      };

    case "boolean":
      return { type: "boolean", value: value.value };

    case "null":
      return { type: "null", value: null };

    case "array":
      return {
        type: "array",
        value: value.value.map((item) => deepCloneCalculatedValue(item)),
      };

    case "object": {
      const clonedMap = new Map<string, CalculatedValue>();
      value.value.forEach((val, key) => {
        clonedMap.set(key, deepCloneCalculatedValue(val));
      });
      return { type: "object", value: clonedMap };
    }

    case "quantity":
      return {
        type: "quantity",
        value: value.value,
        dimensions: { ...value.dimensions }, // Shallow clone of dimensions is sufficient
      };

    case "percentage":
      return { type: "percentage", value: value.value };

    case "function":
      // Functions are immutable, so we can return the same reference
      return value;

    case "lambda":
      // Lambdas are immutable, so we can return the same reference
      return value;

    case "partial":
      // Partials contain references to other values, deep clone the applied args
      return {
        type: "partial",
        value: {
          callable: value.value.callable, // The callable itself is immutable
          appliedArgs: value.value.appliedArgs.map((arg) =>
            deepCloneCalculatedValue(arg)
          ),
          remainingParams: [...value.value.remainingParams],
        },
      };

    default: {
      // This should never happen if all cases are covered
      const _exhaustive: never = value;
      throw new Error("Unhandled CalculatedValue type");
    }
  }
}
