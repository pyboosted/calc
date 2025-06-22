import { describe, test, expect } from 'bun:test';
import { Parser } from '../src/parser/parser';
import { Tokenizer } from '../src/parser/tokenizer';

describe('Parser', () => {
  const parse = (input: string) => {
    const tokenizer = new Tokenizer(input);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
  };

  test('parses numbers', () => {
    const ast = parse('42');
    expect(ast.type).toBe('number');
    expect(ast.value).toBe(42);
  });

  test('parses binary operations', () => {
    const ast = parse('2 + 3');
    expect(ast.type).toBe('binary');
    expect(ast.operator).toBe('+');
    expect(ast.left.value).toBe(2);
    expect(ast.right.value).toBe(3);
  });

  test('respects operator precedence', () => {
    const ast = parse('2 + 3 * 4');
    expect(ast.type).toBe('binary');
    expect(ast.operator).toBe('+');
    expect(ast.left.value).toBe(2);
    expect(ast.right.type).toBe('binary');
    expect(ast.right.operator).toBe('*');
  });

  test('parses parentheses', () => {
    const ast = parse('(2 + 3) * 4');
    expect(ast.type).toBe('binary');
    expect(ast.operator).toBe('*');
    expect(ast.left.type).toBe('binary');
    expect(ast.left.operator).toBe('+');
    expect(ast.right.value).toBe(4);
  });

  test('parses function calls', () => {
    const ast = parse('sqrt(16)');
    expect(ast.type).toBe('function');
    expect(ast.name).toBe('sqrt');
    expect(ast.args.length).toBe(1);
    expect(ast.args[0].value).toBe(16);
  });

  test('parses variable assignments', () => {
    const ast = parse('x = 10');
    expect(ast.type).toBe('assignment');
    expect(ast.variable).toBe('x');
    expect(ast.value.value).toBe(10);
  });

  test('parses unit conversions', () => {
    const ast = parse('100 cm in meters');
    // Unit conversions are parsed as binary operations with 'convert' operator
    expect(ast.type).toBe('binary');
    expect(ast.operator).toBe('convert');
    // Left side is a number with unit
    expect(ast.left.type).toBe('number');
    expect(ast.left.value).toBe(100);
    expect(ast.left.unit).toBe('cm');
    // Right side is the target unit (as a number with unit)
    expect(ast.right.type).toBe('number');
    expect(ast.right.value).toBe(1);
    expect(ast.right.unit).toBe('meters');
  });

  test('parses percentage operations', () => {
    const ast = parse('100 - 10%');
    expect(ast.type).toBe('binary');
    expect(ast.operator).toBe('-');
    expect(ast.left.value).toBe(100);
    // The right side should be transformed to (100 * 10/100)
    expect(ast.right.type).toBe('binary');
    expect(ast.right.operator).toBe('*');
  });
});