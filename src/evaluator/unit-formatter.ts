import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { CalculatedValue } from "../types";
import type { Decimal } from "../utils/decimal-math";
import { fromDecimal } from "../utils/decimal-math";
import { TimezoneManager } from "../utils/timezone-manager";
import type { DimensionMap } from "./dimensions";
import { TIME_CONVERSIONS } from "./dimensions";

// Regex patterns
const LOWERCASE_CURRENCY_PATTERN = /^[a-z]{3}$/;
const UTC_OFFSET_PATTERN = /^utc([+-]\d+)$/i;
const ISO_DATE_TIME_PATTERN =
  /(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;
const TRAILING_ZEROS_AFTER_DECIMAL = /\.?0+$/;
const FRACTIONAL_SECONDS_TRAILING_ZEROS = /\.?0+$/;
const _INVALID_CHARS_IN_NUMBER = /[^0-9.e+-]/gi;

// Helper functions for date formatting
function getDateFormatPattern(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number
): string {
  if (hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
    return "yyyy-MM-dd";
  }
  if (seconds === 0 && milliseconds === 0) {
    return "yyyy-MM-dd'T'HH:mm";
  }
  if (milliseconds === 0) {
    return "yyyy-MM-dd'T'HH:mm:ss";
  }
  return "yyyy-MM-dd'T'HH:mm:ss.SSS";
}

function formatLocalDate(date: Date): { formatted: string; tzName: string } {
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const ms = date.getMilliseconds();

  const pattern = getDateFormatPattern(h, m, s, ms);
  return { formatted: format(date, pattern), tzName: "local" };
}

function resolveTimezone(tz: string): string {
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
}

function formatDateFromComponents(
  datePart: string,
  h: string,
  m: string,
  s: string,
  ms: string
): string {
  const hours = Number.parseInt(h || "0", 10);
  const minutes = Number.parseInt(m || "0", 10);
  const seconds = Number.parseInt(s || "0", 10);
  const milliseconds = Number.parseInt(ms || "0", 10);

  const pattern = getDateFormatPattern(hours, minutes, seconds, milliseconds);

  if (pattern === "yyyy-MM-dd") {
    return datePart || "";
  }
  if (pattern === "yyyy-MM-dd'T'HH:mm") {
    return `${datePart}T${h}:${m}`;
  }
  if (pattern === "yyyy-MM-dd'T'HH:mm:ss") {
    return `${datePart}T${h}:${m}:${s}`;
  }
  return `${datePart}T${h}:${m}:${s}.${ms}`;
}

// Common derived units and their dimensional representations
export const DERIVED_UNITS: Record<string, DimensionMap> = {
  // Force
  N: {
    mass: { exponent: 1, unit: "kg" },
    length: { exponent: 1, unit: "m" },
    time: { exponent: -2, unit: "s" },
  },

  // Energy
  J: {
    mass: { exponent: 1, unit: "kg" },
    length: { exponent: 2, unit: "m" },
    time: { exponent: -2, unit: "s" },
  },

  // Power
  W: {
    mass: { exponent: 1, unit: "kg" },
    length: { exponent: 2, unit: "m" },
    time: { exponent: -3, unit: "s" },
  },

  // Pressure
  Pa: {
    mass: { exponent: 1, unit: "kg" },
    length: { exponent: -1, unit: "m" },
    time: { exponent: -2, unit: "s" },
  },

  // Electric charge
  C: { current: { exponent: 1, unit: "A" }, time: { exponent: 1, unit: "s" } },

  // Voltage
  V: {
    mass: { exponent: 1, unit: "kg" },
    length: { exponent: 2, unit: "m" },
    time: { exponent: -3, unit: "s" },
    current: { exponent: -1, unit: "A" },
  },

  // Resistance
  Ω: {
    mass: { exponent: 1, unit: "kg" },
    length: { exponent: 2, unit: "m" },
    time: { exponent: -3, unit: "s" },
    current: { exponent: -2, unit: "A" },
  },

  // Frequency
  Hz: { time: { exponent: -1, unit: "s" } },
};

// Get base unit symbol for a dimension
export function getBaseUnitSymbol(dimension: keyof DimensionMap): string {
  switch (dimension) {
    case "length":
      return "m";
    case "mass":
      return "kg";
    case "time":
      return "s";
    case "current":
      return "A";
    case "temperature":
      return "K";
    case "amount":
      return "mol";
    case "luminosity":
      return "cd";
    case "angle":
      return "rad";
    case "currency":
      return "USD";
    default:
      return dimension;
  }
}

// Check if two dimension maps are equal
export function dimensionsEqual(a: DimensionMap, b: DimensionMap): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i] as keyof DimensionMap;
    if (key !== keysB[i]) {
      return false;
    }

    const dimA = a[key];
    const dimB = b[key as keyof DimensionMap];

    if (!(dimA && dimB) || dimA.exponent !== dimB.exponent) {
      return false;
    }
  }

  return true;
}

// Find the best unit to display given dimensions
export function findBestUnit(dimensions: DimensionMap): string | undefined {
  // Check for exact matches with derived units
  for (const [unit, dims] of Object.entries(DERIVED_UNITS)) {
    if (dimensionsEqual(dimensions, dims)) {
      return unit;
    }
  }

  // If no exact match, build compound unit string
  return buildCompoundUnitString(dimensions);
}

// Format exponent as superscript if possible
function formatExponent(exp: number): string {
  if (exp === 1) {
    return "";
  }

  // Try to use Unicode superscripts
  const superscripts: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "-": "⁻",
  };

  const expStr = exp.toString();
  let result = "";
  for (const char of expStr) {
    result += superscripts[char] || `^${char}`;
  }

  return result;
}

// Build compound unit string from dimensions
export function buildCompoundUnitString(dimensions: DimensionMap): string {
  const positive: string[] = [];
  const negative: string[] = [];

  for (const [dim, info] of Object.entries(dimensions) as [
    keyof DimensionMap,
    NonNullable<DimensionMap[keyof DimensionMap]>,
  ][]) {
    // Use the unit specified in the dimension, or fall back to base unit
    let unitSymbol: string;
    if (dim === "currency") {
      const currencyInfo = info as { exponent: number; code: string };
      unitSymbol = currencyInfo.code;
    } else if ("unit" in info && info.unit) {
      unitSymbol = info.unit;
    } else {
      unitSymbol = getBaseUnitSymbol(dim);
    }

    const exp = info.exponent;

    if (exp > 0) {
      positive.push(
        exp === 1 ? unitSymbol : `${unitSymbol}${formatExponent(exp)}`
      );
    } else {
      negative.push(
        exp === -1 ? unitSymbol : `${unitSymbol}${formatExponent(-exp)}`
      );
    }
  }

  if (negative.length === 0) {
    return positive.join("⋅");
  }
  if (positive.length === 0) {
    return `1/${negative.join("⋅")}`;
  }
  return `${positive.join("⋅")}/${negative.join("⋅")}`;
}

// Helper to format seconds value
function formatSecondsValue(seconds: number): string {
  if (seconds % 1 === 0) {
    return seconds.toString();
  }
  return seconds.toFixed(3).replace(FRACTIONAL_SECONDS_TRAILING_ZEROS, "");
}

// Regex for extracting minutes from time parts
const MINUTES_PATTERN = /^(\d+)min$/;

// Helper to handle rounding of seconds to minutes
function handleRoundedMinute(
  parts: string[],
  divisors: { value: number; label: string }[]
): void {
  const minIndex = parts.findIndex((p) => p.endsWith("min"));
  if (minIndex >= 0 && parts[minIndex]) {
    // Extract the number and increment
    const match = parts[minIndex].match(MINUTES_PATTERN);
    if (match?.[1]) {
      parts[minIndex] = `${Number.parseInt(match[1], 10) + 1}min`;
    }
  } else {
    // Add 1min to parts in the right position
    const minuteDivisorIndex = divisors.findIndex((d) => d.label === "min");
    if (minuteDivisorIndex >= 0) {
      // Count how many parts we already have before minutes
      let insertIndex = 0;
      for (let i = 0; i < minuteDivisorIndex; i++) {
        const divisor = divisors[i];
        if (divisor && parts.some((p) => p.endsWith(divisor.label))) {
          insertIndex++;
        }
      }
      parts.splice(insertIndex, 0, "1min");
    } else {
      parts.push("1min");
    }
  }
}

// Helper to build time parts array
function buildTimeParts(
  totalSeconds: number,
  divisors: { value: number; label: string }[]
): string[] {
  const parts: string[] = [];
  let remaining = totalSeconds;

  for (const { value, label } of divisors) {
    const amount = Math.floor(remaining / value);
    if (amount > 0) {
      parts.push(`${amount}${label}`);
    }
    remaining %= value;
  }

  // Round remaining seconds to avoid floating-point issues
  remaining = Math.round(remaining * 1000) / 1000;

  // Add remaining seconds if any or if no parts
  if (remaining > 0 || parts.length === 0) {
    // If we have exactly 60 seconds due to rounding, convert to 1 minute
    if (remaining >= 59.9995 && remaining < 60.0005 && parts.length > 0) {
      handleRoundedMinute(parts, divisors);
    } else if (remaining > 0.0005) {
      parts.push(`${formatSecondsValue(remaining)}s`);
    }
  }

  return parts;
}

// Format time duration in compound format (e.g., "2h 30min")
function formatTimeDuration(seconds: number, baseUnit?: string): string {
  // Round to nearest millisecond to avoid floating-point precision issues
  const roundedSeconds = Math.round(seconds * 1000) / 1000;
  const absSeconds = Math.abs(roundedSeconds);
  const sign = roundedSeconds < 0 ? "-" : "";

  // For very small values, just show seconds
  if (
    absSeconds < 60 &&
    (!baseUnit || baseUnit === "s" || baseUnit === "seconds")
  ) {
    return `${sign}${formatSecondsValue(absSeconds)}s`;
  }

  // Special handling for weeks as base unit
  if (baseUnit === "week" || baseUnit === "weeks" || baseUnit === "w") {
    const divisors = [
      { value: 604_800, label: "w" },
      { value: 86_400, label: "d" },
      { value: 3600, label: "h" },
      { value: 60, label: "min" },
    ];
    const parts = buildTimeParts(absSeconds, divisors);
    return sign + parts.join(" ");
  }

  // Special handling for months as base unit
  if (baseUnit === "month" || baseUnit === "months") {
    const divisors = [
      { value: 2_629_800, label: "mo" },
      { value: 86_400, label: "d" },
      { value: 3600, label: "h" },
      { value: 60, label: "min" },
    ];
    const parts = buildTimeParts(absSeconds, divisors);
    return sign + parts.join(" ");
  }

  // Standard time formatting (skip weeks)
  const divisors = [
    { value: 2_629_800, label: "mo" }, // Average month
    { value: 86_400, label: "d" },
    { value: 3600, label: "h" },
    { value: 60, label: "min" },
  ];
  const parts = buildTimeParts(absSeconds, divisors);
  return sign + parts.join(" ");
}

// Format a quantity with its best unit representation
export function formatQuantity(
  value: Decimal,
  dimensions: DimensionMap,
  precision?: number
): string {
  // Special formatting for time quantities
  if (
    Object.keys(dimensions).length === 1 &&
    dimensions.time &&
    dimensions.time.exponent === 1
  ) {
    const timeUnit = dimensions.time.unit;
    if (timeUnit) {
      const conversions = TIME_CONVERSIONS[timeUnit];
      if (conversions) {
        const seconds = fromDecimal(
          value
            .times(conversions.coefficient)
            .times(10 ** (conversions.exponent || 0))
        );

        // Only use compound format if the value has fractional parts in the current unit
        // This way "150 minutes" stays as "150 minutes" but "2.5 hours" becomes "2h 30min"

        // Check if the value is a whole number in the current unit
        const valueNum = fromDecimal(value);
        const roundedValue = Math.round(valueNum);
        const isWholeNumber = Math.abs(valueNum - roundedValue) < 0.0001;

        // Also check if the value has many decimal places (likely from calculation)
        const valueStr = value.toString();
        const decimalPart = valueStr.split(".")[1];
        const hasLongDecimal =
          valueStr.includes(".") && decimalPart && decimalPart.length > 6;

        if (!isWholeNumber || hasLongDecimal) {
          // If it's very close to a whole number but has long decimals, round it
          if (isWholeNumber && hasLongDecimal) {
            return formatTimeDuration(seconds, timeUnit);
          }
          // Value has fractional parts, use compound format for better readability
          return formatTimeDuration(seconds, timeUnit);
        }
      }
    }
  }

  const unit = findBestUnit(dimensions);
  let formattedValue: string;

  if (precision !== undefined) {
    formattedValue = value.toFixed(precision);
    // Remove trailing zeros after decimal point
    if (formattedValue.includes(".")) {
      formattedValue = formattedValue.replace(TRAILING_ZEROS_AFTER_DECIMAL, "");
    }
  } else {
    formattedValue = value.toFixed(0);
  }

  if (unit) {
    return `${formattedValue} ${unit}`;
  }
  return formattedValue;
}

// Get dimension type name for type checking
export function getDimensionTypeName(dimensions: DimensionMap): string {
  // Check for known derived types
  for (const [unit, dims] of Object.entries(DERIVED_UNITS)) {
    if (dimensionsEqual(dimensions, dims)) {
      switch (unit) {
        case "N":
          return "force";
        case "J":
          return "energy";
        case "W":
          return "power";
        case "Pa":
          return "pressure";
        case "C":
          return "charge";
        case "V":
          return "voltage";
        case "Ω":
          return "resistance";
        case "Hz":
          return "frequency";
        default:
          return "quantity";
      }
    }
  }

  // Check for simple dimensions
  const keys = Object.keys(dimensions);
  if (keys.length === 1) {
    const [dim] = keys;
    const info = dimensions[dim as keyof DimensionMap];

    if (!info) {
      return "quantity";
    }

    if (info.exponent === 1) {
      switch (dim) {
        case "length":
          return "length";
        case "mass":
          return "mass";
        case "time":
          return "time";
        case "current":
          return "current";
        case "temperature":
          return "temperature";
        case "angle":
          return "angle";
        case "currency":
          return "currency";
        default:
          return "quantity";
      }
    }
    if (dim === "length" && info.exponent === 2) {
      return "area";
    }
    if (dim === "length" && info.exponent === 3) {
      return "volume";
    }
  }

  // Check for velocity (length/time)
  if (
    keys.length === 2 &&
    dimensions.length?.exponent === 1 &&
    dimensions.time?.exponent === -1
  ) {
    return "velocity";
  }

  // Check for acceleration (length/time²)
  if (
    keys.length === 2 &&
    dimensions.length?.exponent === 1 &&
    dimensions.time?.exponent === -2
  ) {
    return "acceleration";
  }

  // Default to 'quantity' for compound units
  return "quantity";
}

// Format a unit string for display (e.g. convert usd to USD)
export function formatUnit(unit: string): string {
  // Currency codes should be uppercase
  if (LOWERCASE_CURRENCY_PATTERN.test(unit)) {
    return unit.toUpperCase();
  }
  return unit;
}

// Format a result with its unit (for legacy compatibility)
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This function handles many cases and refactoring would reduce readability
export function formatResultWithUnit(
  value: CalculatedValue | number,
  unit?: string,
  precision?: number
): string {
  // Handle legacy number with unit
  if (typeof value === "number") {
    const formattedValue =
      precision !== undefined ? value.toFixed(precision) : value.toString();
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  }

  // Handle CalculatedValue
  switch (value.type) {
    case "number": {
      // Check if the number has a format specified
      if (value.format === "binary") {
        const intValue = value.value.floor();
        const isNegative = intValue.isNegative();
        const absValue = intValue.abs();
        const num = absValue.toNumber();
        const binaryStr = `0b${num.toString(2)}`;
        return isNegative ? `-${binaryStr}` : binaryStr;
      }
      if (value.format === "hex") {
        const intValue = value.value.floor();
        const isNegative = intValue.isNegative();
        const absValue = intValue.abs();
        const num = absValue.toNumber();
        const hexStr = `0x${num.toString(16)}`;
        return isNegative ? `-${hexStr}` : hexStr;
      }

      // Default decimal formatting
      const num = fromDecimal(value.value);
      let formattedNum: string;

      // Handle very large or very small numbers with scientific notation
      if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-5 && num !== 0)) {
        formattedNum =
          precision !== undefined
            ? num.toExponential(precision)
            : num.toExponential();
      } else if (precision !== undefined) {
        formattedNum = num.toFixed(precision);
        // Remove trailing zeros after decimal point
        if (formattedNum.includes(".")) {
          formattedNum = formattedNum.replace(TRAILING_ZEROS_AFTER_DECIMAL, "");
        }
      } else {
        formattedNum = num.toString();
      }
      return formattedNum;
    }

    case "quantity":
      return formatQuantity(value.value, value.dimensions, precision);

    case "string":
      return value.value;

    case "date": {
      const formatDateInTimezone = (
        date: Date,
        tz: string | undefined
      ): { formatted: string; tzName: string } => {
        // Handle local timezone
        if (!tz || tz === "local") {
          return formatLocalDate(date);
        }

        // Resolve timezone name
        const tzName = resolveTimezone(tz);

        // Get time components in the target timezone
        const fullFormatted = formatInTimeZone(
          date,
          tzName,
          "yyyy-MM-dd'T'HH:mm:ss.SSS"
        );
        const match = fullFormatted.match(ISO_DATE_TIME_PATTERN);

        if (match) {
          const [, datePart, h, m, s, ms] = match;
          const formatted = formatDateFromComponents(
            datePart || "",
            h || "00",
            m || "00",
            s || "00",
            ms || "000"
          );
          return { formatted, tzName: tz };
        }

        return { formatted: fullFormatted, tzName: tz };
      };

      try {
        const { formatted } = formatDateInTimezone(value.value, value.timezone);
        const displayTz = value.timezone || "local";
        return `${formatted}@${displayTz}`;
      } catch {
        // Fallback to UTC
        const formatted = formatInTimeZone(
          value.value,
          "UTC",
          "yyyy-MM-dd'T'HH:mm:ss.SSS"
        );
        return `${formatted}@${value.timezone || "local"}`;
      }
    }

    case "boolean":
      return value.value ? "true" : "false";

    case "null":
      return "null";

    case "array":
      return `[${value.value.map((v) => formatResultWithUnit(v)).join(", ")}]`;

    case "object": {
      const entries: string[] = [];
      for (const [key, val] of value.value) {
        entries.push(`${key}: ${formatResultWithUnit(val)}`);
      }
      return `{${entries.join(", ")}}`;
    }

    case "percentage": {
      let formattedNum: string;
      if (precision !== undefined) {
        formattedNum = value.value.toFixed(precision);
        // Remove trailing zeros after decimal point
        if (formattedNum.includes(".")) {
          formattedNum = formattedNum.replace(TRAILING_ZEROS_AFTER_DECIMAL, "");
        }
      } else {
        formattedNum = value.value.toString();
      }
      return `${formattedNum}%`;
    }

    case "function":
      return `<function ${value.value.name}(${value.value.parameters.join(", ")})>`;

    case "lambda":
      return `<lambda(${value.value.parameters.join(", ")})>`;

    case "partial":
      return `<partial(${value.value.remainingParams.join(", ")})>`;

    case "markdown":
      // Return empty string - markdown will be rendered separately in UI
      return "";

    default: {
      // Exhaustive check
      const _exhaustiveCheck: never = value;
      return _exhaustiveCheck;
    }
  }
}
