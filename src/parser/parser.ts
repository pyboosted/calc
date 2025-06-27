import { isUnit } from "../data/units";
import {
  type AggregateNode,
  type ArrayNode,
  type ASTNode,
  type AssignmentNode,
  type BinaryOpNode,
  type BooleanNode,
  type ComparisonNode,
  type ConstantNode,
  type DateNode,
  type DateOperationNode,
  type DateTimeNode,
  type FunctionNode,
  type LogicalNode,
  type NullNode,
  type NumberNode,
  type ObjectNode,
  type PropertyAccessNode,
  type StringNode,
  type TernaryNode,
  type TimeNode,
  type Token,
  TokenType,
  type TypeCastNode,
  type TypeCheckNode,
  type UnaryOpNode,
  type VariableNode,
} from "../types";
import { parseCompoundUnit, unitsToExpression } from "./unit-parser";

export class Parser {
  private tokens: Token[];
  private position = 0;
  private _current!: Token;

  private get current(): Token {
    return this._current;
  }

  private set current(token: Token) {
    this._current = token;
  }

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.current = this.tokens[0] || {
      type: TokenType.EOF,
      value: "",
      position: 0,
    };
  }

  private advance(): Token {
    if (this.position < this.tokens.length - 1) {
      this.position++;
      this.current = this.tokens[this.position] || {
        type: TokenType.EOF,
        value: "",
        position: this.position,
      };
    }
    return this.current;
  }

  private peek(offset = 1): Token | null {
    const pos = this.position + offset;
    return pos < this.tokens.length ? this.tokens[pos] || null : null;
  }

  private consume(type: TokenType, message?: string): Token {
    if (this.current.type !== type) {
      throw new Error(
        message || `Expected ${type} but got ${this.current.type}`
      );
    }
    const token = this.current;
    this.advance();
    return token;
  }

  parse(): ASTNode {
    const node = this.parseAssignment();
    if (this.current.type !== TokenType.EOF) {
      throw new Error(`Unexpected token: ${this.current.value}`);
    }
    return node;
  }

  private parseAssignment(): ASTNode {
    const expr = this.parseExpression();

    if (this.current.type === TokenType.EQUALS && expr.type === "variable") {
      this.advance(); // consume =
      const value = this.parseExpression();
      return {
        type: "assignment",
        variable: (expr as VariableNode).name,
        value,
      } as AssignmentNode;
    }

    // Handle compound assignments (+=, -=)
    if (
      (this.current.type === TokenType.PLUS_EQUALS ||
        this.current.type === TokenType.MINUS_EQUALS) &&
      expr.type === "variable"
    ) {
      const operator = this.current.type === TokenType.PLUS_EQUALS ? "+" : "-";
      this.advance(); // consume += or -=
      const rightValue = this.parseExpression();

      // Convert a += b to a = a + b
      const binaryOp: BinaryOpNode = {
        type: "binary",
        operator,
        left: expr,
        right: rightValue,
      };

      return {
        type: "assignment",
        variable: (expr as VariableNode).name,
        value: binaryOp,
      } as AssignmentNode;
    }

    return expr;
  }

  private parseExpression(): ASTNode {
    return this.parseTernary();
  }

  private parseTernary(): ASTNode {
    const expr = this.parseLogicalOr();

    if (this.current.type === TokenType.QUESTION) {
      this.advance(); // consume ?
      const trueExpr = this.parseTernary(); // Allow nested ternaries

      if ((this.current.type as TokenType) !== TokenType.COLON) {
        throw new Error("Expected ':' in ternary expression");
      }
      this.advance(); // consume :

      const falseExpr = this.parseTernary();

      return {
        type: "ternary",
        condition: expr,
        trueExpr,
        falseExpr,
      } as TernaryNode;
    }

    return expr;
  }

  private parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd();

    while (this.current.type === TokenType.OR) {
      this.advance();
      const right = this.parseLogicalAnd();
      left = { type: "logical", operator: "or", left, right } as LogicalNode;
    }

    return left;
  }

  private parseLogicalAnd(): ASTNode {
    let left = this.parseComparison();

    while (this.current.type === TokenType.AND) {
      this.advance();
      const right = this.parseComparison();
      left = { type: "logical", operator: "and", left, right } as LogicalNode;
    }

    return left;
  }

  private parseComparison(): ASTNode {
    const left = this.parseConversionExpression();

    // Handle "is" keyword for type checking
    if (
      this.current.type === TokenType.KEYWORD &&
      this.current.value === "is"
    ) {
      this.advance(); // consume "is"

      // Accept any identifier-like token as a potential type name
      const validTypeTokens = [
        TokenType.VARIABLE,
        TokenType.UNIT,
        TokenType.KEYWORD,
        TokenType.CURRENCY,
        TokenType.CONSTANT,
        TokenType.FUNCTION,
        TokenType.NULL, // Allow "null" as type name
      ];

      if (!validTypeTokens.includes(this.current.type)) {
        throw new Error(
          `Expected type name after 'is', got ${this.current.value}`
        );
      }

      const checkType = this.current.value;
      this.advance();

      return {
        type: "typeCheck",
        expression: left,
        checkType,
      } as TypeCheckNode;
    }

    if (this.isComparisonOperator(this.current.type)) {
      // We know it's a comparison operator but TypeScript can't narrow it
      const operator = this.getComparisonOperator(this.current.type);
      this.advance();
      const right = this.parseConversionExpression();
      return { type: "comparison", operator, left, right } as ComparisonNode;
    }

    return left;
  }

  private isComparisonOperator(
    type: TokenType
  ): type is
    | "EQUAL"
    | "NOT_EQUAL"
    | "LESS_THAN"
    | "GREATER_THAN"
    | "LESS_EQUAL"
    | "GREATER_EQUAL" {
    return (
      type === TokenType.EQUAL ||
      type === TokenType.NOT_EQUAL ||
      type === TokenType.LESS_THAN ||
      type === TokenType.GREATER_THAN ||
      type === TokenType.LESS_EQUAL ||
      type === TokenType.GREATER_EQUAL
    );
  }

  private getComparisonOperator(type: TokenType): ComparisonNode["operator"] {
    switch (type) {
      case TokenType.EQUAL:
        return "==";
      case TokenType.NOT_EQUAL:
        return "!=";
      case TokenType.LESS_THAN:
        return "<";
      case TokenType.GREATER_THAN:
        return ">";
      case TokenType.LESS_EQUAL:
        return "<=";
      case TokenType.GREATER_EQUAL:
        return ">=";
      default:
        throw new Error(`Invalid comparison operator token: ${type}`);
    }
  }

  private isTimeNode(node: ASTNode): boolean {
    // We can't determine at parse time if a variable contains a date/time
    // So we should be conservative and treat all variables as potential time nodes
    return (
      node.type === "time" ||
      node.type === "datetime" ||
      node.type === "date" ||
      node.type === "variable"
    );
  }

  private isTimestampResult(node: ASTNode): boolean {
    // Helper to determine if a binary operation will result in a timestamp
    if (node.type !== "binary") {
      return false;
    }
    const binNode = node as BinaryOpNode;

    // Subtraction of two times/dates results in a duration, not a timestamp
    if (binNode.operator === "-") {
      const leftIsTime = this.isTimeNode(binNode.left);
      const rightIsTime = this.isTimeNode(binNode.right);
      return !(leftIsTime && rightIsTime); // Not a timestamp if both are times
    }

    return false;
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this function to reduce complexity
  private parseConversionExpression(): ASTNode {
    let node = this.parseOf();

    // Handle type casting with "as" or "to" keyword for type conversions
    if (
      this.current.type === TokenType.KEYWORD &&
      (this.current.value === "as" || this.current.value === "to")
    ) {
      const savedPosition = this.position;
      const savedCurrent = this.current;

      this.advance(); // consume "as" or "to"
      const nextToken = this.current;

      // Check if it's a type cast to string, number, boolean, array, or object
      if (nextToken.type === TokenType.VARIABLE) {
        const targetType = nextToken.value.toLowerCase();
        if (
          targetType === "string" ||
          targetType === "number" ||
          targetType === "boolean" ||
          targetType === "array" ||
          targetType === "object"
        ) {
          this.advance();
          return {
            type: "typeCast",
            expression: node,
            targetType: targetType as
              | "string"
              | "number"
              | "boolean"
              | "array"
              | "object",
          } as TypeCastNode;
        }
      }

      // Not a type cast, restore position for unit/timezone conversion handling
      this.position = savedPosition;
      this.current = savedCurrent;
    }

    // Handle unit/timezone conversion at the expression level (lowest precedence)
    const currentToken = this.current;
    if (
      currentToken.type === TokenType.KEYWORD &&
      ["in", "to", "as"].includes(currentToken.value)
    ) {
      const _convKeyword = currentToken.value;
      this.advance();
      const nextToken = this.current;

      // Check if we're converting a time/date (which could be a timezone conversion)
      // But NOT if it's a duration (result of time subtraction)
      const _isDuration =
        node.type === "binary" &&
        (node as BinaryOpNode).operator === "-" &&
        this.isTimeNode((node as BinaryOpNode).left) &&
        this.isTimeNode((node as BinaryOpNode).right);

      // First, try to parse as a compound unit for conversion
      const compoundUnit = parseCompoundUnit(this.tokens, this.position);

      if (compoundUnit) {
        // We have a compound unit like "kg/h" or "kg*h^-1"
        const targetUnit = unitsToExpression(compoundUnit.units);
        this.position = compoundUnit.endPos;
        this.current = this.tokens[this.position] || {
          type: TokenType.EOF,
          value: "",
          position: this.position,
        };
        node = {
          type: "binary",
          operator: "convert",
          left: node,
          right: { type: "number", value: 1, unit: targetUnit } as NumberNode,
        } as BinaryOpNode;
      } else if (
        nextToken.type === TokenType.UNIT ||
        nextToken.type === TokenType.CURRENCY
      ) {
        // For regular unit conversion of numeric results
        const targetUnit = nextToken.value;
        this.advance();
        node = {
          type: "binary",
          operator: "convert",
          left: node,
          right: { type: "number", value: 1, unit: targetUnit } as NumberNode,
        } as BinaryOpNode;
      } else {
        // Check if this might be a timezone conversion
        const isDuration =
          node.type === "binary" &&
          (node as BinaryOpNode).operator === "-" &&
          this.isTimeNode((node as BinaryOpNode).left) &&
          this.isTimeNode((node as BinaryOpNode).right);

        const isTimeOrDate =
          !isDuration &&
          (node.type === "time" ||
            node.type === "datetime" ||
            node.type === "date" ||
            // Only treat variables as potential dates if the target looks like a timezone
            (node.type === "variable" &&
              (nextToken.type === TokenType.TIMEZONE ||
                (nextToken.type === TokenType.VARIABLE &&
                  !isUnit(nextToken.value)))) ||
            node.type === "dateOperation" ||
            (node.type === "binary" &&
              (node as BinaryOpNode).operator === "timezone_convert") ||
            // Also check if it's a timestamp result
            (node.type === "binary" && this.isTimestampResult(node)));

        if (
          isTimeOrDate &&
          (nextToken.type === TokenType.TIMEZONE ||
            nextToken.type === TokenType.VARIABLE ||
            (nextToken.type as string) === TokenType.UNIT ||
            (nextToken.type as string) === TokenType.CURRENCY ||
            nextToken.type === TokenType.KEYWORD ||
            nextToken.type === TokenType.EOF)
        ) {
          // For time/date nodes, any identifier could be a timezone
          if (nextToken.type === TokenType.EOF) {
            // Incomplete expression, just return the node as-is
            return node;
          }

          // Timezone conversion
          const targetTimezone = nextToken.value;
          this.advance();
          node = {
            type: "binary",
            operator: "timezone_convert",
            left: node,
            right: { type: "variable", name: targetTimezone } as VariableNode,
          } as BinaryOpNode;
        }
      }
    }

    return node;
  }

  private parseOf(): ASTNode {
    const node = this.parseAdditive();

    // Handle "of" for percentage calculations (e.g., "20% of 100")
    if (
      this.current.type === TokenType.KEYWORD &&
      this.current.value === "of" &&
      node.type === "binary" &&
      (node as BinaryOpNode).operator === "percent"
    ) {
      this.advance(); // consume 'of'
      const right = this.parseAdditive();

      // Convert "X% of Y" to "(X/100) * Y"
      const percentValue = (node as BinaryOpNode).left;
      return {
        type: "binary",
        operator: "*",
        left: {
          type: "binary",
          operator: "/",
          left: percentValue,
          right: { type: "number", value: 100 } as NumberNode,
        } as BinaryOpNode,
        right,
      } as BinaryOpNode;
    }

    return node;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (
      this.current.type === TokenType.OPERATOR &&
      ["+", "-"].includes(this.current.value)
    ) {
      const operator = this.current.value;
      this.advance();
      const right = this.parseMultiplicative();

      // Check if this is a date operation
      const isDateNode = (node: ASTNode): node is DateNode =>
        node.type === "date";
      const isDateTimeNode = (node: ASTNode): node is DateTimeNode =>
        node.type === "datetime";
      const hasDate = isDateNode(left) || isDateTimeNode(left);

      if (hasDate && right.type === "number" && (right as NumberNode).unit) {
        const unit = (right as NumberNode).unit;
        if (
          unit &&
          [
            "day",
            "days",
            "d",
            "week",
            "weeks",
            "w",
            "month",
            "months",
            "year",
            "years",
            "yr",
            "hour",
            "hours",
            "h",
            "hr",
            "minute",
            "minutes",
            "min",
            "m",
            "second",
            "seconds",
            "s",
            "sec",
          ].includes(unit)
        ) {
          left = {
            type: "dateOperation",
            date: left,
            operation: operator === "+" ? "add" : "subtract",
            value: right,
            unit,
          } as DateOperationNode;
          continue;
        }
      }

      // Check if right side is a percentage (e.g., 100 + 10% or 100 - 10%)
      if (
        right.type === "binary" &&
        (right as BinaryOpNode).operator === "percent"
      ) {
        // If left side is also a percentage, just add/subtract them as decimals
        if (
          left.type === "binary" &&
          (left as BinaryOpNode).operator === "percent"
        ) {
          left = {
            type: "binary",
            operator,
            left,
            right,
          } as BinaryOpNode;
        } else {
          // Convert "X + Y%" to "X + (X * Y/100)" or "X - Y%" to "X - (X * Y/100)"
          const percentValue = (right as BinaryOpNode).left;
          const percentCalculation = {
            type: "binary",
            operator: "*",
            left,
            right: {
              type: "binary",
              operator: "/",
              left: percentValue,
              right: { type: "number", value: 100 } as NumberNode,
            } as BinaryOpNode,
          } as BinaryOpNode;

          left = {
            type: "binary",
            operator,
            left,
            right: percentCalculation,
          } as BinaryOpNode;
        }
      } else {
        left = {
          type: "binary",
          operator,
          left,
          right,
        } as BinaryOpNode;
      }
    }

    return left;
  }

  private parseMultiplicative(): ASTNode {
    return this.parseBinary(this.parsePower.bind(this), ["*", "/", "%"]);
  }

  private parsePower(): ASTNode {
    return this.parseBinary(this.parseBitwise.bind(this), ["^"], true);
  }

  private parseBitwise(): ASTNode {
    return this.parseBinary(this.parseUnary.bind(this), ["&", "|", "<<", ">>"]);
  }

  private parseBinary(
    parseHigherPrecedence: () => ASTNode,
    operators: string[],
    rightAssociative = false
  ): ASTNode {
    let left = parseHigherPrecedence();

    while (
      this.current.type === TokenType.OPERATOR &&
      operators.includes(this.current.value)
    ) {
      const operator = this.current.value;
      this.advance();

      const right = rightAssociative
        ? this.parseBinary(parseHigherPrecedence, operators, rightAssociative)
        : parseHigherPrecedence();

      left = {
        type: "binary",
        operator,
        left,
        right,
      } as BinaryOpNode;

      if (rightAssociative) {
        break;
      }
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (
      this.current.type === TokenType.OPERATOR &&
      ["+", "-"].includes(this.current.value)
    ) {
      const operator = this.current.value;
      this.advance();
      return {
        type: "unary",
        operator,
        operand: this.parseUnary(),
      } as UnaryOpNode;
    }

    // Handle logical NOT
    if (this.current.type === TokenType.NOT) {
      this.advance();
      const operand = this.parseUnary();
      return {
        type: "logical",
        operator: "not",
        right: operand,
      } as LogicalNode;
    }

    return this.parsePostfix();
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: It is complex by design
  private parsePostfix(): ASTNode {
    let node = this.parsePrimary();

    // Handle postfix operations: property access, index access, unit conversion, and percentage
    while (true) {
      // Property access (dot notation)
      if (this.current.type === TokenType.DOT) {
        this.advance(); // consume dot

        if (
          (this.current as Token).type !== TokenType.VARIABLE &&
          (this.current as Token).type !== TokenType.NUMBER &&
          (this.current as Token).type !== TokenType.KEYWORD &&
          (this.current as Token).type !== TokenType.UNIT &&
          (this.current as Token).type !== TokenType.CONSTANT
        ) {
          throw new Error(
            `Expected property name after '.', got ${this.current.type}`
          );
        }

        const property = this.current.value;
        this.advance();

        node = {
          type: "propertyAccess",
          object: node,
          property: { type: "string", value: property } as StringNode,
          computed: false,
        } as PropertyAccessNode;
        continue;
      }

      // Index access (bracket notation)
      if (this.current.type === TokenType.LBRACKET) {
        this.advance(); // consume [
        const index = this.parseExpression();
        this.consume(TokenType.RBRACKET, "Expected ] after index");

        // Determine if this is array index access or object property access
        // This will be decided at evaluation time based on the type of the object
        node = {
          type: "propertyAccess",
          object: node,
          property: index,
          computed: true,
        } as PropertyAccessNode;
        continue;
      }

      if (
        this.current.type === TokenType.UNIT ||
        this.current.type === TokenType.CURRENCY
      ) {
        // Try to parse as a compound unit
        const compoundUnit = parseCompoundUnit(this.tokens, this.position);

        if (compoundUnit) {
          // We have a compound unit like "kg/s" or "m*s^-2"
          const unitExpression = unitsToExpression(compoundUnit.units);
          this.position = compoundUnit.endPos;
          this.current = this.tokens[this.position] || {
            type: TokenType.EOF,
            value: "",
            position: this.position,
          };

          if (node.type === "number") {
            (node as NumberNode).unit = unitExpression;
          } else {
            // Wrap in a conversion node if needed
            node = {
              type: "binary",
              operator: "unit",
              left: node,
              right: {
                type: "number",
                value: 1,
                unit: unitExpression,
              } as NumberNode,
            } as BinaryOpNode;
          }
        } else {
          // Simple single unit
          const unit = this.current.value;
          this.advance();

          if (node.type === "number") {
            (node as NumberNode).unit = unit;
          } else {
            // Wrap in a conversion node if needed
            node = {
              type: "binary",
              operator: "unit",
              left: node,
              right: { type: "number", value: 1, unit } as NumberNode,
            } as BinaryOpNode;
          }
        }
      } else if (
        this.current.type === TokenType.OPERATOR &&
        this.current.value === "%" &&
        this.isPercentageContext()
      ) {
        this.advance();
        node = {
          type: "binary",
          operator: "percent",
          left: node,
          right: { type: "number", value: 100 } as NumberNode,
        } as BinaryOpNode;
      } else if (
        this.current.type === TokenType.KEYWORD &&
        ["in", "to", "as"].includes(this.current.value)
      ) {
        // Handle timezone conversion immediately after time/date nodes
        // BUT only if it's not followed by a unit (which would indicate unit conversion at expression level)
        const isTimeOrDate =
          node.type === "time" ||
          node.type === "datetime" ||
          node.type === "date" ||
          (node.type === "variable" && (node as VariableNode).name === "now");

        if (isTimeOrDate) {
          // Peek ahead to see what follows the conversion keyword
          const nextToken = this.peek(1);

          // If the next token is a unit AND we're at expression level (could be time subtraction),
          // don't consume the conversion here - let parseConversionExpression handle it
          if (nextToken && nextToken.type === TokenType.UNIT) {
            // Check if this might be part of a larger expression by looking further ahead
            const tokenAfterUnit = this.peek(2);
            if (
              !tokenAfterUnit ||
              tokenAfterUnit.type === TokenType.EOF ||
              tokenAfterUnit.type === TokenType.RPAREN
            ) {
              // This looks like expression-level unit conversion, don't handle it here
              break;
            }
          }

          this.advance(); // consume 'in', 'to', or 'as'
          const nextTokenAfterAdvance = this.current;

          // For time/date nodes, any identifier could be a timezone
          if (
            nextTokenAfterAdvance.type === TokenType.TIMEZONE ||
            nextTokenAfterAdvance.type === TokenType.VARIABLE ||
            nextTokenAfterAdvance.type === TokenType.UNIT ||
            nextTokenAfterAdvance.type === TokenType.CURRENCY ||
            nextTokenAfterAdvance.type === TokenType.KEYWORD ||
            nextTokenAfterAdvance.type === TokenType.EOF
          ) {
            if (nextTokenAfterAdvance.type === TokenType.EOF) {
              // Incomplete expression, just return the node as-is
              return node;
            }

            // Timezone conversion
            const targetTimezone = nextTokenAfterAdvance.value;
            this.advance();
            node = {
              type: "binary",
              operator: "timezone_convert",
              left: node,
              right: { type: "variable", name: targetTimezone } as VariableNode,
            } as BinaryOpNode;
          }
        } else {
          // Not a time/date node, don't consume the keyword
          break;
        }
      } else {
        break;
      }
    }

    return node;
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: It is complex by design
  private parsePrimary(): ASTNode {
    // Numbers
    if (this.current.type === TokenType.NUMBER) {
      const value = Number.parseFloat(this.current.value);
      this.advance();
      return { type: "number", value } as NumberNode;
    }

    // String literals with interpolation (backticks)
    if (this.current.type === TokenType.STRING_LITERAL) {
      const token = this.current as Token & {
        interpolations?: { position: number; expression: string }[];
      };
      const value = token.value;
      const interpolations = token.interpolations;
      this.advance();

      // If there are interpolations, parse them
      if (interpolations && interpolations.length > 0) {
        const parsedInterpolations = interpolations.map((interp) => {
          // Create a new tokenizer and parser for the interpolation expression
          const { Tokenizer } = require("./tokenizer");
          const interpTokenizer = new Tokenizer(interp.expression);
          const interpTokens = interpTokenizer.tokenize();
          const interpParser = new Parser(interpTokens);
          return {
            position: interp.position,
            expression: interpParser.parseExpression(),
          };
        });
        return {
          type: "string",
          value,
          interpolations: parsedInterpolations,
        } as StringNode;
      }

      return { type: "string", value } as StringNode;
    }

    // Single quote strings (no interpolation)
    if (this.current.type === TokenType.SINGLE_QUOTE_STRING) {
      const value = this.current.value;
      this.advance();
      return { type: "string", value } as StringNode;
    }

    // Double quote strings (no interpolation)
    if (this.current.type === TokenType.DOUBLE_QUOTE_STRING) {
      const value = this.current.value;
      this.advance();
      return { type: "string", value } as StringNode;
    }

    // Boolean literals
    if (this.current.type === TokenType.TRUE) {
      this.advance();
      return { type: "boolean", value: true } as BooleanNode;
    }

    if (this.current.type === TokenType.FALSE) {
      this.advance();
      return { type: "boolean", value: false } as BooleanNode;
    }

    // Null literal
    if (this.current.type === TokenType.NULL) {
      this.advance();
      return { type: "null" } as NullNode;
    }

    // Array literals
    if (this.current.type === TokenType.LBRACKET) {
      return this.parseArray();
    }

    // Object literals
    if (this.current.type === TokenType.LBRACE) {
      return this.parseObject();
    }

    // Variables and Constants
    // Both VARIABLE and CONSTANT tokens are checked here
    // The evaluator will check variables first, then constants
    if (
      this.current.type === TokenType.VARIABLE ||
      this.current.type === TokenType.CONSTANT
    ) {
      const name = this.current.value;
      const isConstantToken = this.current.type === TokenType.CONSTANT;
      this.advance();

      // First try as variable, then as constant
      // This is handled in the evaluator
      if (isConstantToken) {
        return { type: "constant", name } as ConstantNode;
      }
      return { type: "variable", name } as VariableNode;
    }

    // Date literals (DD.MM.YYYY or DD/MM/YYYY or DD.MM.YYYYTHH:MM)
    if (this.current.type === TokenType.DATE_LITERAL) {
      const dateValue = this.current.value;
      this.advance();

      // Check if it contains time (datetime format)
      if (dateValue.includes("T")) {
        const [datePart, timePart] = dateValue.split("T");

        // Check for timezone
        const currentToken = this.current;
        if (currentToken.type === TokenType.AT_SYMBOL) {
          this.advance(); // consume @
          const tokenAfterAt = this.current;
          if (tokenAfterAt.type === TokenType.EOF) {
            // Incomplete expression - treat as datetime without timezone
            return {
              type: "datetime",
              dateValue: datePart,
              timeValue: timePart,
            } as DateTimeNode;
          }

          // Accept any identifier-like token as a potential timezone
          if (
            tokenAfterAt.type === TokenType.TIMEZONE ||
            tokenAfterAt.type === TokenType.VARIABLE ||
            tokenAfterAt.type === TokenType.UNIT ||
            tokenAfterAt.type === TokenType.CURRENCY ||
            tokenAfterAt.type === TokenType.KEYWORD
          ) {
            const timezone = tokenAfterAt.value;
            this.advance();
            return {
              type: "datetime",
              dateValue: datePart,
              timeValue: timePart,
              timezone,
            } as DateTimeNode;
          }
          throw new Error(`Invalid timezone: ${tokenAfterAt.value}`);
        }

        // DateTime without timezone
        return {
          type: "datetime",
          dateValue: datePart,
          timeValue: timePart,
        } as DateTimeNode;
      }

      return { type: "date", value: dateValue } as DateNode;
    }

    // Time literals (HH:MM)
    if (this.current.type === TokenType.TIME_LITERAL) {
      const timeValue = this.current.value;
      this.advance();

      // Check for timezone
      const currentToken = this.current;
      if (currentToken.type === TokenType.AT_SYMBOL) {
        this.advance(); // consume @
        const tokenAfterAt = this.current;
        if (tokenAfterAt.type === TokenType.EOF) {
          // Incomplete expression - treat as time without timezone
          return { type: "time", value: timeValue } as TimeNode;
        }

        // Accept any identifier-like token as a potential timezone
        if (
          tokenAfterAt.type === TokenType.TIMEZONE ||
          tokenAfterAt.type === TokenType.VARIABLE ||
          tokenAfterAt.type === TokenType.UNIT ||
          tokenAfterAt.type === TokenType.CURRENCY ||
          tokenAfterAt.type === TokenType.KEYWORD
        ) {
          const timezone = tokenAfterAt.value;
          this.advance();
          return { type: "time", value: timeValue, timezone } as TimeNode;
        }
        throw new Error(`Invalid timezone: ${tokenAfterAt.value}`);
      }

      // Time without timezone uses system timezone
      return { type: "time", value: timeValue } as TimeNode;
    }

    // Keywords
    if (this.current.type === TokenType.KEYWORD) {
      if (this.current.value === "prev") {
        this.advance();
        return { type: "variable", name: "prev" } as VariableNode;
      }
      // Aggregate keywords
      if (
        ["total", "sum", "average", "avg", "agg", "aggregate"].includes(
          this.current.value
        )
      ) {
        let aggregateType = this.current.value;
        // Convert aliases to canonical names
        if (aggregateType === "sum") {
          aggregateType = "total";
        }
        if (aggregateType === "avg") {
          aggregateType = "average";
        }
        if (aggregateType === "aggregate") {
          aggregateType = "agg";
        }
        this.advance();

        // Check for "in unit" syntax
        const currentTokenCheck = this.current;
        if (
          currentTokenCheck.type === TokenType.KEYWORD &&
          ["in", "to", "as"].includes(currentTokenCheck.value)
        ) {
          this.advance(); // consume 'in', 'to', or 'as'
          const nextToken = this.current;

          // Expect a unit or currency
          if (
            nextToken.type === TokenType.UNIT ||
            nextToken.type === TokenType.CURRENCY
          ) {
            const targetUnit = nextToken.value;
            this.advance();
            return {
              type: "aggregate",
              operation: aggregateType,
              targetUnit,
            } as AggregateNode;
          }
          // If not a unit, back up and treat as regular aggregate
          this.position--;
          this.current = this.tokens[this.position] || {
            type: TokenType.EOF,
            value: "",
            position: this.position,
          };
        }

        return { type: "aggregate", operation: aggregateType } as AggregateNode;
      }
      // Date keywords
      if (
        [
          "today",
          "now",
          "tomorrow",
          "yesterday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ].includes(this.current.value)
      ) {
        const dateValue = this.current.value;
        this.advance();

        // Check for timezone after date keyword (e.g., now@tokyo, today@berlin)
        const currentToken = this.current;
        if (currentToken.type === TokenType.AT_SYMBOL) {
          this.advance(); // consume @
          const tokenAfterAt = this.current;
          if (tokenAfterAt.type === TokenType.EOF) {
            // Incomplete expression - treat as date without timezone
            return { type: "date", value: dateValue } as DateNode;
          }

          // Accept any identifier-like token as a potential timezone
          if (
            tokenAfterAt.type === TokenType.TIMEZONE ||
            tokenAfterAt.type === TokenType.VARIABLE ||
            tokenAfterAt.type === TokenType.UNIT ||
            tokenAfterAt.type === TokenType.CURRENCY ||
            tokenAfterAt.type === TokenType.KEYWORD
          ) {
            const timezone = tokenAfterAt.value;
            this.advance();
            return {
              type: "date",
              value: dateValue,
              timezone,
            } as DateNode;
          }
          throw new Error(`Invalid timezone: ${tokenAfterAt.value}`);
        }

        return { type: "date", value: dateValue } as DateNode;
      }
    }

    // Functions
    if (this.current.type === TokenType.FUNCTION) {
      return this.parseFunction();
    }

    // Parentheses
    if (this.current.type === TokenType.LPAREN) {
      this.advance(); // consume (
      const node = this.parseExpression();
      this.consume(TokenType.RPAREN, "Expected )");
      return node;
    }

    throw new Error(`Unexpected token: ${this.current.value}`);
  }

  private parseFunction(): FunctionNode {
    const name = this.current.value;
    this.advance();

    if (this.current.type === TokenType.LPAREN) {
      this.advance(); // consume (
      const args: ASTNode[] = [];

      // Parse function arguments
      if ((this.current as Token).type !== TokenType.RPAREN) {
        args.push(this.parseExpression());

        while ((this.current as Token).type === TokenType.COMMA) {
          this.advance(); // consume ,
          args.push(this.parseExpression());
        }
      }

      this.consume(TokenType.RPAREN, "Expected )");
      return { type: "function", name, args } as FunctionNode;
    }
    // Function without parentheses (single argument)
    const arg = this.parseUnary();
    return { type: "function", name, args: [arg] } as FunctionNode;
  }

  private isPercentageContext(): boolean {
    // % is a percentage when:
    // - It's at the end of the expression
    // - It's followed by an operator other than a number
    // - It's followed by "of", "in", etc.
    const next = this.peek();
    if (!next || next.type === TokenType.EOF) {
      return true;
    }
    if (next.type === TokenType.OPERATOR && next.value !== "%") {
      return true;
    }
    if (next.type === TokenType.KEYWORD) {
      return true;
    }
    if (next.type === TokenType.RPAREN) {
      return true;
    }
    if (next.type === TokenType.COMMA) {
      return true;
    }
    return false;
  }

  private parseArray(): ArrayNode {
    this.consume(TokenType.LBRACKET, "Expected [");
    const elements: ASTNode[] = [];

    // Handle empty array
    if (this.current.type === TokenType.RBRACKET) {
      this.advance();
      return { type: "array", elements };
    }

    // Parse first element
    elements.push(this.parseExpression());

    // Parse remaining elements
    while (this.current.type === TokenType.COMMA) {
      this.advance(); // consume comma

      // Allow trailing comma
      if ((this.current as Token).type === TokenType.RBRACKET) {
        break;
      }

      elements.push(this.parseExpression());
    }

    this.consume(TokenType.RBRACKET, "Expected ]");
    return { type: "array", elements };
  }

  private parseObject(): ObjectNode {
    this.consume(TokenType.LBRACE, "Expected {");
    const properties = new Map<string, ASTNode>();

    // Handle empty object
    if (this.current.type === TokenType.RBRACE) {
      this.advance();
      return { type: "object", properties };
    }

    // Parse first property
    this.parseObjectProperty(properties);

    // Parse remaining properties
    while (this.current.type === TokenType.COMMA) {
      this.advance(); // consume comma

      // Allow trailing comma
      if ((this.current as Token).type === TokenType.RBRACE) {
        break;
      }

      this.parseObjectProperty(properties);
    }

    this.consume(TokenType.RBRACE, "Expected }");
    return { type: "object", properties };
  }

  private parseObjectProperty(properties: Map<string, ASTNode>): void {
    // Property key can be:
    // - identifier: { foo: 1 }
    // - string: { "foo": 1 }
    // - number: { 0: 1 }
    let key: string;

    if (
      this.current.type === TokenType.VARIABLE ||
      this.current.type === TokenType.KEYWORD ||
      this.current.type === TokenType.UNIT ||
      this.current.type === TokenType.CONSTANT
    ) {
      key = this.current.value;
      this.advance();
    } else if (
      this.current.type === TokenType.STRING_LITERAL ||
      this.current.type === TokenType.SINGLE_QUOTE_STRING ||
      this.current.type === TokenType.DOUBLE_QUOTE_STRING
    ) {
      key = this.current.value;
      this.advance();
    } else if (this.current.type === TokenType.NUMBER) {
      key = this.current.value;
      this.advance();
    } else {
      throw new Error(`Expected property key, got ${this.current.type}`);
    }

    this.consume(TokenType.COLON, "Expected : after property key");
    const value = this.parseExpression();

    properties.set(key, value);
  }
}
