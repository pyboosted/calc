import type { CalculatedValue } from "../types";
import { toDecimal } from "../utils/decimal-math";

/**
 * Evaluates the env() function to read environment variables
 * Returns the value as a string, or null if not found
 */
export function evaluateEnvFunction(args: CalculatedValue[]): CalculatedValue {
  if (args.length !== 1) {
    throw new Error("env() requires exactly one argument");
  }

  const nameArg = args[0];
  if (!nameArg || nameArg.type !== "string") {
    throw new Error("env() argument must be a string");
  }

  const envVarName = nameArg.value as string;
  const value = process.env[envVarName];

  return value !== undefined
    ? { type: "string", value }
    : { type: "null", value: null };
}

/**
 * Evaluates the arg() function to read command-line arguments
 * Priority: stdin → --arg → null
 */
export function evaluateArgFunction(context: {
  stdinData?: string;
  cliArg?: string;
}): CalculatedValue {
  // Priority 1: stdin data (trimmed)
  if (context.stdinData !== undefined) {
    const trimmed = context.stdinData.trim();
    if (trimmed.length > 0) {
      return parseArgument(trimmed);
    }
  }

  // Priority 2: --arg flag
  if (context.cliArg !== undefined) {
    return parseArgument(context.cliArg);
  }

  // Priority 3: null
  return { type: "null", value: null };
}

/**
 * Parses an argument string, attempting to detect its type
 */
function parseArgument(value: string): CalculatedValue {
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(value);

    // Handle different JSON types
    if (parsed === null) {
      return { type: "null", value: null };
    }
    if (typeof parsed === "boolean") {
      return { type: "boolean", value: parsed };
    }
    if (typeof parsed === "number") {
      return { type: "number", value: toDecimal(parsed) };
    }
    if (typeof parsed === "string") {
      return { type: "string", value: parsed };
    }
    if (Array.isArray(parsed)) {
      return {
        type: "array",
        value: parsed.map((item) => parseArgument(JSON.stringify(item))),
      };
    }
    if (typeof parsed === "object") {
      const obj = new Map<string, CalculatedValue>();
      for (const [key, val] of Object.entries(parsed)) {
        obj.set(key, parseArgument(JSON.stringify(val)));
      }
      return { type: "object", value: obj };
    }
  } catch {
    // If not valid JSON, treat as string
  }

  // Default to string
  return { type: "string", value };
}
