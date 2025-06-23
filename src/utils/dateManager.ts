import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addSeconds,
  addWeeks,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getDay,
  getHours,
  getMinutes,
  getMonth,
  getSeconds,
  getYear,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subSeconds,
  subWeeks,
  subYears,
} from "date-fns";

export class DateManager {
  private static instance: DateManager;

  private constructor() {}

  static getInstance(): DateManager {
    if (!DateManager.instance) {
      DateManager.instance = new DateManager();
    }
    return DateManager.instance;
  }

  /**
   * Parse date strings like "today", "tomorrow", "yesterday", "DD.MM.YYYY", "DD/MM/YYYY"
   */
  parseRelativeDate(input: string): Date | null {
    const now = new Date();
    const lowerInput = input.toLowerCase().trim();

    switch (lowerInput) {
      case "today":
        return startOfDay(now);
      case "now":
        return now;
      case "tomorrow":
        return startOfDay(addDays(now, 1));
      case "yesterday":
        return startOfDay(subDays(now, 1));
      case "monday":
      case "tuesday":
      case "wednesday":
      case "thursday":
      case "friday":
      case "saturday":
      case "sunday":
        return this.getNextWeekday(lowerInput);
      default: {
        // Try parsing DD.MM.YYYY or DD/MM/YYYY format
        const datePattern = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/;
        const match = input.match(datePattern);
        if (match?.[1] && match[2] && match[3]) {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          const year = parseInt(match[3]);

          // Validate date components
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
            // Month is 0-indexed in JavaScript Date
            const date = new Date(year, month - 1, day);

            // Check if the date is valid (handles cases like Feb 31)
            if (
              date.getDate() === day &&
              date.getMonth() === month - 1 &&
              date.getFullYear() === year
            ) {
              return startOfDay(date);
            }
          }
        }

        // Try parsing ISO date
        try {
          const date = parseISO(input);
          return isValid(date) ? date : null;
        } catch {
          return null;
        }
      }
    }
  }

  /**
   * Get the next occurrence of a weekday
   */
  private getNextWeekday(weekday: string): Date {
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = weekdays.indexOf(weekday);
    const today = new Date();
    const currentDay = getDay(today);

    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    return startOfDay(addDays(today, daysToAdd));
  }

  /**
   * Add time period to a date
   */
  addPeriod(date: Date, value: number, unit: string): Date {
    switch (unit.toLowerCase()) {
      case "day":
      case "days":
      case "d":
        return addDays(date, value);
      case "week":
      case "weeks":
      case "w":
        return addWeeks(date, value);
      case "month":
      case "months":
        return addMonths(date, value);
      case "year":
      case "years":
      case "yr":
        return addYears(date, value);
      case "hour":
      case "hours":
      case "h":
      case "hr":
        return addHours(date, value);
      case "minute":
      case "minutes":
      case "min":
      case "m":
        return addMinutes(date, value);
      case "second":
      case "seconds":
      case "s":
      case "sec":
        return addSeconds(date, value);
      default:
        return date;
    }
  }

  /**
   * Subtract time period from a date
   */
  subtractPeriod(date: Date, value: number, unit: string): Date {
    switch (unit.toLowerCase()) {
      case "day":
      case "days":
      case "d":
        return subDays(date, value);
      case "week":
      case "weeks":
      case "w":
        return subWeeks(date, value);
      case "month":
      case "months":
        return subMonths(date, value);
      case "year":
      case "years":
      case "yr":
        return subYears(date, value);
      case "hour":
      case "hours":
      case "h":
      case "hr":
        return subHours(date, value);
      case "minute":
      case "minutes":
      case "min":
      case "m":
        return subMinutes(date, value);
      case "second":
      case "seconds":
      case "s":
      case "sec":
        return subSeconds(date, value);
      default:
        return date;
    }
  }

  /**
   * Calculate difference between two dates
   */
  getDifference(date1: Date, date2: Date, unit: string): number {
    switch (unit.toLowerCase()) {
      case "day":
      case "days":
        return differenceInDays(date1, date2);
      case "month":
      case "months":
        return differenceInMonths(date1, date2);
      case "year":
      case "years":
        return differenceInYears(date1, date2);
      case "hour":
      case "hours":
        return differenceInHours(date1, date2);
      case "minute":
      case "minutes":
        return differenceInMinutes(date1, date2);
      case "second":
      case "seconds":
        return differenceInSeconds(date1, date2);
      default:
        return 0;
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: Date, formatString?: string): string {
    return format(date, formatString || "PPP");
  }

  /**
   * Get date component
   */
  getDateComponent(date: Date, component: string): number {
    switch (component.toLowerCase()) {
      case "day":
        return date.getDate();
      case "weekday":
        return getDay(date);
      case "month":
        return getMonth(date) + 1; // date-fns returns 0-indexed months
      case "year":
        return getYear(date);
      case "hour":
        return getHours(date);
      case "minute":
        return getMinutes(date);
      case "second":
        return getSeconds(date);
      default:
        return 0;
    }
  }

  /**
   * Get start/end of period
   */
  getPeriodBoundary(date: Date, period: string, boundary: "start" | "end"): Date {
    const isStart = boundary === "start";

    switch (period.toLowerCase()) {
      case "day":
        return isStart ? startOfDay(date) : endOfDay(date);
      case "week":
        return isStart ? startOfWeek(date) : endOfWeek(date);
      case "month":
        return isStart ? startOfMonth(date) : endOfMonth(date);
      case "year":
        return isStart ? startOfYear(date) : endOfYear(date);
      default:
        return date;
    }
  }
}
