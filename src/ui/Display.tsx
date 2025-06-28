import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Box, Text } from "ink";
import type React from "react";
import type { CalculatedValue } from "../types";
import { ConfigManager } from "../utils/config-manager";
import type { Decimal } from "../utils/decimal-math";
import { fromDecimal } from "../utils/decimal-math";
import { TimezoneManager } from "../utils/timezone-manager";

// Performance optimization: Move regex to module level
const UTC_OFFSET_PATTERN = /^utc([+-]\d+)$/i;
const THOUSANDS_SEPARATOR_PATTERN = /\B(?=(\d{3})+(?!\d))/g;
const TRAILING_ZEROS_PATTERN = /0+$/;
const ISO_DATE_TIME_PATTERN =
  /(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;

function formatDate(date: Date, timezone?: string): string {
  // Helper to get the appropriate timezone name for formatting
  const getTimezoneForFormatting = (tz: string | undefined): string => {
    if (!tz || tz === "local") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    if (tz === "utc") {
      return "UTC";
    }

    // Handle UTC offset formats
    const utcOffsetMatch = tz.match(UTC_OFFSET_PATTERN);
    if (utcOffsetMatch) {
      const offset = Number.parseInt(utcOffsetMatch[1] || "0", 10);
      const absOffset = Math.abs(offset);
      // Note: Etc/GMT zones have inverted signs
      return `Etc/GMT${offset > 0 ? "-" : "+"}${absOffset}`;
    }

    // Try to get the IANA timezone name
    const timezoneManager = TimezoneManager.getInstance();
    const ianaTimezone = timezoneManager.getTimezone(tz);
    return ianaTimezone || tz;
  };

  try {
    const tzName = getTimezoneForFormatting(timezone);

    // Format with full precision first to check components
    const fullFormatted =
      timezone && timezone !== "local"
        ? formatInTimeZone(date, tzName, "yyyy-MM-dd'T'HH:mm:ss.SSS")
        : format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS");

    // Parse the formatted string to check time components
    const match = fullFormatted.match(ISO_DATE_TIME_PATTERN);

    if (match) {
      const [, datePart, h, m, s, ms] = match;
      const hours = Number.parseInt(h || "0", 10);
      const minutes = Number.parseInt(m || "0", 10);
      const seconds = Number.parseInt(s || "0", 10);
      const milliseconds = Number.parseInt(ms || "0", 10);

      let formattedDate: string;
      if (hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
        formattedDate = datePart || "";
      } else if (seconds === 0 && milliseconds === 0) {
        formattedDate = `${datePart}T${h}:${m}`;
      } else if (milliseconds === 0) {
        formattedDate = `${datePart}T${h}:${m}:${s}`;
      } else {
        formattedDate = fullFormatted;
      }

      // Add timezone suffix
      const displayTz = timezone || "local";
      return `${formattedDate}@${displayTz}`;
    }

    // Fallback
    const displayTz = timezone || "local";
    return `${fullFormatted}@${displayTz}`;
  } catch {
    // Error fallback
    const formatted = format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS");
    const displayTz = timezone || "local";
    return `${formatted}@${displayTz}`;
  }
}

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
      return formattedNumber;
    }
    case "date":
      return formatDate(result.value, result.timezone);
    case "boolean":
      return result.value ? "true" : "false";
    case "null":
      return "null";
    case "array":
      return formatArray(result.value);
    case "object":
      return formatObject(result.value);
    case "quantity": {
      const { formatQuantity } = require("../evaluator/unit-formatter");
      const config = ConfigManager.getInstance();
      return formatQuantity(result.value, result.dimensions, config.precision);
    }
    case "percentage":
      return `${formatNumber(result.value)}%`;
    case "function":
      return `<function ${result.value.name}(${result.value.parameters.join(", ")})>`;
    case "lambda":
      return `<lambda(${result.value.parameters.join(", ")})>`;
    case "partial":
      return `<partial(${result.value.remainingParams.join(", ")})>`;
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

function formatNumber(decimal: Decimal): string {
  const num = fromDecimal(decimal);
  const config = ConfigManager.getInstance();
  const precision = config.precision;

  // Handle very large or very small numbers with scientific notation
  if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-5 && num !== 0)) {
    return num.toExponential(precision);
  }

  // Format with the configured precision
  const formatted = num.toFixed(precision);

  // Format with thousands separators
  const parts = formatted.split(".");
  if (parts[0]) {
    parts[0] = parts[0].replace(THOUSANDS_SEPARATOR_PATTERN, ",");
  }

  // Remove trailing zeros after decimal point if precision > 0
  if (parts[1]) {
    parts[1] = parts[1].replace(TRAILING_ZEROS_PATTERN, "");
    if (parts[1].length === 0) {
      return parts[0] || "";
    }
  }

  return parts.join(".");
}
