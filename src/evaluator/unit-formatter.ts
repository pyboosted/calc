import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { CalculatedValue } from "../types";
import { TimezoneManager } from "../utils/timezone-manager";
import type { DimensionMap } from "./dimensions";

// Regex patterns
const LOWERCASE_CURRENCY_PATTERN = /^[a-z]{3}$/;
const UTC_OFFSET_PATTERN = /^utc([+-]\d+)$/i;
const ISO_DATE_TIME_PATTERN =
  /(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;

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

// Format a quantity with its best unit representation
export function formatQuantity(
  value: number,
  dimensions: DimensionMap,
  precision?: number
): string {
  const unit = findBestUnit(dimensions);
  const formattedValue =
    precision !== undefined ? value.toFixed(precision) : value.toString();

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
      const formattedNum =
        precision !== undefined
          ? value.value.toFixed(precision)
          : value.value.toString();
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

    case "percentage":
      return `${value.value}%`;

    case "function":
      return `<function ${value.value.name}(${value.value.parameters.join(", ")})>`;

    case "lambda":
      return `<lambda(${value.value.parameters.join(", ")})>`;

    default: {
      // Exhaustive check
      const _exhaustiveCheck: never = value;
      return _exhaustiveCheck;
    }
  }
}
