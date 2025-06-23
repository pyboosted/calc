import { Box, Text } from "ink";
import type React from "react";
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
        <Text color="green" bold>
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
    // Format unit nicely
    const formattedUnit = formatUnit(result.unit);
    return `${formattedNumber} ${formattedUnit}`;
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

function formatUnit(unit: string): string {
  // Convert some common unit variations to their standard display form
  const unitDisplay: Record<string, string> = {
    meter: "meters",
    meters: "meters",
    m: "m",
    centimeter: "cm",
    centimeters: "cm",
    cm: "cm",
    millimeter: "mm",
    millimeters: "mm",
    mm: "mm",
    kilometer: "km",
    kilometers: "km",
    km: "km",
    inch: "inches",
    inches: "inches",
    in: "in",
    foot: "feet",
    feet: "feet",
    ft: "ft",
    yard: "yards",
    yards: "yards",
    yd: "yd",
    mile: "miles",
    miles: "miles",
    mi: "mi",
    gram: "grams",
    grams: "grams",
    g: "g",
    kilogram: "kg",
    kilograms: "kg",
    kg: "kg",
    pound: "pounds",
    pounds: "pounds",
    lb: "lb",
    lbs: "lbs",
    ounce: "ounces",
    ounces: "ounces",
    oz: "oz",
    celsius: "°C",
    c: "°C",
    fahrenheit: "°F",
    f: "°F",
    kelvin: "K",
    k: "K",
    second: "seconds",
    seconds: "seconds",
    s: "s",
    sec: "sec",
    minute: "minutes",
    minutes: "minutes",
    min: "min",
    hour: "hours",
    hours: "hours",
    h: "h",
    day: "days",
    days: "days",
    d: "d",
    week: "weeks",
    weeks: "weeks",
    month: "months",
    months: "months",
    year: "years",
    years: "years",
    yr: "yr",
    liter: "liters",
    liters: "liters",
    l: "L",
    milliliter: "ml",
    milliliters: "ml",
    ml: "ml",
    gallon: "gallons",
    gallons: "gallons",
    gal: "gal",
    byte: "bytes",
    bytes: "bytes",
    b: "B",
    kilobyte: "KB",
    kilobytes: "KB",
    kb: "KB",
    megabyte: "MB",
    megabytes: "MB",
    mb: "MB",
    gigabyte: "GB",
    gigabytes: "GB",
    gb: "GB",
    terabyte: "TB",
    terabytes: "TB",
    tb: "TB",
  };

  return unitDisplay[unit.toLowerCase()] || unit;
}
