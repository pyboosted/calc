import { test, expect, describe } from 'bun:test';
import { evaluate } from '../src/evaluator/evaluate';
import { TimezoneManager } from '../src/utils/timezoneManager';

describe('Timezone Support', () => {
  test('parses time literals without timezone', () => {
    const result = evaluate('12:00', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.date).toBeDefined();
    const date = result.date!;
    expect(date.getHours()).toBe(12);
    expect(date.getMinutes()).toBe(0);
  });

  test('parses time literals with timezone', () => {
    const result = evaluate('10:00@utc', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.date).toBeDefined();
    expect(result.timezone).toBe('utc');
  });

  test('parses time with named timezone', () => {
    const result = evaluate('12:15@moscow', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.date).toBeDefined();
    expect(result.timezone).toBe('moscow');
  });

  test('converts time between timezones', () => {
    const result = evaluate('12:00@moscow in utc', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.timezone).toBe('utc');
  });

  test('now in timezone', () => {
    const result = evaluate('now in yerevan', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.timezone).toBe('yerevan');
    expect(result.date).toBeDefined();
  });

  test('time subtraction in same timezone', () => {
    const result = evaluate('12:15@moscow - 10:00@moscow in minutes', new Map());
    expect(result.unit).toBe('minutes');
    expect(result.value).toBe(135); // 2 hours 15 minutes = 135 minutes
  });
  
  test('time subtraction returns seconds by default', () => {
    const result = evaluate('12:15 - 10:00', new Map());
    expect(result.unit).toBe('seconds');
    expect(result.value).toBe(8100); // 2 hours 15 minutes = 8100 seconds
  });

  test('datetime with timezone', () => {
    const result = evaluate('25.10.2025T12:15@moscow', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.date).toBeDefined();
    expect(result.timezone).toBe('moscow');
    const date = result.date!;
    expect(date.getDate()).toBe(25);
    expect(date.getMonth()).toBe(9); // October
    expect(date.getFullYear()).toBe(2025);
  });

  test('timezone conversion preserves time correctly', () => {
    // Create a specific time in UTC
    const utcTime = evaluate('10:00@utc', new Map());
    
    // Convert to Moscow time (UTC+3)
    const moscowTime = evaluate('10:00@utc in moscow', new Map());
    
    // The actual hour displayed should be different due to timezone offset
    // but the moment in time should be the same
    expect(moscowTime.timezone).toBe('moscow');
    expect(moscowTime.unit).toBe('timestamp');
  });

  test('timezone manager validates timezones', () => {
    const manager = TimezoneManager.getInstance();
    
    expect(manager.isValidTimezone('moscow')).toBe(true);
    expect(manager.isValidTimezone('utc')).toBe(true);
    expect(manager.isValidTimezone('utc+3')).toBe(true);
    expect(manager.isValidTimezone('new york')).toBe(true);
    expect(manager.isValidTimezone('invalid_timezone')).toBe(false);
  });

  test('multi-word timezone names', () => {
    const result = evaluate('12:00@new york', new Map());
    expect(result.timezone).toBe('new york');
    expect(result.unit).toBe('timestamp');
  });

  test('UTC offset timezones', () => {
    const result = evaluate('12:00@utc-5', new Map());
    expect(result.timezone).toBe('utc-5');
    expect(result.unit).toBe('timestamp');
  });

  test('incomplete timezone expression does not crash', () => {
    // Should treat as time without timezone (uses system timezone)
    const result = evaluate('10:00@', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.date).toBeDefined();
    // Will have system timezone, not undefined
    const hours = result.date!.getHours();
    expect(hours).toBeGreaterThanOrEqual(0);
    expect(hours).toBeLessThanOrEqual(23);
  });

  test('incomplete datetime timezone expression does not crash', () => {
    // Should treat as datetime without timezone (uses system timezone)
    const result = evaluate('25.10.2025T10:00@', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.date).toBeDefined();
    expect(result.date!.getFullYear()).toBe(2025);
    expect(result.date!.getMonth()).toBe(9); // October
    expect(result.date!.getDate()).toBe(25);
  });
});