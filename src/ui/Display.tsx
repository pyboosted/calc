import { Box, Text } from "ink";
import type React from "react";
import { formatUnit } from "../evaluator/unit-formatter";
import type { CalculatedValue } from "../types";

interface DisplayProps {
  result: CalculatedValue | null;
  error: string | null;
  input: string;
}

export const Display: React.FC<DisplayProps> = ({ result, error, input }) => {
  if (error) {
    return (
      <Box>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  if (result !== null && input.trim()) {
    const formattedResult = formatResult(result);
    return (
      <Box>
        <Text bold color="green">
          = {formattedResult}
        </Text>
      </Box>
    );
  }

  return null;
};

function formatResult(result: CalculatedValue): string {
  switch (result.type) {
    case "string":
      return `"${result.value}"`;
    case "number": {
      const formattedNumber = formatNumber(result.value);
      if (result.unit) {
        return `${formattedNumber} ${formatUnit(result.unit)}`;
      }
      return formattedNumber;
    }
    case "date":
      return result.value.toISOString();
    case "boolean":
      return result.value ? "true" : "false";
    case "null":
      return "null";
    case "array":
      return formatArray(result.value);
    case "object":
      return formatObject(result.value);
    default: {
      // Exhaustive check
      const _exhaustiveCheck: never = result;
      return _exhaustiveCheck;
    }
  }
}

function formatArray(arr: CalculatedValue[]): string {
  if (arr.length === 0) {
    return "[]";
  }

  const MAX_ITEMS = 5;
  const items = arr.slice(0, MAX_ITEMS);
  const formatted = items.map((item) => formatResult(item)).join(", ");

  if (arr.length > MAX_ITEMS) {
    return `[${formatted}, ... (${arr.length - MAX_ITEMS} more)]`;
  }

  return `[${formatted}]`;
}

function formatObject(obj: Map<string, CalculatedValue>): string {
  if (obj.size === 0) {
    return "{}";
  }

  const MAX_ITEMS = 5;
  const entries: string[] = [];
  let count = 0;

  for (const [key, value] of obj) {
    if (count >= MAX_ITEMS) {
      entries.push(`... (${obj.size - MAX_ITEMS} more)`);
      break;
    }
    entries.push(`${key}: ${formatResult(value)}`);
    count++;
  }

  return `{${entries.join(", ")}}`;
}

function formatNumber(num: number): string {
  // Handle very large or very small numbers with scientific notation
  if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-5 && num !== 0)) {
    return num.toExponential(6);
  }

  // Round to reasonable precision
  const rounded = Math.round(num * 1e10) / 1e10;

  // Format with thousands separators
  const parts = rounded.toString().split(".");
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return parts.join(".");
}
