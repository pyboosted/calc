import type { CalculatedValue } from "../types";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Array function evaluation requires multiple type checks and operations
export function evaluateArrayFunction(
  name: string,
  args: CalculatedValue[],
  variables?: Map<string, CalculatedValue>
): CalculatedValue {
  // Handle mutation functions (with ! suffix)
  if (name.endsWith("!")) {
    return evaluateMutatingArrayFunction(name, args, variables);
  }

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
      // Create a new array with the added elements (non-mutating)
      const newArray = [...arr.value, ...itemsToAdd];
      return { type: "array", value: newArray };
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
        // Return the original array unchanged for empty array
        return arr;
      }
      // Create a new array without the last element (non-mutating)
      const newArray = arr.value.slice(0, -1);
      return { type: "array", value: newArray };
    }

    case "shift": {
      if (args.length !== 1) {
        throw new Error("shift requires exactly 1 argument");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("Argument to shift must be an array");
      }
      if (arr.value.length === 0) {
        // Return the original array unchanged for empty array
        return arr;
      }
      // Create a new array without the first element (non-mutating)
      const newArray = arr.value.slice(1);
      return { type: "array", value: newArray };
    }

    case "unshift": {
      if (args.length < 2) {
        throw new Error("unshift requires at least 2 arguments");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("First argument to unshift must be an array");
      }
      // Get the items to add at the beginning
      const itemsToAdd = args.slice(1);
      // Create a new array with items at the beginning (non-mutating)
      const newArray = [...itemsToAdd, ...arr.value];
      return { type: "array", value: newArray };
    }

    case "append": {
      if (args.length !== 2) {
        throw new Error("append requires exactly 2 arguments");
      }
      const arr1 = args[0];
      const arr2 = args[1];
      if (!arr1 || arr1.type !== "array") {
        throw new Error("First argument to append must be an array");
      }
      if (!arr2 || arr2.type !== "array") {
        throw new Error("Second argument to append must be an array");
      }
      // Create a new array by concatenating both arrays
      const newArray = [...arr1.value, ...arr2.value];
      return { type: "array", value: newArray };
    }

    case "prepend": {
      if (args.length !== 2) {
        throw new Error("prepend requires exactly 2 arguments");
      }
      const arr1 = args[0];
      const arr2 = args[1];
      if (!arr1 || arr1.type !== "array") {
        throw new Error("First argument to prepend must be an array");
      }
      if (!arr2 || arr2.type !== "array") {
        throw new Error("Second argument to prepend must be an array");
      }
      // Create a new array with arr2 elements before arr1 elements
      const newArray = [...arr2.value, ...arr1.value];
      return { type: "array", value: newArray };
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

    case "find": {
      if (args.length !== 2) {
        throw new Error("find requires exactly 2 arguments");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("First argument to find must be an array");
      }
      const predicate = args[1];
      if (!predicate || predicate.type !== "lambda") {
        throw new Error("Second argument to find must be a lambda function");
      }
      if (predicate.value.parameters.length !== 1) {
        throw new Error("find predicate must take exactly 1 parameter");
      }

      // Import evaluateLambda from lambda-functions
      const { evaluateLambda } = require("./lambda-functions");

      // Find the first element that satisfies the predicate
      for (const element of arr.value) {
        const result = evaluateLambda(
          predicate.value,
          [element],
          variables || new Map()
        );
        // Check for truthiness
        let isTruthy = false;
        if (result.type === "boolean") {
          isTruthy = result.value;
        } else if (result.type === "number") {
          isTruthy = result.value !== 0;
        } else if (result.type === "string") {
          isTruthy = result.value !== "";
        } else if (result.type !== "null") {
          isTruthy = true;
        }

        if (isTruthy) {
          return element;
        }
      }

      // No element found
      return { type: "null", value: null };
    }

    case "findIndex": {
      if (args.length !== 2) {
        throw new Error("findIndex requires exactly 2 arguments");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("First argument to findIndex must be an array");
      }
      const predicate = args[1];
      if (!predicate || predicate.type !== "lambda") {
        throw new Error(
          "Second argument to findIndex must be a lambda function"
        );
      }
      if (predicate.value.parameters.length !== 1) {
        throw new Error("findIndex predicate must take exactly 1 parameter");
      }

      // Import evaluateLambda from lambda-functions
      const { evaluateLambda } = require("./lambda-functions");

      // Find the index of the first element that satisfies the predicate
      for (let i = 0; i < arr.value.length; i++) {
        const element = arr.value[i];
        const result = evaluateLambda(
          predicate.value,
          [element],
          variables || new Map()
        );
        // Check for truthiness
        let isTruthy = false;
        if (result.type === "boolean") {
          isTruthy = result.value;
        } else if (result.type === "number") {
          isTruthy = result.value !== 0;
        } else if (result.type === "string") {
          isTruthy = result.value !== "";
        } else if (result.type !== "null") {
          isTruthy = true;
        }

        if (isTruthy) {
          return { type: "number", value: i };
        }
      }

      // No element found, return -1 like JavaScript
      return { type: "number", value: -1 };
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Mutation function evaluation requires multiple type checks and operations
function evaluateMutatingArrayFunction(
  name: string,
  args: CalculatedValue[],
  variables?: Map<string, CalculatedValue>
): CalculatedValue {
  const baseName = name.slice(0, -1); // Remove the ! suffix

  switch (baseName) {
    case "push": {
      if (args.length < 2) {
        throw new Error("push! requires at least 2 arguments");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("First argument to push! must be an array");
      }
      // Get the items to add
      const itemsToAdd = args.slice(1);
      // Mutate the array by adding elements
      arr.value.push(...itemsToAdd);
      return arr;
    }

    case "pop": {
      if (args.length !== 1) {
        throw new Error("pop! requires exactly 1 argument");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("Argument to pop! must be an array");
      }
      if (arr.value.length > 0) {
        arr.value.pop();
      }
      return arr;
    }

    case "shift": {
      if (args.length !== 1) {
        throw new Error("shift! requires exactly 1 argument");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("Argument to shift! must be an array");
      }
      if (arr.value.length > 0) {
        arr.value.shift();
      }
      return arr;
    }

    case "unshift": {
      if (args.length < 2) {
        throw new Error("unshift! requires at least 2 arguments");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("First argument to unshift! must be an array");
      }
      // Get the items to add at the beginning
      const itemsToAdd = args.slice(1);
      // Mutate the array by adding elements at the beginning
      arr.value.unshift(...itemsToAdd);
      return arr;
    }

    case "append": {
      if (args.length !== 2) {
        throw new Error("append! requires exactly 2 arguments");
      }
      const arr1 = args[0];
      const arr2 = args[1];
      if (!arr1 || arr1.type !== "array") {
        throw new Error("First argument to append! must be an array");
      }
      if (!arr2 || arr2.type !== "array") {
        throw new Error("Second argument to append! must be an array");
      }
      // Mutate arr1 by adding all elements from arr2
      arr1.value.push(...arr2.value);
      return arr1;
    }

    case "prepend": {
      if (args.length !== 2) {
        throw new Error("prepend! requires exactly 2 arguments");
      }
      const arr1 = args[0];
      const arr2 = args[1];
      if (!arr1 || arr1.type !== "array") {
        throw new Error("First argument to prepend! must be an array");
      }
      if (!arr2 || arr2.type !== "array") {
        throw new Error("Second argument to prepend! must be an array");
      }
      // Mutate arr1 by adding all elements from arr2 at the beginning
      arr1.value.unshift(...arr2.value);
      return arr1;
    }

    case "slice": {
      if (args.length < 2 || args.length > 3) {
        throw new Error("slice! requires 2 or 3 arguments");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("First argument to slice! must be an array");
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

      // Mutate the array by replacing it with the sliced content
      const sliced = arr.value.slice(startIndex, endIndex);
      arr.value.length = 0; // Clear the array
      arr.value.push(...sliced); // Add the sliced elements
      return arr;
    }

    case "filter": {
      if (args.length !== 2) {
        throw new Error("filter! requires exactly 2 arguments");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("First argument to filter! must be an array");
      }
      const predicate = args[1];
      if (!predicate || predicate.type !== "lambda") {
        throw new Error("Second argument to filter! must be a lambda function");
      }
      if (predicate.value.parameters.length !== 1) {
        throw new Error("filter! predicate must take exactly 1 parameter");
      }

      // Import evaluateLambda from lambda-functions
      const { evaluateLambda } = require("./lambda-functions");

      // Filter the array in place
      const filtered: CalculatedValue[] = [];
      for (const element of arr.value) {
        const result = evaluateLambda(
          predicate.value,
          [element],
          variables || new Map()
        );
        // Check for truthiness
        let isTruthy = false;
        if (result.type === "boolean") {
          isTruthy = result.value;
        } else if (result.type === "number") {
          isTruthy = result.value !== 0;
        } else if (result.type === "string") {
          isTruthy = result.value !== "";
        } else if (result.type !== "null") {
          isTruthy = true;
        }

        if (isTruthy) {
          filtered.push(element);
        }
      }

      // Replace array contents
      arr.value.length = 0;
      arr.value.push(...filtered);
      return arr;
    }

    case "map": {
      if (args.length !== 2) {
        throw new Error("map! requires exactly 2 arguments");
      }
      const arr = args[0];
      if (!arr || arr.type !== "array") {
        throw new Error("First argument to map! must be an array");
      }
      const transform = args[1];
      if (!transform || transform.type !== "lambda") {
        throw new Error("Second argument to map! must be a lambda function");
      }
      if (transform.value.parameters.length !== 1) {
        throw new Error("map! transform must take exactly 1 parameter");
      }

      // Import evaluateLambda from lambda-functions
      const { evaluateLambda } = require("./lambda-functions");

      // Map the array in place
      for (let i = 0; i < arr.value.length; i++) {
        arr.value[i] = evaluateLambda(
          transform.value,
          [arr.value[i]],
          variables || new Map()
        );
      }

      return arr;
    }

    default:
      throw new Error(`Unknown mutating array function: ${name}`);
  }
}
