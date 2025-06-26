import type { CalculatedValue } from "../types";

/**
 * Deep clones a CalculatedValue to prevent mutation issues during recalculation
 */
export function deepCloneCalculatedValue(
  value: CalculatedValue
): CalculatedValue {
  switch (value.type) {
    case "number":
      return { type: "number", value: value.value, unit: value.unit };

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

    default: {
      // This should never happen if all cases are covered
      const _exhaustive: never = value;
      throw new Error("Unhandled CalculatedValue type");
    }
  }
}
