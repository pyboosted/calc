import {
  isTemperature as isTemperatureUnit,
  unitDefinitions,
} from "../data/units";
import { CurrencyManager } from "../utils/currency-manager";

export function convertUnits(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  // Handle temperature conversions separately
  if (isTemperatureUnit(fromUnit) && isTemperatureUnit(toUnit)) {
    return convertTemperature(value, fromUnit, toUnit);
  }

  // Handle currency conversions
  if (isCurrency(fromUnit) && isCurrency(toUnit)) {
    return convertCurrency(value, fromUnit, toUnit);
  }

  // Regular unit conversions
  const from = unitDefinitions[fromUnit.toLowerCase()];
  const to = unitDefinitions[toUnit.toLowerCase()];

  if (!(from && to)) {
    throw new Error(`Cannot convert from ${fromUnit} to ${toUnit}`);
  }

  if (from.baseUnit !== to.baseUnit) {
    throw new Error(
      `Cannot convert between ${fromUnit} and ${toUnit} - incompatible units`
    );
  }

  // Convert to base unit, then to target unit
  const baseValue = value * from.factor;
  return baseValue / to.factor;
}

function convertTemperature(value: number, from: string, to: string): number {
  const fromUnit = from.toLowerCase();
  const toUnit = to.toLowerCase();

  // Convert to Celsius first
  let celsius: number;
  if (fromUnit === "celsius" || fromUnit === "c") {
    celsius = value;
  } else if (fromUnit === "fahrenheit" || fromUnit === "f") {
    celsius = ((value - 32) * 5) / 9;
  } else if (fromUnit === "kelvin" || fromUnit === "k") {
    celsius = value - 273.15;
  } else {
    throw new Error(`Unknown temperature unit: ${from}`);
  }

  // Convert from Celsius to target
  if (toUnit === "celsius" || toUnit === "c") {
    return celsius;
  }
  if (toUnit === "fahrenheit" || toUnit === "f") {
    return (celsius * 9) / 5 + 32;
  }
  if (toUnit === "kelvin" || toUnit === "k") {
    return celsius + 273.15;
  }
  throw new Error(`Unknown temperature unit: ${to}`);
}

function isCurrency(unit: string): boolean {
  const currencyManager = CurrencyManager.getInstance();
  return currencyManager.getRate(unit) !== undefined;
}

function convertCurrency(value: number, from: string, to: string): number {
  const currencyManager = CurrencyManager.getInstance();
  const fromRate = currencyManager.getRate(from);
  const toRate = currencyManager.getRate(to);

  if (!(fromRate && toRate)) {
    throw new Error(`Unknown currency: ${fromRate ? to : from}`);
  }

  // Convert to USD first, then to target currency
  const usdValue = value / fromRate;
  return usdValue * toRate;
}
