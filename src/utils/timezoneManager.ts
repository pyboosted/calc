import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

export class TimezoneManager {
  private static instance: TimezoneManager;
  
  // Map of common timezone names to IANA timezone identifiers
  private timezoneMap: Record<string, string> = {
    // UTC offsets
    'utc': 'UTC',
    'utc-0': 'UTC',
    'utc+0': 'UTC',
    'utc-1': 'Etc/GMT+1',
    'utc-2': 'Etc/GMT+2',
    'utc-3': 'Etc/GMT+3',
    'utc-4': 'Etc/GMT+4',
    'utc-5': 'Etc/GMT+5',
    'utc-6': 'Etc/GMT+6',
    'utc-7': 'Etc/GMT+7',
    'utc-8': 'Etc/GMT+8',
    'utc-9': 'Etc/GMT+9',
    'utc-10': 'Etc/GMT+10',
    'utc-11': 'Etc/GMT+11',
    'utc-12': 'Etc/GMT+12',
    'utc+1': 'Etc/GMT-1',
    'utc+2': 'Etc/GMT-2',
    'utc+3': 'Etc/GMT-3',
    'utc+4': 'Etc/GMT-4',
    'utc+5': 'Etc/GMT-5',
    'utc+6': 'Etc/GMT-6',
    'utc+7': 'Etc/GMT-7',
    'utc+8': 'Etc/GMT-8',
    'utc+9': 'Etc/GMT-9',
    'utc+10': 'Etc/GMT-10',
    'utc+11': 'Etc/GMT-11',
    'utc+12': 'Etc/GMT-12',
    
    // Common city/region names
    'moscow': 'Europe/Moscow',
    'yerevan': 'Asia/Yerevan',
    'london': 'Europe/London',
    'paris': 'Europe/Paris',
    'berlin': 'Europe/Berlin',
    'tokyo': 'Asia/Tokyo',
    'sydney': 'Australia/Sydney',
    'newyork': 'America/New_York',
    'new york': 'America/New_York',
    'ny': 'America/New_York',
    'nyc': 'America/New_York',
    'la': 'America/Los_Angeles',
    'losangeles': 'America/Los_Angeles',
    'los angeles': 'America/Los_Angeles',
    'chicago': 'America/Chicago',
    'denver': 'America/Denver',
    'dubai': 'Asia/Dubai',
    'singapore': 'Asia/Singapore',
    'hongkong': 'Asia/Hong_Kong',
    'hong kong': 'Asia/Hong_Kong',
    'shanghai': 'Asia/Shanghai',
    'beijing': 'Asia/Shanghai',
    'mumbai': 'Asia/Kolkata',
    'delhi': 'Asia/Kolkata',
    'bangalore': 'Asia/Kolkata',
    'kolkata': 'Asia/Kolkata',
    'bangkok': 'Asia/Bangkok',
    'seoul': 'Asia/Seoul',
    'istanbul': 'Europe/Istanbul',
    'cairo': 'Africa/Cairo',
    'lagos': 'Africa/Lagos',
    'nairobi': 'Africa/Nairobi',
    'johannesburg': 'Africa/Johannesburg',
    'capetown': 'Africa/Johannesburg',
    'cape town': 'Africa/Johannesburg',
    'saopaulo': 'America/Sao_Paulo',
    'sao paulo': 'America/Sao_Paulo',
    'buenosaires': 'America/Argentina/Buenos_Aires',
    'buenos aires': 'America/Argentina/Buenos_Aires',
    'mexico': 'America/Mexico_City',
    'mexicocity': 'America/Mexico_City',
    'mexico city': 'America/Mexico_City',
    'toronto': 'America/Toronto',
    'vancouver': 'America/Vancouver',
    'montreal': 'America/Montreal',
    
    // Time zone abbreviations
    'est': 'America/New_York',
    'edt': 'America/New_York',
    'cst': 'America/Chicago',
    'cdt': 'America/Chicago',
    'mst': 'America/Denver',
    'mdt': 'America/Denver',
    'pst': 'America/Los_Angeles',
    'pdt': 'America/Los_Angeles',
    'gmt': 'GMT',
    'bst': 'Europe/London',
    'cet': 'Europe/Paris',
    'cest': 'Europe/Paris',
    'jst': 'Asia/Tokyo',
    'ist': 'Asia/Kolkata',
    'aest': 'Australia/Sydney',
    'aedt': 'Australia/Sydney',
  };
  
  private constructor() {}
  
  static getInstance(): TimezoneManager {
    if (!TimezoneManager.instance) {
      TimezoneManager.instance = new TimezoneManager();
    }
    return TimezoneManager.instance;
  }
  
  /**
   * Get IANA timezone identifier from common name
   */
  getTimezone(name: string): string {
    const normalized = name.toLowerCase().trim();
    return this.timezoneMap[normalized] || normalized;
  }
  
  /**
   * Get system timezone
   */
  getSystemTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  
  /**
   * Convert a date from one timezone to another
   */
  convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date {
    const fromTz = this.getTimezone(fromTimezone);
    const toTz = this.getTimezone(toTimezone);
    
    // First, get the time in the source timezone
    const utcDate = fromZonedTime(date, fromTz);
    
    // Then convert to the target timezone
    return toZonedTime(utcDate, toTz);
  }
  
  /**
   * Create a date in a specific timezone
   */
  createDateInTimezone(year: number, month: number, day: number, hour: number, minute: number, timezone: string): Date {
    const tz = this.getTimezone(timezone);
    
    // If timezone is not valid, use system timezone
    if (!this.isValidTimezone(tz)) {
      const systemTz = this.getSystemTimezone();
      const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
      return fromZonedTime(localDate, systemTz);
    }
    
    // Create a date object representing the local time in the target timezone
    const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    
    // Convert from the timezone to UTC
    return fromZonedTime(localDate, tz);
  }
  
  /**
   * Format a date in a specific timezone
   */
  formatInTimezone(date: Date, timezone: string, formatString: string): string {
    const tz = this.getTimezone(timezone);
    return formatInTimeZone(date, tz, formatString);
  }
  
  /**
   * Get the current time in a specific timezone
   */
  getNowInTimezone(timezone: string): Date {
    const tz = this.getTimezone(timezone);
    return toZonedTime(new Date(), tz);
  }
  
  /**
   * Check if a timezone name is valid
   */
  isValidTimezone(name: string): boolean {
    const normalized = name.toLowerCase().trim();
    
    // Check if it's in our map
    if (this.timezoneMap[normalized]) {
      return true;
    }
    
    // Check if it's a valid IANA timezone
    try {
      Intl.DateTimeFormat('en-US', { timeZone: normalized });
      return true;
    } catch {
      return false;
    }
  }
}