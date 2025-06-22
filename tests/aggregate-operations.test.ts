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
    // Note: Currently doesn't preserve units, but values are summed
  });
});