import type { CalculatedValue } from "../types";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Array function evaluation requires multiple type checks and operations
export function evaluateArrayFunction(
  name: string,
  args: CalculatedValue[]
): CalculatedValue {
  switch (name) {
    case "push": {
      if (args.length < 2) {
        throw new Error("push requires at least 2 arguments");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("First argument to push must be an array");
      }
      // Get the items to add
      const itemsToAdd = args.slice(1);
      // Mutate the original array by adding elements
      arr.value.push(...itemsToAdd);
      // Return the last added item (or the only item if just one)
      return itemsToAdd.at(-1) || { type: "null", value: null };
    }

    case "pop": {
      if (args.length !== 1) {
        throw new Error("pop requires exactly 1 argument");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("Argument to pop must be an array");
      }
      if (arr.value.length === 0) {
        // Return undefined for empty array like JavaScript
        return { type: "null", value: null };
      }
      // Mutate the original array and return the removed element
      const removedElement = arr.value.pop();
      return removedElement || { type: "null", value: null };
    }

    case "first": {
      if (args.length !== 1) {
        throw new Error("first requires exactly 1 argument");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("Argument to first must be an array");
      }
      if (arr.value.length === 0) {
        return { type: "null", value: null };
      }
      return arr.value[0] || { type: "null", value: null };
    }

    case "last": {
      if (args.length !== 1) {
        throw new Error("last requires exactly 1 argument");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("Argument to last must be an array");
      }
      if (arr.value.length === 0) {
        return { type: "null", value: null };
      }
      return arr.value.at(-1) || { type: "null", value: null };
    }

    case "length": {
      if (args.length !== 1) {
        throw new Error("length requires exactly 1 argument");
      }
      const arg = args[0];
      if (!arg) {
        throw new Error("length requires an argument");
      }
      if (arg.type === "array") {
        return { type: "number", value: arg.value.length };
      }
      if (arg.type === "string") {
        return { type: "number", value: arg.value.length };
      }
      if (arg.type === "object") {
        return { type: "number", value: arg.value.size };
      }
      throw new Error(
        "length can only be called on arrays, strings, or objects"
      );
    }

    case "sum": {
      if (args.length !== 1) {
        throw new Error("sum requires exactly 1 argument");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("Argument to sum must be an array");
      }
      let total = 0;
      for (const element of arr.value) {
        if (element.type === "number") {
          total += element.value;
        }
      }
      return { type: "number", value: total };
    }

    case "avg":
    case "average": {
      if (args.length !== 1) {
        throw new Error(`${name} requires exactly 1 argument`);
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error(`Argument to ${name} must be an array`);
      }
      let total = 0;
      let count = 0;
      for (const element of arr.value) {
        if (element.type === "number") {
          total += element.value;
          count++;
        }
      }
      if (count === 0) {
        return { type: "null", value: null };
      }
      return { type: "number", value: total / count };
    }

    case "slice": {
      if (args.length < 2 || args.length > 3) {
        throw new Error("slice requires 2 or 3 arguments");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("First argument to slice must be an array");
      }
      const start = args[1];
      if (!start || start.type !== "number") {
        throw new Error("Start index must be a number");
      }
      const startIndex = Math.floor(start.value);

      let endIndex: number | undefined;
      if (args.length === 3) {
        const end = args[2];
        if (!end || end.type !== "number") {
          throw new Error("End index must be a number");
        }
        endIndex = Math.floor(end.value);
      }

      const newElements = arr.value.slice(startIndex, endIndex);
      return { type: "array", value: newElements };
    }

    default:
      throw new Error(`Unknown array function: ${name}`);
  }
}

export function evaluateObjectFunction(
  name: string,
  args: CalculatedValue[]
): CalculatedValue {
  switch (name) {
    case "keys": {
      if (args.length !== 1) {
        throw new Error("keys requires exactly 1 argument");
      }
      const obj = args[0];
      if (!obj || obj.type !== "object") {
        throw new Error("Argument to keys must be an object");
      }
      const keys = Array.from(obj.value.keys()).map(
        (key): CalculatedValue => ({ type: "string", value: key })
      );
      return { type: "array", value: keys };
    }

    case "values": {
      if (args.length !== 1) {
        throw new Error("values requires exactly 1 argument");
      }
      const obj = args[0];
      if (!obj || obj.type !== "object") {
        throw new Error("Argument to values must be an object");
      }
      const values = Array.from(obj.value.values());
      return { type: "array", value: values };
    }

    case "has": {
      if (args.length !== 2) {
        throw new Error("has requires exactly 2 arguments");
      }
      const obj = args[0];
      if (!obj || obj.type !== "object") {
        throw new Error("First argument to has must be an object");
      }
      const key = args[1];
      if (!key || key.type !== "string") {
        throw new Error("Second argument to has must be a string");
      }
      return { type: "boolean", value: obj.value.has(key.value) };
    }

    default:
      throw new Error(`Unknown object function: ${name}`);
  }
}
