import { describe, test, expect } from 'bun:test';
import { evaluate } from '../src/evaluator/evaluate';

describe('Basic Arithmetic', () => {
  test('addition', () => {
    const result = evaluate('2 + 2');
    expect(result.value).toBe(4);
  });

  test('subtraction', () => {
    const result = evaluate('10 - 5');
    expect(result.value).toBe(5);
  });

  test('multiplication', () => {
    const result = evaluate('3 * 4');
    expect(result.value).toBe(12);
  });

  test('division', () => {
    const result = evaluate('20 / 4');
    expect(result.value).toBe(5);
  });

  test('exponentiation', () => {
    const result = evaluate('2 ^ 3');
    expect(result.value).toBe(8);
  });

  test('modulo', () => {
    const result = evaluate('10 % 3');
    expect(result.value).toBe(1);
  });
});

describe('Mathematical Functions', () => {
  test('sqrt', () => {
    const result = evaluate('sqrt(16)');
    expect(result.value).toBe(4);
  });

  test('abs', () => {
    const result = evaluate('abs(-5)');
    expect(result.value).toBe(5);
  });

  test('round', () => {
    const result = evaluate('round(3.14159)');
    expect(result.value).toBe(3);
  });

  test('ceil', () => {
    const result = evaluate('ceil(3.1)');
    expect(result.value).toBe(4);
  });

  test('floor', () => {
    const result = evaluate('floor(3.9)');
    expect(result.value).toBe(3);
  });
});

describe('Percentage Calculations', () => {
  test('simple percentage', () => {
    const result = evaluate('20%');
    expect(result.value).toBe(0.2);
  });

  test('percentage addition', () => {
    const result = evaluate('100 + 10%');
    expect(result.value).toBe(110);
  });

  test('percentage subtraction', () => {
    const result = evaluate('100 - 10%');
    expect(result.value).toBe(90);
  });

  test('percentage of', () => {
    const result = evaluate('20% of 100');
    expect(result.value).toBe(20);
  });
});

describe('Variables', () => {
  test('variable assignment and usage', () => {
    const vars = new Map();
    const result1 = evaluate('x = 10', vars);
    expect(result1.value).toBe(10);
    
    const result2 = evaluate('x + 5', vars);
    expect(result2.value).toBe(15);
  });

  test('prev variable', () => {
    const vars = new Map([['prev', { value: 42 }]]);
    const result = evaluate('prev * 2', vars);
    expect(result.value).toBe(84);
  });
});