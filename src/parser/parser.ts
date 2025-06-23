import { Token, TokenType, ASTNode, NumberNode, BinaryOpNode, UnaryOpNode, FunctionNode, VariableNode, AssignmentNode, AggregateNode, DateNode, TimeNode, DateTimeNode, DateOperationNode } from '../types';

export class Parser {
  private tokens: Token[];
  private position: number = 0;
  private current: Token;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.current = this.tokens[0];
  }

  private advance(): Token {
    if (this.position < this.tokens.length - 1) {
      this.position++;
      this.current = this.tokens[this.position];
    }
    return this.current;
  }

  private peek(offset: number = 1): Token | null {
    const pos = this.position + offset;
    return pos < this.tokens.length ? this.tokens[pos] : null;
  }

  private consume(type: TokenType, message?: string): Token {
    if (this.current.type !== type) {
      throw new Error(message || `Expected ${type} but got ${this.current.type}`);
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

    if (this.current.type === TokenType.EQUALS && expr.type === 'variable') {
      this.advance(); // consume =
      const value = this.parseExpression();
      return {
        type: 'assignment',
        variable: (expr as VariableNode).name,
        value
      } as AssignmentNode;
    }

    return expr;
  }

  private parseExpression(): ASTNode {
    return this.parseConversionExpression();
  }
  
  private isTimeNode(node: ASTNode): boolean {
    // We can't determine at parse time if a variable contains a date/time
    // So we should be conservative and treat all variables as potential time nodes
    return node.type === 'time' || node.type === 'datetime' || node.type === 'date' ||
           node.type === 'variable';
  }
  
  private isTimestampResult(node: ASTNode): boolean {
    // Helper to determine if a binary operation will result in a timestamp
    if (node.type !== 'binary') return false;
    const binNode = node as BinaryOpNode;
    
    // Subtraction of two times/dates results in a duration, not a timestamp
    if (binNode.operator === '-') {
      const leftIsTime = this.isTimeNode(binNode.left);
      const rightIsTime = this.isTimeNode(binNode.right);
      return !(leftIsTime && rightIsTime); // Not a timestamp if both are times
    }
    
    return false;
  }
  
  private parseConversionExpression(): ASTNode {
    let node = this.parseOf();
    
    // Handle unit/timezone conversion at the expression level (lowest precedence)
    if (this.current.type === TokenType.KEYWORD && ['in', 'to', 'as'].includes(this.current.value)) {
      const convKeyword = this.current.value;
      this.advance();
      
      // Check if we're converting a time/date (which could be a timezone conversion)
      // But NOT if it's a duration (result of time subtraction)
      const isDuration = node.type === 'binary' && (node as BinaryOpNode).operator === '-' &&
                        this.isTimeNode((node as BinaryOpNode).left) && 
                        this.isTimeNode((node as BinaryOpNode).right);
      
      const isTimeOrDate = !isDuration && (
                          node.type === 'time' || node.type === 'datetime' || node.type === 'date' ||
                          node.type === 'variable' || // Any variable could contain a timestamp
                          (node.type === 'dateOperation') ||
                          (node.type === 'binary' && (node as BinaryOpNode).operator === 'timezone_convert') ||
                          // Also check if it's a timestamp result
                          (node.type === 'binary' && this.isTimestampResult(node)));
      
      if (isTimeOrDate) {
        // For time/date nodes, any identifier could be a timezone
        if (this.current.type === TokenType.TIMEZONE || 
            this.current.type === TokenType.VARIABLE ||
            this.current.type === TokenType.UNIT ||
            this.current.type === TokenType.CURRENCY ||
            this.current.type === TokenType.KEYWORD ||
            this.current.type === TokenType.EOF) {
          
          if (this.current.type === TokenType.EOF) {
            // Incomplete expression, just return the node as-is
            return node;
          }
          
          // Timezone conversion
          const targetTimezone = this.current.value;
          this.advance();
          node = {
            type: 'binary',
            operator: 'timezone_convert',
            left: node,
            right: { type: 'variable', name: targetTimezone } as VariableNode
          } as BinaryOpNode;
        }
      } else {
        // For regular unit conversion of numeric results
        if (this.current.type === TokenType.UNIT || this.current.type === TokenType.CURRENCY) {
          const targetUnit = this.current.value;
          this.advance();
          node = {
            type: 'binary',
            operator: 'convert',
            left: node,
            right: { type: 'number', value: 1, unit: targetUnit } as NumberNode
          } as BinaryOpNode;
        }
      }
    }
    
    return node;
  }
  
  private parseOf(): ASTNode {
    let node = this.parseAdditive();
    
    // Handle "of" for percentage calculations (e.g., "20% of 100")
    if (this.current.type === TokenType.KEYWORD && this.current.value === 'of') {
      // Check if left side is a percentage
      if (node.type === 'binary' && (node as BinaryOpNode).operator === 'percent') {
        this.advance(); // consume 'of'
        const right = this.parseAdditive();
        
        // Convert "X% of Y" to "(X/100) * Y"
        const percentValue = (node as BinaryOpNode).left;
        return {
          type: 'binary',
          operator: '*',
          left: {
            type: 'binary',
            operator: '/',
            left: percentValue,
            right: { type: 'number', value: 100 } as NumberNode
          } as BinaryOpNode,
          right
        } as BinaryOpNode;
      }
    }
    
    return node;
  }
  
  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();
    
    while (this.current.type === TokenType.OPERATOR && ['+', '-'].includes(this.current.value)) {
      const operator = this.current.value;
      this.advance();
      const right = this.parseMultiplicative();
      
      // Check if this is a date operation
      if ((left.type === 'date' || (left as any).date) && right.type === 'number' && (right as NumberNode).unit) {
        const unit = (right as NumberNode).unit;
        if (['day', 'days', 'd',
             'week', 'weeks', 'w',
             'month', 'months',
             'year', 'years', 'yr',
             'hour', 'hours', 'h', 'hr',
             'minute', 'minutes', 'min', 'm',
             'second', 'seconds', 's', 'sec'].includes(unit!)) {
          left = {
            type: 'dateOperation',
            date: left,
            operation: operator === '+' ? 'add' : 'subtract',
            value: right,
            unit: unit
          } as DateOperationNode;
          continue;
        }
      }
      
      // Check if right side is a percentage (e.g., 100 + 10% or 100 - 10%)
      if (right.type === 'binary' && (right as BinaryOpNode).operator === 'percent') {
        // If left side is also a percentage, just add/subtract them as decimals
        if (left.type === 'binary' && (left as BinaryOpNode).operator === 'percent') {
          left = {
            type: 'binary',
            operator,
            left,
            right
          } as BinaryOpNode;
        } else {
          // Convert "X + Y%" to "X + (X * Y/100)" or "X - Y%" to "X - (X * Y/100)"
          const percentValue = (right as BinaryOpNode).left;
          const percentCalculation = {
            type: 'binary',
            operator: '*',
            left: left,
            right: {
              type: 'binary',
              operator: '/',
              left: percentValue,
              right: { type: 'number', value: 100 } as NumberNode
            } as BinaryOpNode
          } as BinaryOpNode;
          
          left = {
            type: 'binary',
            operator,
            left,
            right: percentCalculation
          } as BinaryOpNode;
        }
      } else {
        left = {
          type: 'binary',
          operator,
          left,
          right
        } as BinaryOpNode;
      }
    }
    
    return left;
  }

  private parseMultiplicative(): ASTNode {
    return this.parseBinary(this.parsePower.bind(this), ['*', '/', '%']);
  }

  private parsePower(): ASTNode {
    return this.parseBinary(this.parseBitwise.bind(this), ['^'], true);
  }

  private parseBitwise(): ASTNode {
    return this.parseBinary(this.parseUnary.bind(this), ['&', '|', '<<', '>>']);
  }

  private parseBinary(
    parseHigherPrecedence: () => ASTNode,
    operators: string[],
    rightAssociative: boolean = false
  ): ASTNode {
    let left = parseHigherPrecedence();

    while (this.current.type === TokenType.OPERATOR && operators.includes(this.current.value)) {
      const operator = this.current.value;
      this.advance();
      
      const right = rightAssociative 
        ? this.parseBinary(parseHigherPrecedence, operators, rightAssociative)
        : parseHigherPrecedence();
      
      left = {
        type: 'binary',
        operator,
        left,
        right
      } as BinaryOpNode;

      if (rightAssociative) break;
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (this.current.type === TokenType.OPERATOR && ['+', '-'].includes(this.current.value)) {
      const operator = this.current.value;
      this.advance();
      return {
        type: 'unary',
        operator,
        operand: this.parseUnary()
      } as UnaryOpNode;
    }

    return this.parsePostfix();
  }

  private parsePostfix(): ASTNode {
    let node = this.parsePrimary();

    // Handle unit conversion and percentage
    while (true) {
      if (this.current.type === TokenType.UNIT || this.current.type === TokenType.CURRENCY) {
        const unit = this.current.value;
        this.advance();
        
        if (node.type === 'number') {
          (node as NumberNode).unit = unit;
        } else {
          // Wrap in a conversion node if needed
          node = {
            type: 'binary',
            operator: 'unit',
            left: node,
            right: { type: 'number', value: 1, unit } as NumberNode
          } as BinaryOpNode;
        }
      } else if (this.current.type === TokenType.OPERATOR && this.current.value === '%' && 
                 this.isPercentageContext()) {
        this.advance();
        node = {
          type: 'binary',
          operator: 'percent',
          left: node,
          right: { type: 'number', value: 100 } as NumberNode
        } as BinaryOpNode;
      } else if (this.current.type === TokenType.KEYWORD && ['in', 'to', 'as'].includes(this.current.value)) {
        // Handle timezone conversion immediately after time/date nodes
        // BUT only if it's not followed by a unit (which would indicate unit conversion at expression level)
        const isTimeOrDate = node.type === 'time' || node.type === 'datetime' || node.type === 'date' ||
                            (node.type === 'variable' && (node as VariableNode).name === 'now');
        
        if (isTimeOrDate) {
          // Peek ahead to see what follows the conversion keyword
          const nextToken = this.peek(1);
          
          // If the next token is a unit AND we're at expression level (could be time subtraction),
          // don't consume the conversion here - let parseConversionExpression handle it
          if (nextToken && nextToken.type === TokenType.UNIT) {
            // Check if this might be part of a larger expression by looking further ahead
            const tokenAfterUnit = this.peek(2);
            if (!tokenAfterUnit || tokenAfterUnit.type === TokenType.EOF || 
                tokenAfterUnit.type === TokenType.RPAREN) {
              // This looks like expression-level unit conversion, don't handle it here
              break;
            }
          }
          
          this.advance(); // consume 'in', 'to', or 'as'
          
          // For time/date nodes, any identifier could be a timezone
          if (this.current.type === TokenType.TIMEZONE || 
              this.current.type === TokenType.VARIABLE ||
              this.current.type === TokenType.UNIT ||
              this.current.type === TokenType.CURRENCY ||
              this.current.type === TokenType.KEYWORD ||
              this.current.type === TokenType.EOF) {
            
            if (this.current.type === TokenType.EOF) {
              // Incomplete expression, just return the node as-is
              return node;
            }
            
            // Timezone conversion
            const targetTimezone = this.current.value;
            this.advance();
            node = {
              type: 'binary',
              operator: 'timezone_convert',
              left: node,
              right: { type: 'variable', name: targetTimezone } as VariableNode
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

  private parsePrimary(): ASTNode {
    // Numbers
    if (this.current.type === TokenType.NUMBER) {
      const value = parseFloat(this.current.value);
      this.advance();
      return { type: 'number', value } as NumberNode;
    }

    // Variables
    if (this.current.type === TokenType.VARIABLE) {
      const name = this.current.value;
      this.advance();
      return { type: 'variable', name } as VariableNode;
    }

    // Date literals (DD.MM.YYYY or DD/MM/YYYY or DD.MM.YYYYTHH:MM)
    if (this.current.type === TokenType.DATE_LITERAL) {
      const dateValue = this.current.value;
      this.advance();
      
      // Check if it contains time (datetime format)
      if (dateValue.includes('T')) {
        const [datePart, timePart] = dateValue.split('T');
        
        // Check for timezone
        if (this.current.type === TokenType.AT_SYMBOL) {
          this.advance(); // consume @
          if (this.current.type === TokenType.EOF) {
            // Incomplete expression - treat as datetime without timezone
            return { type: 'datetime', dateValue: datePart, timeValue: timePart } as DateTimeNode;
          }
          
          // Accept any identifier-like token as a potential timezone
          if (this.current.type === TokenType.TIMEZONE || 
              this.current.type === TokenType.VARIABLE ||
              this.current.type === TokenType.UNIT ||
              this.current.type === TokenType.CURRENCY ||
              this.current.type === TokenType.KEYWORD) {
            const timezone = this.current.value;
            this.advance();
            return { type: 'datetime', dateValue: datePart, timeValue: timePart, timezone } as DateTimeNode;
          } else {
            throw new Error(`Invalid timezone: ${this.current.value}`);
          }
        }
        
        // DateTime without timezone
        return { type: 'datetime', dateValue: datePart, timeValue: timePart } as DateTimeNode;
      }
      
      return { type: 'date', value: dateValue } as DateNode;
    }
    
    // Time literals (HH:MM)
    if (this.current.type === TokenType.TIME_LITERAL) {
      const timeValue = this.current.value;
      this.advance();
      
      // Check for timezone
      if (this.current.type === TokenType.AT_SYMBOL) {
        this.advance(); // consume @
        if (this.current.type === TokenType.EOF) {
          // Incomplete expression - treat as time without timezone
          return { type: 'time', value: timeValue } as TimeNode;
        }
        
        // Accept any identifier-like token as a potential timezone
        if (this.current.type === TokenType.TIMEZONE || 
            this.current.type === TokenType.VARIABLE ||
            this.current.type === TokenType.UNIT ||
            this.current.type === TokenType.CURRENCY ||
            this.current.type === TokenType.KEYWORD) {
          const timezone = this.current.value;
          this.advance();
          return { type: 'time', value: timeValue, timezone } as TimeNode;
        } else {
          throw new Error(`Invalid timezone: ${this.current.value}`);
        }
      }
      
      // Time without timezone uses system timezone
      return { type: 'time', value: timeValue } as TimeNode;
    }

    // Keywords
    if (this.current.type === TokenType.KEYWORD) {
      if (this.current.value === 'prev') {
        this.advance();
        return { type: 'variable', name: 'prev' } as VariableNode;
      }
      // Aggregate keywords
      if (this.current.value === 'total' || this.current.value === 'average') {
        const aggregateType = this.current.value;
        this.advance();
        
        // Check for "in unit" syntax
        if (this.current.type === TokenType.KEYWORD && ['in', 'to', 'as'].includes(this.current.value)) {
          this.advance(); // consume 'in', 'to', or 'as'
          
          // Expect a unit or currency
          if (this.current.type === TokenType.UNIT || this.current.type === TokenType.CURRENCY) {
            const targetUnit = this.current.value;
            this.advance();
            return { 
              type: 'aggregate', 
              operation: aggregateType,
              targetUnit 
            } as AggregateNode;
          } else {
            // If not a unit, back up and treat as regular aggregate
            this.position--;
            this.current = this.tokens[this.position];
          }
        }
        
        return { type: 'aggregate', operation: aggregateType } as AggregateNode;
      }
      // Date keywords
      if (['today', 'now', 'tomorrow', 'yesterday', 'monday', 'tuesday', 'wednesday', 
           'thursday', 'friday', 'saturday', 'sunday'].includes(this.current.value)) {
        const dateValue = this.current.value;
        this.advance();
        return { type: 'date', value: dateValue } as DateNode;
      }
    }

    // Functions
    if (this.current.type === TokenType.FUNCTION) {
      const name = this.current.value;
      this.advance();
      
      if (this.current.type === TokenType.LPAREN) {
        this.advance(); // consume (
        const args: ASTNode[] = [];
        
        if (this.current.type !== TokenType.RPAREN) {
          args.push(this.parseExpression());
          
          while (this.current.type === TokenType.COMMA) {
            this.advance(); // consume ,
            args.push(this.parseExpression());
          }
        }
        
        this.consume(TokenType.RPAREN, 'Expected )');
        return { type: 'function', name, args } as FunctionNode;
      } else {
        // Function without parentheses (single argument)
        const arg = this.parseUnary();
        return { type: 'function', name, args: [arg] } as FunctionNode;
      }
    }

    // Parentheses
    if (this.current.type === TokenType.LPAREN) {
      this.advance(); // consume (
      const node = this.parseExpression();
      this.consume(TokenType.RPAREN, 'Expected )');
      return node;
    }

    throw new Error(`Unexpected token: ${this.current.value}`);
  }

  private isPercentageContext(): boolean {
    // % is a percentage when:
    // - It's at the end of the expression
    // - It's followed by an operator other than a number
    // - It's followed by "of", "in", etc.
    const next = this.peek();
    if (!next || next.type === TokenType.EOF) return true;
    if (next.type === TokenType.OPERATOR && next.value !== '%') return true;
    if (next.type === TokenType.KEYWORD) return true;
    if (next.type === TokenType.RPAREN) return true;
    if (next.type === TokenType.COMMA) return true;
    return false;
  }
}