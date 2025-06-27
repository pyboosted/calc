import { derivedUnits } from "../data/units";

// Regex patterns
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

// Define unit types for each dimension
export type LengthUnit =
  | "m"
  | "meters"
  | "meter"
  | "km"
  | "kilometers"
  | "kilometer"
  | "cm"
  | "centimeters"
  | "centimeter"
  | "mm"
  | "millimeters"
  | "millimeter"
  | "ft"
  | "feet"
  | "foot"
  | "in"
  | "inches"
  | "inch"
  | "yd"
  | "yards"
  | "yard"
  | "mi"
  | "miles"
  | "mile";
export type MassUnit =
  | "kg"
  | "kilograms"
  | "kilogram"
  | "g"
  | "grams"
  | "gram"
  | "mg"
  | "milligrams"
  | "milligram"
  | "lb"
  | "lbs"
  | "pounds"
  | "pound"
  | "oz"
  | "ounces"
  | "ounce"
  | "t"
  | "ton"
  | "tons";
export type TimeUnit =
  | "s"
  | "second"
  | "seconds"
  | "sec"
  | "min"
  | "minute"
  | "minutes"
  | "h"
  | "hour"
  | "hours"
  | "hr"
  | "day"
  | "days"
  | "d"
  | "week"
  | "weeks"
  | "w"
  | "month"
  | "months"
  | "year"
  | "years"
  | "yr"
  | "ms"
  | "millisecond"
  | "milliseconds";
export type CurrentUnit =
  | "A"
  | "amp"
  | "amps"
  | "ampere"
  | "amperes"
  | "mA"
  | "milliamp"
  | "milliamps"
  | "milliampere"
  | "milliamperes"
  | "μA";
export type TemperatureUnit =
  | "K"
  | "k"
  | "C"
  | "c"
  | "F"
  | "f"
  | "celsius"
  | "fahrenheit"
  | "kelvin";
export type AmountUnit = "mol";
export type LuminosityUnit = "cd";
export type AngleUnit = "rad" | "deg" | "°";
export type VolumeUnit =
  | "l"
  | "L"
  | "liter"
  | "liters"
  | "ml"
  | "milliliter"
  | "milliliters"
  | "gal"
  | "gallon"
  | "gallons"
  | "qt"
  | "quart"
  | "quarts"
  | "pt"
  | "pint"
  | "pints"
  | "cup"
  | "cups"
  | "tbsp"
  | "tablespoon"
  | "tablespoons"
  | "tsp"
  | "teaspoon"
  | "teaspoons"
  | "fl oz"
  | "floz";
export type DataUnit =
  | "byte"
  | "bytes"
  | "b"
  | "kb"
  | "kilobyte"
  | "kilobytes"
  | "mb"
  | "megabyte"
  | "megabytes"
  | "gb"
  | "gigabyte"
  | "gigabytes"
  | "tb"
  | "terabyte"
  | "terabytes"
  | "kib"
  | "kibibyte"
  | "kibibytes"
  | "mib"
  | "mebibyte"
  | "mebibytes"
  | "gib"
  | "gibibyte"
  | "gibibytes";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CNY" | string; // extensible

// DimensionMap with proper typing
export type DimensionMap = {
  length?: { exponent: number; unit?: LengthUnit };
  mass?: { exponent: number; unit?: MassUnit };
  time?: { exponent: number; unit?: TimeUnit };
  current?: { exponent: number; unit?: CurrentUnit };
  temperature?: { exponent: number; unit?: TemperatureUnit };
  amount?: { exponent: number; unit?: AmountUnit };
  luminosity?: { exponent: number; unit?: LuminosityUnit };
  angle?: { exponent: number; unit?: AngleUnit };
  volume?: { exponent: number; unit?: VolumeUnit };
  data?: { exponent: number; unit?: DataUnit };
  currency?: { exponent: number; code: CurrencyCode };
};

// Conversion structure - how to convert FROM this unit TO base unit
export type UnitConversion = {
  coefficient: number; // Multiplication factor
  exponent?: number; // Power of 10 (optional, defaults to 0)
  offset?: number; // For temperature conversions (optional)
};

// All conversions are TO the base unit (meters for length, kg for mass, etc.)
export const LENGTH_CONVERSIONS: Record<LengthUnit, UnitConversion> = {
  // Base unit
  m: { coefficient: 1 },
  meter: { coefficient: 1 },
  meters: { coefficient: 1 },
  // Metric
  km: { coefficient: 1, exponent: 3 },
  kilometer: { coefficient: 1, exponent: 3 },
  kilometers: { coefficient: 1, exponent: 3 },
  cm: { coefficient: 1, exponent: -2 },
  centimeter: { coefficient: 1, exponent: -2 },
  centimeters: { coefficient: 1, exponent: -2 },
  mm: { coefficient: 1, exponent: -3 },
  millimeter: { coefficient: 1, exponent: -3 },
  millimeters: { coefficient: 1, exponent: -3 },
  // Imperial
  ft: { coefficient: 0.3048 },
  foot: { coefficient: 0.3048 },
  feet: { coefficient: 0.3048 },
  in: { coefficient: 0.0254 },
  inch: { coefficient: 0.0254 },
  inches: { coefficient: 0.0254 },
  yd: { coefficient: 0.9144 },
  yard: { coefficient: 0.9144 },
  yards: { coefficient: 0.9144 },
  mi: { coefficient: 1609.34 },
  mile: { coefficient: 1609.34 },
  miles: { coefficient: 1609.34 },
};

export const MASS_CONVERSIONS: Record<MassUnit, UnitConversion> = {
  // Base unit
  kg: { coefficient: 1 },
  kilogram: { coefficient: 1 },
  kilograms: { coefficient: 1 },
  // Metric
  g: { coefficient: 1, exponent: -3 },
  gram: { coefficient: 1, exponent: -3 },
  grams: { coefficient: 1, exponent: -3 },
  mg: { coefficient: 1, exponent: -6 },
  milligram: { coefficient: 1, exponent: -6 },
  milligrams: { coefficient: 1, exponent: -6 },
  t: { coefficient: 1, exponent: 3 },
  ton: { coefficient: 1, exponent: 3 },
  tons: { coefficient: 1, exponent: 3 },
  // Imperial
  lb: { coefficient: 0.453_592 },
  lbs: { coefficient: 0.453_592 },
  pound: { coefficient: 0.453_592 },
  pounds: { coefficient: 0.453_592 },
  oz: { coefficient: 0.028_349_5 },
  ounce: { coefficient: 0.028_349_5 },
  ounces: { coefficient: 0.028_349_5 },
};

export const TIME_CONVERSIONS: Record<TimeUnit, UnitConversion> = {
  // Base unit
  s: { coefficient: 1 },
  sec: { coefficient: 1 },
  second: { coefficient: 1 },
  seconds: { coefficient: 1 },
  ms: { coefficient: 1, exponent: -3 },
  millisecond: { coefficient: 1, exponent: -3 },
  milliseconds: { coefficient: 1, exponent: -3 },
  min: { coefficient: 60 },
  minute: { coefficient: 60 },
  minutes: { coefficient: 60 },
  h: { coefficient: 3600 },
  hr: { coefficient: 3600 },
  hour: { coefficient: 3600 },
  hours: { coefficient: 3600 },
  day: { coefficient: 86_400 },
  days: { coefficient: 86_400 },
  d: { coefficient: 86_400 },
  week: { coefficient: 604_800 }, // 7 * 86400
  weeks: { coefficient: 604_800 },
  w: { coefficient: 604_800 },
  month: { coefficient: 2_629_800 }, // Average month in seconds
  months: { coefficient: 2_629_800 },
  year: { coefficient: 31_557_600 }, // Average year in seconds
  years: { coefficient: 31_557_600 },
  yr: { coefficient: 31_557_600 },
};

export const TEMPERATURE_CONVERSIONS: Record<TemperatureUnit, UnitConversion> =
  {
    // Base unit (Kelvin)
    K: { coefficient: 1 },
    k: { coefficient: 1 },
    kelvin: { coefficient: 1 },
    C: { coefficient: 1, offset: 273.15 },
    c: { coefficient: 1, offset: 273.15 },
    celsius: { coefficient: 1, offset: 273.15 },
    F: { coefficient: 5 / 9, offset: 459.67 },
    f: { coefficient: 5 / 9, offset: 459.67 },
    fahrenheit: { coefficient: 5 / 9, offset: 459.67 },
  };

export const CURRENT_CONVERSIONS: Record<CurrentUnit, UnitConversion> = {
  // Base unit
  A: { coefficient: 1 },
  amp: { coefficient: 1 },
  amps: { coefficient: 1 },
  ampere: { coefficient: 1 },
  amperes: { coefficient: 1 },
  mA: { coefficient: 1, exponent: -3 },
  milliamp: { coefficient: 1, exponent: -3 },
  milliamps: { coefficient: 1, exponent: -3 },
  milliampere: { coefficient: 1, exponent: -3 },
  milliamperes: { coefficient: 1, exponent: -3 },
  μA: { coefficient: 1, exponent: -6 },
};

export const ANGLE_CONVERSIONS: Record<AngleUnit, UnitConversion> = {
  // Base unit
  rad: { coefficient: 1 },
  deg: { coefficient: Math.PI / 180 },
  "°": { coefficient: Math.PI / 180 },
};

export const VOLUME_CONVERSIONS: Record<VolumeUnit, UnitConversion> = {
  // Base unit (liter)
  l: { coefficient: 1 },
  L: { coefficient: 1 },
  liter: { coefficient: 1 },
  liters: { coefficient: 1 },
  ml: { coefficient: 0.001 },
  milliliter: { coefficient: 0.001 },
  milliliters: { coefficient: 0.001 },
  gal: { coefficient: 3.785_411_784 },
  gallon: { coefficient: 3.785_411_784 },
  gallons: { coefficient: 3.785_411_784 },
  qt: { coefficient: 0.946_352_946 },
  quart: { coefficient: 0.946_352_946 },
  quarts: { coefficient: 0.946_352_946 },
  pt: { coefficient: 0.473_176_473 },
  pint: { coefficient: 0.473_176_473 },
  pints: { coefficient: 0.473_176_473 },
  cup: { coefficient: 0.236_588_236_5 },
  cups: { coefficient: 0.236_588_236_5 },
  tbsp: { coefficient: 0.014_786_764_8 },
  tablespoon: { coefficient: 0.014_786_764_8 },
  tablespoons: { coefficient: 0.014_786_764_8 },
  tsp: { coefficient: 0.004_928_921_6 },
  teaspoon: { coefficient: 0.004_928_921_6 },
  teaspoons: { coefficient: 0.004_928_921_6 },
  "fl oz": { coefficient: 0.029_573_529_6 },
  floz: { coefficient: 0.029_573_529_6 },
};

export const DATA_CONVERSIONS: Record<DataUnit, UnitConversion> = {
  // Base unit (byte)
  byte: { coefficient: 1 },
  bytes: { coefficient: 1 },
  b: { coefficient: 1 },
  // Decimal units
  kb: { coefficient: 1000 },
  kilobyte: { coefficient: 1000 },
  kilobytes: { coefficient: 1000 },
  mb: { coefficient: 1_000_000 },
  megabyte: { coefficient: 1_000_000 },
  megabytes: { coefficient: 1_000_000 },
  gb: { coefficient: 1_000_000_000 },
  gigabyte: { coefficient: 1_000_000_000 },
  gigabytes: { coefficient: 1_000_000_000 },
  tb: { coefficient: 1_000_000_000_000 },
  terabyte: { coefficient: 1_000_000_000_000 },
  terabytes: { coefficient: 1_000_000_000_000 },
  // Binary units
  kib: { coefficient: 1024 },
  kibibyte: { coefficient: 1024 },
  kibibytes: { coefficient: 1024 },
  mib: { coefficient: 1_048_576 },
  mebibyte: { coefficient: 1_048_576 },
  mebibytes: { coefficient: 1_048_576 },
  gib: { coefficient: 1_073_741_824 },
  gibibyte: { coefficient: 1_073_741_824 },
  gibibytes: { coefficient: 1_073_741_824 },
};

// Base units for each dimension
export const BASE_UNITS: Record<keyof DimensionMap, string> = {
  length: "m",
  mass: "kg",
  time: "s",
  current: "A",
  temperature: "K",
  amount: "mol",
  luminosity: "cd",
  angle: "rad",
  volume: "l",
  data: "byte",
  currency: "USD", // Default base currency
};

// Helper to get conversion table for a dimension
export function getConversionTable(
  dimension: keyof DimensionMap
): Record<string, UnitConversion> | null {
  switch (dimension) {
    case "length":
      return LENGTH_CONVERSIONS;
    case "mass":
      return MASS_CONVERSIONS;
    case "time":
      return TIME_CONVERSIONS;
    case "current":
      return CURRENT_CONVERSIONS;
    case "temperature":
      return TEMPERATURE_CONVERSIONS;
    case "angle":
      return ANGLE_CONVERSIONS;
    case "volume":
      return VOLUME_CONVERSIONS;
    case "data":
      return DATA_CONVERSIONS;
    case "amount":
      return { mol: { coefficient: 1 } }; // Only one unit
    case "luminosity":
      return { cd: { coefficient: 1 } }; // Only one unit
    case "currency":
      return getCurrencyConversions();
    default:
      throw new Error(`Unknown dimension: ${dimension}`);
  }
}

// Currency conversions are handled synchronously using cached rates
function getCurrencyConversions(): Record<string, UnitConversion> {
  const { CurrencyManager } = require("../utils/currency-manager");
  const currencyManager = CurrencyManager.getInstance();

  // Build conversion table where USD is the base unit
  const conversions: Record<string, UnitConversion> = {
    USD: { coefficient: 1 }, // Base currency
  };

  // Get all available rates from the currency manager
  // The getRates method should return cached rates synchronously
  // Rates are "how many units of target currency per 1 USD"
  try {
    // Use a known list of currencies since we can't dynamically get them
    const knownCurrencies = [
      "EUR",
      "GBP",
      "JPY",
      "CNY",
      "CAD",
      "AUD",
      "CHF",
      "SEK",
      "NOK",
      "DKK",
      "PLN",
      "CZK",
      "HUF",
      "RON",
      "BGN",
      "HRK",
      "RUB",
      "TRY",
      "BRL",
      "MXN",
      "INR",
      "IDR",
      "KRW",
      "THB",
      "MYR",
      "PHP",
      "SGD",
      "HKD",
      "NZD",
      "ZAR",
    ];

    for (const currency of knownCurrencies) {
      const rate = currencyManager.getRate(currency);
      if (rate !== undefined) {
        conversions[currency] = { coefficient: rate };
      }
    }
  } catch (e) {
    // If currency manager fails, just return USD
    console.error("Failed to get currency conversions:", e);
  }

  return conversions;
}

// Conversion function
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
  dimension: keyof DimensionMap
): number {
  if (fromUnit === toUnit) {
    return value;
  }

  const conversions = getConversionTable(dimension);
  if (!conversions) {
    throw new Error(`Cannot get conversion table for dimension: ${dimension}`);
  }

  const fromConv = conversions[fromUnit];
  const toConv = conversions[toUnit];

  if (!(fromConv && toConv)) {
    throw new Error(`Unknown unit: ${fromConv ? toUnit : fromUnit}`);
  }

  // Special handling for temperature conversions
  if (dimension === "temperature") {
    // Convert to Kelvin (base unit) first
    let kelvin: number;
    if (fromConv.offset) {
      // From Celsius or Fahrenheit
      kelvin = (value + fromConv.offset) * fromConv.coefficient;
    } else {
      // From Kelvin
      kelvin = value * fromConv.coefficient;
    }

    // Convert from Kelvin to target
    if (toConv.offset) {
      // To Celsius or Fahrenheit
      return kelvin / toConv.coefficient - toConv.offset;
    }
    // To Kelvin
    return kelvin / toConv.coefficient;
  }

  // For non-temperature units
  const { coefficient: fromCoef, exponent: fromExp = 0 } = fromConv;
  const baseValue = value * fromCoef * 10 ** fromExp;

  const { coefficient: toCoef, exponent: toExp = 0 } = toConv;
  return baseValue / (toCoef * 10 ** toExp);
}

// Multiply dimensions
export function multiplyDimensions(
  a: DimensionMap,
  b: DimensionMap
): DimensionMap {
  const result: DimensionMap = {};

  // Copy dimensions from a
  for (const dim of Object.keys(a) as (keyof DimensionMap)[]) {
    const info = a[dim];
    if (info) {
      // Safe assignment without any type
      if (dim === "currency") {
        result.currency = {
          ...(info as { exponent: number; code: CurrencyCode }),
        };
      } else {
        // Use Object.assign to set the property
        Object.assign(result, { [dim]: { ...info } });
      }
    }
  }

  // Add exponents from b
  for (const dim of Object.keys(b) as (keyof DimensionMap)[]) {
    const infoB = b[dim];
    if (!infoB) {
      continue;
    }

    const existing = result[dim];
    if (existing) {
      existing.exponent += infoB.exponent;
      // Keep the unit/code from the first operand, or update if not set
      if (dim === "currency") {
        const existingCurrency = existing as {
          exponent: number;
          code: CurrencyCode;
        };
        const infoBCurrency = infoB as { exponent: number; code: CurrencyCode };
        if (!existingCurrency.code && infoBCurrency.code) {
          existingCurrency.code = infoBCurrency.code;
        }
      } else if (
        "unit" in existing &&
        "unit" in infoB &&
        !existing.unit &&
        infoB.unit
      ) {
        existing.unit = infoB.unit;
      }
    } else if (dim === "currency") {
      // Safe assignment without any type
      result.currency = {
        ...(infoB as { exponent: number; code: CurrencyCode }),
      };
    } else {
      // Use Object.assign to set the property
      Object.assign(result, { [dim]: { ...infoB } });
    }
  }

  // Remove dimensions with zero exponents
  for (const dim of Object.keys(result) as (keyof DimensionMap)[]) {
    if (result[dim]?.exponent === 0) {
      delete result[dim];
    }
  }

  return result;
}

// Divide dimensions
export function divideDimensions(
  a: DimensionMap,
  b: DimensionMap
): DimensionMap {
  const result: DimensionMap = {};

  // Copy dimensions from a
  for (const dim of Object.keys(a) as (keyof DimensionMap)[]) {
    const info = a[dim];
    if (info) {
      // Safe assignment without any type
      if (dim === "currency") {
        result.currency = {
          ...(info as { exponent: number; code: CurrencyCode }),
        };
      } else {
        // Use Object.assign to set the property
        Object.assign(result, { [dim]: { ...info } });
      }
    }
  }

  // Subtract exponents from b
  for (const dim of Object.keys(b) as (keyof DimensionMap)[]) {
    const infoB = b[dim];
    if (!infoB) {
      continue;
    }

    const existing = result[dim];
    if (existing) {
      existing.exponent -= infoB.exponent;
    } else if (dim === "currency") {
      const infoBCurrency = infoB as { exponent: number; code: CurrencyCode };
      result.currency = {
        exponent: -infoBCurrency.exponent,
        code: infoBCurrency.code,
      };
    } else {
      const negatedInfo = { ...infoB, exponent: -infoB.exponent };
      Object.assign(result, { [dim]: negatedInfo });
    }
  }

  // Remove dimensions with zero exponents
  for (const dim of Object.keys(result) as (keyof DimensionMap)[]) {
    if (result[dim]?.exponent === 0) {
      delete result[dim];
    }
  }

  return result;
}

// Check if dimensions are compatible (for addition/subtraction)
export function areDimensionsCompatible(
  a: DimensionMap,
  b: DimensionMap
): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i] as keyof DimensionMap;
    if (
      key !== keysB[i] ||
      a[key]?.exponent !== b[key as keyof DimensionMap]?.exponent
    ) {
      return false;
    }
  }

  return true;
}

// Check if dimensions are equal
export function dimensionsEqual(a: DimensionMap, b: DimensionMap): boolean {
  return areDimensionsCompatible(a, b);
}

// Convert between compound units
export function convertCompoundUnit(
  value: number,
  fromDimensions: DimensionMap,
  toDimensions: DimensionMap
): number {
  // Check dimension compatibility
  if (!areDimensionsCompatible(fromDimensions, toDimensions)) {
    throw new Error("Incompatible dimensions for conversion");
  }

  // Special case: pure temperature conversion (no compound units with temperature)
  if (
    Object.keys(fromDimensions).length === 1 &&
    Object.keys(toDimensions).length === 1 &&
    fromDimensions.temperature &&
    toDimensions.temperature
  ) {
    const fromUnit = fromDimensions.temperature.unit;
    const toUnit = toDimensions.temperature.unit;
    if (fromUnit && toUnit) {
      return convertUnit(value, fromUnit, toUnit, "temperature");
    }
  }

  let result = value;

  // Convert each dimension
  for (const dim of Object.keys(fromDimensions) as (keyof DimensionMap)[]) {
    const fromInfo = fromDimensions[dim];
    const toInfo = toDimensions[dim];
    if (!(fromInfo && toInfo)) {
      continue;
    }

    if (dim === "currency" && fromInfo && toInfo) {
      // Currency uses 'code' instead of 'unit'
      const fromCurrency = fromInfo as { exponent: number; code: CurrencyCode };
      const toCurrency = toInfo as { exponent: number; code: CurrencyCode };
      if (fromCurrency.code !== toCurrency.code) {
        const conversionFactor = convertUnit(
          1,
          fromCurrency.code,
          toCurrency.code,
          dim
        );
        result *= conversionFactor ** fromCurrency.exponent;
      }
    } else if (
      fromInfo &&
      toInfo &&
      "unit" in fromInfo &&
      "unit" in toInfo &&
      fromInfo.unit &&
      toInfo.unit &&
      fromInfo.unit !== toInfo.unit
    ) {
      // Temperature cannot be in compound units
      if (dim === "temperature" && fromInfo.exponent !== 1) {
        throw new Error(
          "Temperature cannot be raised to a power in conversions"
        );
      }

      // Other dimensions use 'unit'
      const conversionFactor = convertUnit(1, fromInfo.unit, toInfo.unit, dim);
      result *= conversionFactor ** fromInfo.exponent;
    }
  }

  return result;
}

// Power dimensions (for exponentiation)
export function powerDimensions(
  dimensions: DimensionMap,
  power: number
): DimensionMap {
  const result: DimensionMap = {};

  for (const [dim, info] of Object.entries(dimensions) as [
    keyof DimensionMap,
    NonNullable<DimensionMap[keyof DimensionMap]>,
  ][]) {
    if (dim === "currency") {
      result.currency = {
        exponent: info.exponent * power,
        code: (info as { exponent: number; code: CurrencyCode }).code,
      };
    } else {
      Object.assign(result, {
        [dim]: {
          ...info,
          exponent: info.exponent * power,
        },
      });
    }
  }

  return result;
}

// Check if a dimension map is empty (dimensionless)
export function isDimensionless(dimensions: DimensionMap): boolean {
  return Object.keys(dimensions).length === 0;
}

// Get dimension type for known units
export function getDimensionForUnit(unit: string): keyof DimensionMap | null {
  if (unit in LENGTH_CONVERSIONS) {
    return "length";
  }
  if (unit in MASS_CONVERSIONS) {
    return "mass";
  }
  if (unit in TIME_CONVERSIONS) {
    return "time";
  }
  if (unit in CURRENT_CONVERSIONS) {
    return "current";
  }
  if (unit in TEMPERATURE_CONVERSIONS) {
    return "temperature";
  }
  if (unit in ANGLE_CONVERSIONS) {
    return "angle";
  }
  if (unit in VOLUME_CONVERSIONS) {
    return "volume";
  }
  if (unit in DATA_CONVERSIONS) {
    return "data";
  }
  if (unit === "mol") {
    return "amount";
  }
  if (unit === "cd") {
    return "luminosity";
  }
  if (
    unit === "A" ||
    unit === "amp" ||
    unit === "amps" ||
    unit === "ampere" ||
    unit === "amperes" ||
    unit === "mA" ||
    unit === "milliamp" ||
    unit === "milliamps" ||
    unit === "milliampere" ||
    unit === "milliamperes"
  ) {
    return "current";
  }
  // Currency codes are typically 3 uppercase letters
  if (CURRENCY_CODE_PATTERN.test(unit)) {
    return "currency";
  }
  return null;
}

// Create dimension map from simple unit
export function createDimensionFromUnit(unit: string): DimensionMap {
  // Check if it's a derived unit first
  if (derivedUnits[unit]) {
    // Parse the compound unit expression
    return parseUnit(derivedUnits[unit]);
  }

  const dimension = getDimensionForUnit(unit);
  if (!dimension) {
    throw new Error(`Unknown unit: ${unit}`);
  }

  if (dimension === "currency") {
    return {
      currency: { exponent: 1, code: unit },
    };
  }

  const dimensionMap: DimensionMap = {};
  if (dimension === "length") {
    dimensionMap.length = { exponent: 1, unit: unit as LengthUnit };
  } else if (dimension === "mass") {
    dimensionMap.mass = { exponent: 1, unit: unit as MassUnit };
  } else if (dimension === "time") {
    dimensionMap.time = { exponent: 1, unit: unit as TimeUnit };
  } else if (dimension === "current") {
    dimensionMap.current = { exponent: 1, unit: unit as CurrentUnit };
  } else if (dimension === "temperature") {
    dimensionMap.temperature = { exponent: 1, unit: unit as TemperatureUnit };
  } else if (dimension === "angle") {
    dimensionMap.angle = { exponent: 1, unit: unit as AngleUnit };
  } else if (dimension === "volume") {
    dimensionMap.volume = { exponent: 1, unit: unit as VolumeUnit };
  } else if (dimension === "data") {
    dimensionMap.data = { exponent: 1, unit: unit as DataUnit };
  } else if (dimension === "amount") {
    dimensionMap.amount = { exponent: 1, unit: unit as AmountUnit };
  } else if (dimension === "luminosity") {
    dimensionMap.luminosity = { exponent: 1, unit: unit as LuminosityUnit };
  }
  return dimensionMap;
}

/**
 * Parse a unit term like "kg^2" and return the unit and exponent
 */
function parseUnitTerm(term: string): { unit: string; exponent: number } {
  const parts = term.split("^");
  const unit = parts[0]?.trim() || "";
  const exponent = parts[1] ? Number.parseFloat(parts[1]) : 1;
  return { unit, exponent };
}

/**
 * Normalize a unit expression by converting division to negative exponents
 * e.g., "kg/s" -> "kg*s^-1", "m/s^2" -> "m*s^-2"
 */
function normalizeUnitExpression(expression: string): string {
  if (!expression.includes("/")) {
    return expression;
  }

  const [numerator, ...denominatorParts] = expression.split("/");
  let normalized = numerator || "";

  for (const denomPart of denominatorParts) {
    if (!denomPart) {
      continue;
    }

    const denomTerms = denomPart.split("*");
    for (const denomTerm of denomTerms) {
      const { unit, exponent } = parseUnitTerm(denomTerm);
      if (unit) {
        if (normalized) {
          normalized += "*";
        }
        normalized += `${unit}^${-exponent}`;
      }
    }
  }

  return normalized;
}

/**
 * Add a dimension to the dimensions map
 */
function addDimensionToMap(
  dimensions: DimensionMap,
  typedDim: keyof DimensionMap,
  dimInfo: { exponent: number; unit?: string; code?: string },
  exponent: number
): void {
  const existingDim = dimensions[typedDim];

  if (existingDim && "exponent" in existingDim) {
    // Update existing dimension
    existingDim.exponent += dimInfo.exponent * exponent;
  } else if (typedDim === "currency" && "code" in dimInfo) {
    // Create new dimension entry for currency
    dimensions[typedDim] = {
      exponent: dimInfo.exponent * exponent,
      code: dimInfo.code as CurrencyCode,
    };
  } else if ("unit" in dimInfo) {
    // Create new dimension entry with unit
    const dimEntry = {
      exponent: dimInfo.exponent * exponent,
      unit: dimInfo.unit,
    };
    (
      dimensions as Record<
        keyof DimensionMap,
        { exponent: number; unit?: string; code?: string }
      >
    )[typedDim] = dimEntry;
  } else {
    // Create new dimension entry without unit
    const dimEntry = {
      exponent: dimInfo.exponent * exponent,
    };
    (
      dimensions as Record<
        keyof DimensionMap,
        { exponent: number; unit?: string; code?: string }
      >
    )[typedDim] = dimEntry;
  }
}

/**
 * Parse a unit expression like "kg*s^-1" or "m/s^2" into dimensions
 */
export function parseUnit(unitExpression: string): DimensionMap {
  const dimensions: DimensionMap = {};

  // Normalize expression by converting division to negative exponents
  const normalizedExpression = normalizeUnitExpression(unitExpression);

  // Split by * to get individual unit terms
  const terms = normalizedExpression.split("*");

  for (const term of terms) {
    const { unit, exponent } = parseUnitTerm(term);
    if (!unit) {
      continue;
    }

    // Get the dimensions for this unit
    const unitDimensions = createDimensionFromUnit(unit);

    // Add to our dimensions with the exponent
    for (const [dim, info] of Object.entries(unitDimensions)) {
      const typedDim = dim as keyof DimensionMap;

      if (info && typeof info === "object" && "exponent" in info) {
        const dimInfo = info as {
          exponent: number;
          unit?: string;
          code?: string;
        };
        addDimensionToMap(dimensions, typedDim, dimInfo, exponent);
      }
    }
  }

  // Remove dimensions with zero exponents
  for (const dim of Object.keys(dimensions) as (keyof DimensionMap)[]) {
    const dimInfo = dimensions[dim];
    if (dimInfo && "exponent" in dimInfo && dimInfo.exponent === 0) {
      delete dimensions[dim];
    }
  }

  return dimensions;
}
