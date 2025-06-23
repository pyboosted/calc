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
    return this.parseOf();
  }
  
  private parseOf(): ASTNode {
    let node = this.parseConversion();
    
    // Handle "of" for percentage calculations (e.g., "20% of 100")
    if (this.current.type === TokenType.KEYWORD && this.current.value === 'of') {
      // Check if left side is a percentage
      if (node.type === 'binary' && (node as BinaryOpNode).operator === 'percent') {
        this.advance(); // consume 'of'
        const right = this.parseConversion();
        
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
  
  private parseConversion(): ASTNode {
    let node = this.parseAdditive();
    
    // Handle "in", "to", "as" for unit and timezone conversion at expression level
    if (this.current.type === TokenType.KEYWORD && ['in', 'to', 'as'].includes(this.current.value)) {
      this.advance();
      if (this.current.type === TokenType.UNIT || this.current.type === TokenType.CURRENCY) {
        const targetUnit = this.current.value;
        this.advance();
        node = {
          type: 'binary',
          operator: 'convert',
          left: node,
          right: { type: 'number', value: 1, unit: targetUnit } as NumberNode
        } as BinaryOpNode;
      } else if (this.current.type === TokenType.TIMEZONE || this.current.type === TokenType.VARIABLE) {
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
        if (['day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years', 
             'hour', 'hours', 'minute', 'minutes', 'second', 'seconds'].includes(unit!)) {
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