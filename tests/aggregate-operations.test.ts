import { describe, test, expect } from 'bun:test';
import { evaluate } from '../src/evaluator/evaluate';

describe('Aggregate Operations', () => {
  test('total sums previous numeric values', () => {
    const vars = new Map();
    
    // Simulate previous results: 10, 20, 30
    const previousResults = [
      { value: 10 },
      { value: 20 },
      { value: 30 }
    ];
    
    const result = evaluate('total', vars, { previousResults });
    expect(result.value).toBe(60); // 10 + 20 + 30
  });

  test('average calculates mean of previous values', () => {
    const vars = new Map();
    
    // Simulate previous results: 10, 20, 30
    const previousResults = [
      { value: 10 },
      { value: 20 },
      { value: 30 }
    ];
    
    const result = evaluate('average', vars, { previousResults });
    expect(result.value).toBe(20); // (10 + 20 + 30) / 3
  });

  test('ignores non-numeric values', () => {
    const vars = new Map();
    
    // Mix of numeric and non-numeric results
    const previousResults = [
      { value: 10 },
      { value: new Date(), unit: 'timestamp' }, // Date result
      { value: 20 },
      { value: 'text' }, // This shouldn't happen but test it
      { value: 30 }
    ];
    
    const result = evaluate('total', vars, { previousResults });
    expect(result.value).toBe(60); // Only sums 10 + 20 + 30
  });

  test('works with decimal values', () => {
    const vars = new Map();
    
    const previousResults = [
      { value: 10.5 },
      { value: 20.25 },
      { value: 30.75 }
    ];
    
    const result = evaluate('average', vars, { previousResults });
    expect(result.value).toBe(20.5); // (10.5 + 20.25 + 30.75) / 3
  });

  test('throws error when no previous values', () => {
    const vars = new Map();
    
    expect(() => evaluate('total', vars, { previousResults: [] }))
      .toThrow('No values to total');
    
    expect(() => evaluate('average', vars, { previousResults: [] }))
      .toThrow('No values to average');
  });

  test('throws error when no numeric values', () => {
    const vars = new Map();
    
    const previousResults = [
      { value: new Date(), unit: 'timestamp' }
    ];
    
    expect(() => evaluate('total', vars, { previousResults }))
      .toThrow('No numeric values to total');
  });

  test('works with values that have units', () => {
    const vars = new Map();
    
    const previousResults = [
      { value: 100, unit: 'meters' },
      { value: 200, unit: 'meters' },
      { value: 300, unit: 'meters' }
    ];
    
    const result = evaluate('total', vars, { previousResults });
    expect(result.value).toBe(600);
    expect(result.unit).toBe('meters');
  });

  test('total with target unit conversion', () => {
    const vars = new Map();
    
    const previousResults = [
      { value: 1, unit: 'km' },
      { value: 500, unit: 'm' },
      { value: 100, unit: 'cm' }
    ];
    
    const result = evaluate('total in m', vars, { previousResults });
    expect(result.value).toBe(1501); // 1000m + 500m + 1m
    expect(result.unit).toBe('m');
  });

  test('average with target unit conversion', () => {
    const vars = new Map();
    
    const previousResults = [
      { value: 100, unit: 'km' },
      { value: 50, unit: 'km' },
      { value: 30, unit: 'km' }
    ];
    
    const result = evaluate('average in miles', vars, { previousResults });
    expect(result.value).toBeCloseTo(37.282, 2); // Average of 60 km in miles
    expect(result.unit).toBe('miles');
  });

  test('handles mixed compatible units without target', () => {
    const vars = new Map();
    
    const previousResults = [
      { value: 100, unit: 'km' },
      { value: 50, unit: 'miles' },
      { value: 30, unit: 'km' }
    ];
    
    // With mixed compatible units and no target, converts to first unit
    const result = evaluate('total', vars, { previousResults });
    expect(result.value).toBeCloseTo(210.47, 1); // 100km + 80.47km + 30km
    expect(result.unit).toBe('km');
  });
  
  test('handles incompatible units without target', () => {
    const vars = new Map();
    
    const previousResults = [
      { value: 100, unit: 'km' },
      { value: 50, unit: 'kg' }, // Weight - incompatible with length
      { value: 30, unit: 'seconds' } // Time - incompatible with both
    ];
    
    // With incompatible units and no target, just sums raw values
    const result = evaluate('total', vars, { previousResults });
    expect(result.value).toBe(180);
    expect(result.unit).toBeUndefined();
  });

  test('handles values with and without units', () => {
    const vars = new Map();
    
    const previousResults = [
      { value: 100 },
      { value: 50, unit: 'km' },
      { value: 25 }
    ];
    
    const result = evaluate('total', vars, { previousResults });
    expect(result.value).toBe(175);
    expect(result.unit).toBe('km'); // Takes the first unit found
  });

  test('ignores incompatible units in conversion', () => {
    const vars = new Map();
    
    const previousResults = [
      { value: 100, unit: 'km' },
      { value: 50, unit: 'kg' }, // Weight - can't convert to km
      { value: 30, unit: 'km' }
    ];
    
    const result = evaluate('total in km', vars, { previousResults });
    expect(result.value).toBe(130); // Only sums compatible units
    expect(result.unit).toBe('km');
  });

  test('parses total in unit syntax', () => {
    const vars = new Map();
    
    const previousResults = [
      { value: 100, unit: 'cm' },
      { value: 200, unit: 'cm' }
    ];
    
    // Test different syntax variations
    const result1 = evaluate('total in m', vars, { previousResults });
    expect(result1.value).toBe(3);
    expect(result1.unit).toBe('m');
    
    const result2 = evaluate('total to m', vars, { previousResults });
    expect(result2.value).toBe(3);
    expect(result2.unit).toBe('m');
    
    const result3 = evaluate('total as m', vars, { previousResults });
    expect(result3.value).toBe(3);
    expect(result3.unit).toBe('m');
  });
});