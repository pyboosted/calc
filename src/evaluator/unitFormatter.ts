import { CalculatedValue } from '../types';
import { ConfigManager } from '../utils/configManager';
import { format } from 'date-fns';

export function formatResultWithUnit(result: CalculatedValue): string {
  const num = result.value;
  const unit = result.unit;
  
  // Special formatting for dates
  if (unit === 'timestamp' && result.date) {
    return formatDate(result.date);
  }
  
  if (!unit) {
    return formatNumber(num);
  }
  
  // Special formatting for time units
  if (isTimeUnit(unit)) {
    return formatTime(num, unit);
  }
  
  // Regular formatting
  return `${formatNumber(num)} ${formatUnit(unit)}`;
}

function isTimeUnit(unit: string): boolean {
  const timeUnits = ['second', 'seconds', 's', 'sec', 'minute', 'minutes', 'min', 
                     'hour', 'hours', 'h', 'day', 'days', 'd', 'week', 'weeks',
                     'month', 'months', 'year', 'years', 'yr'];
  return timeUnits.includes(unit.toLowerCase());
}

function formatTime(value: number, unit: string): string {
  // Convert to hours for mixed display
  let hours = value;
  
  switch (unit.toLowerCase()) {
    case 'second':
    case 'seconds':
    case 's':
    case 'sec':
      hours = value / 3600;
      break;
    case 'minute':
    case 'minutes':
    case 'min':
      hours = value / 60;
      break;
    case 'hour':
    case 'hours':
    case 'h':
      hours = value;
      break;
    case 'day':
    case 'days':
    case 'd':
      hours = value * 24;
      break;
    case 'week':
    case 'weeks':
      hours = value * 24 * 7;
      break;
    default:
      return `${formatNumber(value)} ${formatUnit(unit)}`;
  }
  
  // If it's a nice round number of the original unit, keep it simple
  if (value % 1 === 0 && Math.abs(value) < 100) {
    return `${formatNumber(value)} ${formatUnit(unit)}`;
  }
  
  // For hours, show as hours and minutes if appropriate
  if (unit.toLowerCase() === 'hour' || unit.toLowerCase() === 'hours' || unit.toLowerCase() === 'h') {
    if (hours >= 1 && hours % 1 !== 0) {
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      if (minutes === 60) {
        return `${wholeHours + 1} h`;
      } else if (minutes === 0) {
        return `${wholeHours} h`;
      } else {
        return `${wholeHours} h ${minutes} min`;
      }
    }
  }
  
  // For minutes, if it's more than 60, show as hours and minutes
  if (unit.toLowerCase() === 'minute' || unit.toLowerCase() === 'minutes' || unit.toLowerCase() === 'min') {
    if (value >= 60) {
      const wholeHours = Math.floor(value / 60);
      const minutes = Math.round(value % 60);
      if (minutes === 0) {
        return `${wholeHours} h`;
      } else {
        return `${wholeHours} h ${minutes} min`;
      }
    }
  }
  
  return `${formatNumber(value)} ${formatUnit(unit)}`;
}

export function formatNumber(num: number): string {
  const config = ConfigManager.getInstance();
  const precision = config.precision;
  
  // Handle very large or very small numbers with scientific notation
  if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-5 && num !== 0)) {
    return num.toExponential(precision);
  }
  
  // Round to configured precision
  const factor = Math.pow(10, precision);
  const rounded = Math.round(num * factor) / factor;
  
  // Format with thousands separators
  const parts = rounded.toFixed(precision).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Remove trailing zeros after decimal point if precision > 0
  if (precision > 0 && parts[1]) {
    parts[1] = parts[1].replace(/0+$/, '');
    if (parts[1] === '') {
      return parts[0];
    }
  }
  
  return parts.join('.');
}

function formatDate(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // If the date is today and the time is not midnight, show time
  if (startOfDate.getTime() === startOfToday.getTime() && 
      (date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0)) {
    return format(date, 'EEE, MMM d, yyyy \'at\' HH:mm');
  }
  
  // If the time component is not midnight, show it
  if (date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0) {
    return format(date, 'EEE, MMM d, yyyy \'at\' HH:mm');
  }
  
  return format(date, 'EEE, MMM d, yyyy');
}

export function formatUnit(unit: string): string {
  // Convert some common unit variations to their standard display form
  const unitDisplay: Record<string, string> = {
    'meter': 'meters',
    'meters': 'meters',
    'm': 'm',
    'centimeter': 'cm',
    'centimeters': 'cm',
    'cm': 'cm',
    'millimeter': 'mm',
    'millimeters': 'mm',
    'mm': 'mm',
    'kilometer': 'km',
    'kilometers': 'km',
    'km': 'km',
    'inch': 'inches',
    'inches': 'inches',
    'in': 'in',
    'foot': 'feet',
    'feet': 'feet',
    'ft': 'ft',
    'yard': 'yards',
    'yards': 'yards',
    'yd': 'yd',
    'mile': 'miles',
    'miles': 'miles',
    'mi': 'mi',
    'gram': 'grams',
    'grams': 'grams',
    'g': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'kg': 'kg',
    'pound': 'pounds',
    'pounds': 'pounds',
    'lb': 'lb',
    'lbs': 'lbs',
    'ounce': 'ounces',
    'ounces': 'ounces',
    'oz': 'oz',
    'celsius': '°C',
    'c': '°C',
    'fahrenheit': '°F',
    'f': '°F',
    'kelvin': 'K',
    'k': 'K',
    'second': 'seconds',
    'seconds': 'seconds',
    's': 's',
    'sec': 'sec',
    'minute': 'minutes',
    'minutes': 'minutes',
    'min': 'min',
    'hour': 'hours',
    'hours': 'hours',
    'h': 'h',
    'day': 'days',
    'days': 'days',
    'd': 'd',
    'week': 'weeks',
    'weeks': 'weeks',
    'month': 'months',
    'months': 'months',
    'year': 'years',
    'years': 'years',
    'yr': 'yr',
    'liter': 'liters',
    'liters': 'liters',
    'l': 'L',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'ml': 'ml',
    'gallon': 'gallons',
    'gallons': 'gallons',
    'gal': 'gal',
    'byte': 'bytes',
    'bytes': 'bytes',
    'b': 'B',
    'kilobyte': 'KB',
    'kilobytes': 'KB',
    'kb': 'KB',
    'megabyte': 'MB',
    'megabytes': 'MB',
    'mb': 'MB',
    'gigabyte': 'GB',
    'gigabytes': 'GB',
    'gb': 'GB',
    'terabyte': 'TB',
    'terabytes': 'TB',
    'tb': 'TB',
  };
  
  return unitDisplay[unit.toLowerCase()] || unit;
}