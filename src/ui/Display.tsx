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
  const formattedNumber = formatNumber(result.value);

  if (result.unit) {
    // Use the existing formatUnit function from unit-formatter.ts
    return `${formattedNumber} ${formatUnit(result.unit)}`;
  }

  return formattedNumber;
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
