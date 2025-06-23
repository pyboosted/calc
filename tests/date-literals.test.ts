import { test, expect, describe } from 'bun:test';
import { evaluate } from '../src/evaluator/evaluate';
import { formatResultWithUnit } from '../src/evaluator/unitFormatter';

describe('Date Literals', () => {
  test('parses DD.MM.YYYY format', () => {
    const result = evaluate('25.10.1988', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.date).toBeDefined();
    expect(result.date?.getDate()).toBe(25);
    expect(result.date?.getMonth()).toBe(9); // October is month 9 (0-indexed)
    expect(result.date?.getFullYear()).toBe(1988);
  });

  test('parses DD/MM/YYYY format', () => {
    const result = evaluate('25/07/2025', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.date).toBeDefined();
    expect(result.date?.getDate()).toBe(25);
    expect(result.date?.getMonth()).toBe(6); // July is month 6 (0-indexed)
    expect(result.date?.getFullYear()).toBe(2025);
  });

  test('date subtraction in days', () => {
    const futureDate = new Date(2025, 6, 25); // July 25, 2025
    const today = new Date();
    const expectedDays = Math.floor((futureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const result = evaluate('25/07/2025 - today in days', new Map());
    expect(result.unit).toBe('days');
    // Allow for a day difference due to time zones and execution time
    expect(Math.abs(result.value - expectedDays)).toBeLessThanOrEqual(1);
  });

  test('date arithmetic with literal dates', () => {
    const result = evaluate('25.12.2024 + 10 days', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.date).toBeDefined();
    expect(result.date?.getDate()).toBe(4);
    expect(result.date?.getMonth()).toBe(0); // January
    expect(result.date?.getFullYear()).toBe(2025);
  });

  test('decimal number is not parsed as date', () => {
    // This should be parsed as a decimal number, not a date
    const result = evaluate('25.13', new Map());
    expect(result.unit).toBeUndefined();
    expect(result.value).toBeCloseTo(25.13);
  });

  test('date with single digit day and month', () => {
    const result = evaluate('5/3/2024', new Map());
    expect(result.unit).toBe('timestamp');
    expect(result.date).toBeDefined();
    expect(result.date?.getDate()).toBe(5);
    expect(result.date?.getMonth()).toBe(2); // March
    expect(result.date?.getFullYear()).toBe(2024);
  });

  test('complex date expression', () => {
    const result = evaluate('(25.07.2025 - 01.01.2025) in days', new Map());
    expect(result.unit).toBe('days');
    expect(result.value).toBe(205); // Days between Jan 1 and July 25
  });

  test('date literal with variables', () => {
    const variables = new Map();
    evaluate('birthday = 25.10.1988', variables);
    const result = evaluate('today - birthday in days', variables);
    expect(result.unit).toBe('days');
    expect(result.value).toBeGreaterThan(12000); // At least 12000 days old
  });
});