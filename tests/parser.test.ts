import { describe, expect, test } from "bun:test";
import { Parser } from "../src/parser/parser";
import { Tokenizer } from "../src/parser/tokenizer";
import type {
  AssignmentNode,
  BinaryOpNode,
  FunctionNode,
  NumberNode,
  VariableNode,
} from "../src/types";
import { fromDecimal } from "../src/utils/decimal-math";

describe("Parser", () => {
  const parse = (input: string) => {
    const tokenizer = new Tokenizer(input);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
  };

  test("parses numbers", () => {
    const ast = parse("42");
    expect(ast.type).toBe("number");
    expect(fromDecimal((ast as NumberNode).value)).toBe(42);
  });

  test("parses binary operations", () => {
    const ast = parse("2 + 3");
    expect(ast.type).toBe("binary");

    const binaryAst = ast as BinaryOpNode;
    expect(binaryAst.operator).toBe("+");
    expect(fromDecimal((binaryAst.left as NumberNode).value)).toBe(2);
    expect(fromDecimal((binaryAst.right as NumberNode).value)).toBe(3);
  });

  test("respects operator precedence", () => {
    const ast = parse("2 + 3 * 4");
    expect(ast.type).toBe("binary");

    const binaryAst = ast as BinaryOpNode;
    expect(binaryAst.operator).toBe("+");
    expect(fromDecimal((binaryAst.left as NumberNode).value)).toBe(2);
    expect(binaryAst.right.type).toBe("binary");
    expect((binaryAst.right as BinaryOpNode).operator).toBe("*");
  });

  test("parses parentheses", () => {
    const ast = parse("(2 + 3) * 4");
    expect(ast.type).toBe("binary");

    const binaryAst = ast as BinaryOpNode;
    expect(binaryAst.operator).toBe("*");
    expect(binaryAst.left.type).toBe("binary");
    expect((binaryAst.left as BinaryOpNode).operator).toBe("+");
    expect(fromDecimal((binaryAst.right as NumberNode).value)).toBe(4);
  });

  test("parses function calls", () => {
    const ast = parse("sqrt(16)");
    expect(ast.type).toBe("function");

    const funcAst = ast as FunctionNode;
    expect(funcAst.name).toBe("sqrt");
    expect(funcAst.args.length).toBe(1);
    expect(fromDecimal((funcAst.args[0] as NumberNode).value)).toBe(16);
  });

  test("parses variable assignments", () => {
    const ast = parse("x = 10");
    expect(ast.type).toBe("assignment");

    const assignAst = ast as AssignmentNode;
    expect(assignAst.variable).toBe("x");
    expect(fromDecimal((assignAst.value as NumberNode).value)).toBe(10);
  });

  test("parses unit conversions", () => {
    const ast = parse("100 cm in meters");
    // Unit conversions are parsed as binary operations with 'convert' operator
    expect(ast.type).toBe("binary");

    const binaryAst = ast as BinaryOpNode;
    expect(binaryAst.operator).toBe("convert");

    // Left side is a binary operation applying unit to number
    expect(binaryAst.left.type).toBe("binary");
    const leftBinary = binaryAst.left as BinaryOpNode;
    expect(leftBinary.operator).toBe("unit");
    expect(leftBinary.left.type).toBe("number");
    expect(fromDecimal((leftBinary.left as NumberNode).value)).toBe(100);
    expect(leftBinary.right.type).toBe("variable");
    expect((leftBinary.right as VariableNode).name).toBe("cm");

    // Right side is the target unit as a variable
    expect(binaryAst.right.type).toBe("variable");
    expect((binaryAst.right as VariableNode).name).toBe("meters");
  });

  test("parses percentage operations", () => {
    const ast = parse("100 - 10%");
    expect(ast.type).toBe("binary");

    const binaryAst = ast as BinaryOpNode;
    expect(binaryAst.operator).toBe("-");
    expect(fromDecimal((binaryAst.left as NumberNode).value)).toBe(100);
    // The right side should be transformed to (100 * 10/100)
    expect(binaryAst.right.type).toBe("binary");
    expect((binaryAst.right as BinaryOpNode).operator).toBe("*");
  });
});
