import { describe, test, expect } from 'bun:test';
import { evaluate } from '../src/evaluator/evaluate';

describe('Unit Conversions', () => {
  describe('Length', () => {
    test('cm to meters', () => {
      const result = evaluate('100 cm in meters');
      expect(result.value).toBe(1);
      expect(result.unit).toBe('meters');
    });

    test('km to miles', () => {
      const result = evaluate('1 km in miles');
      expect(result.value).toBeCloseTo(0.621371, 5);
      expect(result.unit).toBe('miles');
    });

    test('feet to meters', () => {
      const result = evaluate('10 feet in meters');
      expect(result.value).toBeCloseTo(3.048, 3);
      expect(result.unit).toBe('meters');
    });
  });

  describe('Weight', () => {
    test('kg to pounds', () => {
      const result = evaluate('1 kg in pounds');
      expect(result.value).toBeCloseTo(2.20462, 5);
      expect(result.unit).toBe('pounds');
    });

    test('grams to kg', () => {
      const result = evaluate('1000 grams in kg');
      expect(result.value).toBe(1);
      expect(result.unit).toBe('kg');
    });
  });

  describe('Temperature', () => {
    test('celsius to fahrenheit', () => {
      const result = evaluate('0 celsius in fahrenheit');
      expect(result.value).toBe(32);
      expect(result.unit).toBe('fahrenheit');
    });

    test('fahrenheit to celsius', () => {
      const result = evaluate('32 fahrenheit in celsius');
      expect(result.value).toBe(0);
      expect(result.unit).toBe('celsius');
    });
  });

  describe('Time', () => {
    test('hours to minutes', () => {
      const result = evaluate('2 hours in minutes');
      expect(result.value).toBe(120);
      expect(result.unit).toBe('minutes');
    });

    test('days to hours', () => {
      const result = evaluate('1 day in hours');
      expect(result.value).toBe(24);
      expect(result.unit).toBe('hours');
    });
  });

  describe('Data', () => {
    test('gb to mb', () => {
      const result = evaluate('1 gb in mb');
      expect(result.value).toBe(1000);
      expect(result.unit).toBe('mb');
    });

    test('kb to bytes', () => {
      const result = evaluate('1 kb in bytes');
      expect(result.value).toBe(1000);
      expect(result.unit).toBe('bytes');
    });
  });
});