interface UnitDefinition {
  baseUnit: string;
  factor: number;
}

const unitDefinitions: Record<string, UnitDefinition> = {
  // Length - base unit: meter
  meter: { baseUnit: 'meter', factor: 1 },
  meters: { baseUnit: 'meter', factor: 1 },
  m: { baseUnit: 'meter', factor: 1 },
  centimeter: { baseUnit: 'meter', factor: 0.01 },
  centimeters: { baseUnit: 'meter', factor: 0.01 },
  cm: { baseUnit: 'meter', factor: 0.01 },
  millimeter: { baseUnit: 'meter', factor: 0.001 },
  millimeters: { baseUnit: 'meter', factor: 0.001 },
  mm: { baseUnit: 'meter', factor: 0.001 },
  kilometer: { baseUnit: 'meter', factor: 1000 },
  kilometers: { baseUnit: 'meter', factor: 1000 },
  km: { baseUnit: 'meter', factor: 1000 },
  inch: { baseUnit: 'meter', factor: 0.0254 },
  inches: { baseUnit: 'meter', factor: 0.0254 },
  in: { baseUnit: 'meter', factor: 0.0254 },
  foot: { baseUnit: 'meter', factor: 0.3048 },
  feet: { baseUnit: 'meter', factor: 0.3048 },
  ft: { baseUnit: 'meter', factor: 0.3048 },
  yard: { baseUnit: 'meter', factor: 0.9144 },
  yards: { baseUnit: 'meter', factor: 0.9144 },
  yd: { baseUnit: 'meter', factor: 0.9144 },
  mile: { baseUnit: 'meter', factor: 1609.344 },
  miles: { baseUnit: 'meter', factor: 1609.344 },
  mi: { baseUnit: 'meter', factor: 1609.344 },
  
  // Weight - base unit: gram
  gram: { baseUnit: 'gram', factor: 1 },
  grams: { baseUnit: 'gram', factor: 1 },
  g: { baseUnit: 'gram', factor: 1 },
  kilogram: { baseUnit: 'gram', factor: 1000 },
  kilograms: { baseUnit: 'gram', factor: 1000 },
  kg: { baseUnit: 'gram', factor: 1000 },
  milligram: { baseUnit: 'gram', factor: 0.001 },
  milligrams: { baseUnit: 'gram', factor: 0.001 },
  mg: { baseUnit: 'gram', factor: 0.001 },
  pound: { baseUnit: 'gram', factor: 453.59237 },
  pounds: { baseUnit: 'gram', factor: 453.59237 },
  lb: { baseUnit: 'gram', factor: 453.59237 },
  lbs: { baseUnit: 'gram', factor: 453.59237 },
  ounce: { baseUnit: 'gram', factor: 28.349523125 },
  ounces: { baseUnit: 'gram', factor: 28.349523125 },
  oz: { baseUnit: 'gram', factor: 28.349523125 },
  stone: { baseUnit: 'gram', factor: 6350.29318 },
  stones: { baseUnit: 'gram', factor: 6350.29318 },
  st: { baseUnit: 'gram', factor: 6350.29318 },
  
  // Time - base unit: second
  millisecond: { baseUnit: 'second', factor: 0.001 },
  milliseconds: { baseUnit: 'second', factor: 0.001 },
  ms: { baseUnit: 'second', factor: 0.001 },
  second: { baseUnit: 'second', factor: 1 },
  seconds: { baseUnit: 'second', factor: 1 },
  s: { baseUnit: 'second', factor: 1 },
  sec: { baseUnit: 'second', factor: 1 },
  minute: { baseUnit: 'second', factor: 60 },
  minutes: { baseUnit: 'second', factor: 60 },
  min: { baseUnit: 'second', factor: 60 },
  hour: { baseUnit: 'second', factor: 3600 },
  hours: { baseUnit: 'second', factor: 3600 },
  h: { baseUnit: 'second', factor: 3600 },
  day: { baseUnit: 'second', factor: 86400 },
  days: { baseUnit: 'second', factor: 86400 },
  d: { baseUnit: 'second', factor: 86400 },
  week: { baseUnit: 'second', factor: 604800 },
  weeks: { baseUnit: 'second', factor: 604800 },
  month: { baseUnit: 'second', factor: 2592000 }, // 30 days
  months: { baseUnit: 'second', factor: 2592000 },
  year: { baseUnit: 'second', factor: 31536000 }, // 365 days
  years: { baseUnit: 'second', factor: 31536000 },
  yr: { baseUnit: 'second', factor: 31536000 },
  
  // Volume - base unit: liter
  liter: { baseUnit: 'liter', factor: 1 },
  liters: { baseUnit: 'liter', factor: 1 },
  l: { baseUnit: 'liter', factor: 1 },
  milliliter: { baseUnit: 'liter', factor: 0.001 },
  milliliters: { baseUnit: 'liter', factor: 0.001 },
  ml: { baseUnit: 'liter', factor: 0.001 },
  gallon: { baseUnit: 'liter', factor: 3.785411784 },
  gallons: { baseUnit: 'liter', factor: 3.785411784 },
  gal: { baseUnit: 'liter', factor: 3.785411784 },
  quart: { baseUnit: 'liter', factor: 0.946352946 },
  quarts: { baseUnit: 'liter', factor: 0.946352946 },
  qt: { baseUnit: 'liter', factor: 0.946352946 },
  pint: { baseUnit: 'liter', factor: 0.473176473 },
  pints: { baseUnit: 'liter', factor: 0.473176473 },
  pt: { baseUnit: 'liter', factor: 0.473176473 },
  cup: { baseUnit: 'liter', factor: 0.2365882365 },
  cups: { baseUnit: 'liter', factor: 0.2365882365 },
  tablespoon: { baseUnit: 'liter', factor: 0.0147867648 },
  tablespoons: { baseUnit: 'liter', factor: 0.0147867648 },
  tbsp: { baseUnit: 'liter', factor: 0.0147867648 },
  teaspoon: { baseUnit: 'liter', factor: 0.00492892159 },
  teaspoons: { baseUnit: 'liter', factor: 0.00492892159 },
  tsp: { baseUnit: 'liter', factor: 0.00492892159 },
  
  // Data - base unit: byte
  byte: { baseUnit: 'byte', factor: 1 },
  bytes: { baseUnit: 'byte', factor: 1 },
  b: { baseUnit: 'byte', factor: 1 },
  kilobyte: { baseUnit: 'byte', factor: 1000 },
  kilobytes: { baseUnit: 'byte', factor: 1000 },
  kb: { baseUnit: 'byte', factor: 1000 },
  megabyte: { baseUnit: 'byte', factor: 1000000 },
  megabytes: { baseUnit: 'byte', factor: 1000000 },
  mb: { baseUnit: 'byte', factor: 1000000 },
  gigabyte: { baseUnit: 'byte', factor: 1000000000 },
  gigabytes: { baseUnit: 'byte', factor: 1000000000 },
  gb: { baseUnit: 'byte', factor: 1000000000 },
  terabyte: { baseUnit: 'byte', factor: 1000000000000 },
  terabytes: { baseUnit: 'byte', factor: 1000000000000 },
  tb: { baseUnit: 'byte', factor: 1000000000000 },
  kibibyte: { baseUnit: 'byte', factor: 1024 },
  kibibytes: { baseUnit: 'byte', factor: 1024 },
  kib: { baseUnit: 'byte', factor: 1024 },
  mebibyte: { baseUnit: 'byte', factor: 1048576 },
  mebibytes: { baseUnit: 'byte', factor: 1048576 },
  mib: { baseUnit: 'byte', factor: 1048576 },
  gibibyte: { baseUnit: 'byte', factor: 1073741824 },
  gibibytes: { baseUnit: 'byte', factor: 1073741824 },
  gib: { baseUnit: 'byte', factor: 1073741824 },
};

import { CurrencyManager } from '../utils/currencyManager';

export function convertUnits(value: number, fromUnit: string, toUnit: string): number {
  // Handle temperature conversions separately
  if (isTemperature(fromUnit) && isTemperature(toUnit)) {
    return convertTemperature(value, fromUnit, toUnit);
  }
  
  // Handle currency conversions
  if (isCurrency(fromUnit) && isCurrency(toUnit)) {
    return convertCurrency(value, fromUnit, toUnit);
  }
  
  // Regular unit conversions
  const from = unitDefinitions[fromUnit.toLowerCase()];
  const to = unitDefinitions[toUnit.toLowerCase()];
  
  if (!from || !to) {
    throw new Error(`Cannot convert from ${fromUnit} to ${toUnit}`);
  }
  
  if (from.baseUnit !== to.baseUnit) {
    throw new Error(`Cannot convert between ${fromUnit} and ${toUnit} - incompatible units`);
  }
  
  // Convert to base unit, then to target unit
  const baseValue = value * from.factor;
  return baseValue / to.factor;
}

function isTemperature(unit: string): boolean {
  const temp = unit.toLowerCase();
  return ['celsius', 'c', 'fahrenheit', 'f', 'kelvin', 'k'].includes(temp);
}

function convertTemperature(value: number, from: string, to: string): number {
  const fromUnit = from.toLowerCase();
  const toUnit = to.toLowerCase();
  
  // Convert to Celsius first
  let celsius: number;
  if (fromUnit === 'celsius' || fromUnit === 'c') {
    celsius = value;
  } else if (fromUnit === 'fahrenheit' || fromUnit === 'f') {
    celsius = (value - 32) * 5 / 9;
  } else if (fromUnit === 'kelvin' || fromUnit === 'k') {
    celsius = value - 273.15;
  } else {
    throw new Error(`Unknown temperature unit: ${from}`);
  }
  
  // Convert from Celsius to target
  if (toUnit === 'celsius' || toUnit === 'c') {
    return celsius;
  } else if (toUnit === 'fahrenheit' || toUnit === 'f') {
    return celsius * 9 / 5 + 32;
  } else if (toUnit === 'kelvin' || toUnit === 'k') {
    return celsius + 273.15;
  } else {
    throw new Error(`Unknown temperature unit: ${to}`);
  }
}

function isCurrency(unit: string): boolean {
  const currencyManager = CurrencyManager.getInstance();
  return currencyManager.getRate(unit) !== undefined;
}

function convertCurrency(value: number, from: string, to: string): number {
  const currencyManager = CurrencyManager.getInstance();
  const fromRate = currencyManager.getRate(from);
  const toRate = currencyManager.getRate(to);
  
  if (!fromRate || !toRate) {
    throw new Error(`Unknown currency: ${!fromRate ? from : to}`);
  }
  
  // Convert to USD first, then to target currency
  const usdValue = value / fromRate;
  return usdValue * toRate;
}