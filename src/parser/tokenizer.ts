import { Token, TokenType } from '../types';

export class Tokenizer {
  private input: string;
  private position: number = 0;
  private current: string = '';

  constructor(input: string) {
    this.input = input;
    this.current = this.input[0] || '';
  }

  private advance(): void {
    this.position++;
    this.current = this.input[this.position] || '';
  }

  private peek(offset: number = 1): string {
    return this.input[this.position + offset] || '';
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.current)) {
      this.advance();
    }
  }

  private readNumber(): Token {
    const start = this.position;
    let value = '';

    while (/[0-9]/.test(this.current)) {
      value += this.current;
      this.advance();
    }

    if (this.current === '.') {
      value += this.current;
      this.advance();
      
      while (/[0-9]/.test(this.current)) {
        value += this.current;
        this.advance();
      }
    }

    // Scientific notation
    if (this.current === 'e' || this.current === 'E') {
      value += this.current;
      this.advance();
      
      if (this.current === '+' || this.current === '-') {
        value += this.current;
        this.advance();
      }
      
      while (/[0-9]/.test(this.current)) {
        value += this.current;
        this.advance();
      }
    }

    return { type: TokenType.NUMBER, value, position: start };
  }

  private readIdentifier(): Token {
    const start = this.position;
    let value = '';

    // Support Unicode letters (including Cyrillic) and numbers
    while (/[\p{L}\p{N}_]/u.test(this.current)) {
      value += this.current;
      this.advance();
    }

    // Check if it's a keyword, function, unit, or variable
    const lowerValue = value.toLowerCase();
    
    // Keywords
    if (['in', 'to', 'as', 'of', 'what', 'is', 'prev', 'total', 'average', 'today', 'now', 'tomorrow', 'yesterday',
         'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
         'from', 'ago', 'hence', 'start', 'end', 'beginning'].includes(lowerValue)) {
      return { type: TokenType.KEYWORD, value: lowerValue, position: start };
    }
    
    // Functions
    if (['sqrt', 'cbrt', 'root', 'abs', 'log', 'ln', 'fact', 'round', 'ceil', 'floor',
         'sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
         'sum', 'average', 'avg', 'fromunix'].includes(lowerValue)) {
      return { type: TokenType.FUNCTION, value: lowerValue, position: start };
    }
    
    // Units
    if (this.isUnit(value)) {
      return { type: TokenType.UNIT, value, position: start };
    }
    
    // Currency
    if (this.isCurrency(value)) {
      return { type: TokenType.CURRENCY, value: value.toUpperCase(), position: start };
    }

    // Word operators
    if (['plus', 'minus', 'times', 'multiplied', 'divided', 'mod', 'xor'].includes(lowerValue)) {
      return { type: TokenType.OPERATOR, value: this.wordToOperator(lowerValue), position: start };
    }

    return { type: TokenType.VARIABLE, value, position: start };
  }

  private wordToOperator(word: string): string {
    const mapping: Record<string, string> = {
      'plus': '+',
      'minus': '-',
      'times': '*',
      'multiplied': '*',
      'divided': '/',
      'mod': '%',
      'xor': '^'
    };
    return mapping[word] || word;
  }

  private isUnit(value: string): boolean {
    const units = [
      // Length
      'meter', 'meters', 'm', 'centimeter', 'centimeters', 'cm', 'millimeter', 'millimeters', 'mm',
      'kilometer', 'kilometers', 'km', 'inch', 'inches', 'in', 'foot', 'feet', 'ft', 
      'yard', 'yards', 'yd', 'mile', 'miles', 'mi',
      // Weight
      'gram', 'grams', 'g', 'kilogram', 'kilograms', 'kg', 'milligram', 'milligrams', 'mg',
      'pound', 'pounds', 'lb', 'lbs', 'ounce', 'ounces', 'oz', 'stone', 'stones', 'st',
      // Temperature
      'celsius', 'c', 'fahrenheit', 'f', 'kelvin', 'k',
      // Time
      'second', 'seconds', 's', 'sec', 'minute', 'minutes', 'min', 'hour', 'hours', 'h',
      'day', 'days', 'd', 'week', 'weeks', 'month', 'months', 'year', 'years', 'yr',
      // Volume
      'liter', 'liters', 'l', 'milliliter', 'milliliters', 'ml', 'gallon', 'gallons', 'gal',
      'quart', 'quarts', 'qt', 'pint', 'pints', 'pt', 'cup', 'cups', 'tablespoon', 'tablespoons',
      'tbsp', 'teaspoon', 'teaspoons', 'tsp',
      // Area
      'hectare', 'hectares', 'ha', 'acre', 'acres',
      // Data
      'byte', 'bytes', 'b', 'kilobyte', 'kilobytes', 'kb', 'megabyte', 'megabytes', 'mb',
      'gigabyte', 'gigabytes', 'gb', 'terabyte', 'terabytes', 'tb', 'kibibyte', 'kibibytes',
      'kib', 'mebibyte', 'mebibytes', 'mib', 'gibibyte', 'gibibytes', 'gib'
    ];
    
    return units.includes(value.toLowerCase());
  }

  private isCurrency(value: string): boolean {
    // Common currency codes - we'll validate against actual rates at evaluation time
    const commonCurrencies = ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'inr', 'krw',
                              'sek', 'nok', 'dkk', 'pln', 'czk', 'huf', 'ron', 'bgn', 'hrk',
                              'rub', 'try', 'brl', 'mxn', 'ars', 'clp', 'cop', 'pen', 'uyu',
                              'zar', 'thb', 'sgd', 'hkd', 'twd', 'php', 'idr', 'myr', 'vnd',
                              'nzd', 'chf', 'aed', 'sar', 'qar', 'kwd', 'bhd', 'omr', 'jod',
                              'ils', 'egp', 'mad', 'tnd', 'lbp', 'jmd', 'bbd', 'ttd', 'xcd'];
    return commonCurrencies.includes(value.toLowerCase());
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.input.length) {
      this.skipWhitespace();
      
      if (this.position >= this.input.length) {
        break;
      }

      const start = this.position;

      // Numbers
      if (/[0-9]/.test(this.current) || (this.current === '.' && /[0-9]/.test(this.peek()))) {
        tokens.push(this.readNumber());
        continue;
      }

      // Identifiers (variables, functions, units, keywords)
      // Support Unicode letters including Cyrillic
      if (/\p{L}/u.test(this.current)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      // Operators and symbols
      switch (this.current) {
        case '+':
          tokens.push({ type: TokenType.OPERATOR, value: '+', position: start });
          this.advance();
          break;
        case '-':
          tokens.push({ type: TokenType.OPERATOR, value: '-', position: start });
          this.advance();
          break;
        case '*':
          tokens.push({ type: TokenType.OPERATOR, value: '*', position: start });
          this.advance();
          break;
        case '/':
          tokens.push({ type: TokenType.OPERATOR, value: '/', position: start });
          this.advance();
          break;
        case '^':
          tokens.push({ type: TokenType.OPERATOR, value: '^', position: start });
          this.advance();
          break;
        case '%':
          tokens.push({ type: TokenType.OPERATOR, value: '%', position: start });
          this.advance();
          break;
        case '(':
          tokens.push({ type: TokenType.LPAREN, value: '(', position: start });
          this.advance();
          break;
        case ')':
          tokens.push({ type: TokenType.RPAREN, value: ')', position: start });
          this.advance();
          break;
        case ',':
          tokens.push({ type: TokenType.COMMA, value: ',', position: start });
          this.advance();
          break;
        case '=':
          tokens.push({ type: TokenType.EQUALS, value: '=', position: start });
          this.advance();
          break;
        case '&':
          if (this.peek() === '&') {
            this.advance();
            this.advance();
            tokens.push({ type: TokenType.OPERATOR, value: '&', position: start });
          } else {
            tokens.push({ type: TokenType.OPERATOR, value: '&', position: start });
            this.advance();
          }
          break;
        case '|':
          if (this.peek() === '|') {
            this.advance();
            this.advance();
            tokens.push({ type: TokenType.OPERATOR, value: '|', position: start });
          } else {
            tokens.push({ type: TokenType.OPERATOR, value: '|', position: start });
            this.advance();
          }
          break;
        case '<':
          if (this.peek() === '<') {
            this.advance();
            this.advance();
            tokens.push({ type: TokenType.OPERATOR, value: '<<', position: start });
          } else {
            // Skip unknown character
            this.advance();
          }
          break;
        case '>':
          if (this.peek() === '>') {
            this.advance();
            this.advance();
            tokens.push({ type: TokenType.OPERATOR, value: '>>', position: start });
          } else {
            // Skip unknown character
            this.advance();
          }
          break;
        default:
          // Skip unknown characters
          this.advance();
      }
    }

    tokens.push({ type: TokenType.EOF, value: '', position: this.position });
    return tokens;
  }
}