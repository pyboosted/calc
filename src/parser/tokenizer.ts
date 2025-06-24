import { type Token, TokenType } from "../types";

// Regex patterns
const WHITESPACE_PATTERN = /\s/;
const DIGIT_PATTERN = /[0-9]/;
const UNICODE_LETTER_PATTERN = /\p{L}/u;
const UNICODE_LETTER_OR_DIGIT_PATTERN = /[\p{L}\p{N}_]/u;
const DATETIME_LOOKAHEAD_PATTERN = /^\d{1,2}[./]\d{1,2}[./]\d{4}[Tt]/;
const UTC_OFFSET_PATTERN = /^utc[+-]\d{1,2}$/;

// Date keywords
export const DATE_KEYWORDS = [
  "today",
  "tomorrow",
  "yesterday",
  "now",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export class Tokenizer {
  private input: string;
  private position = 0;
  private current = "";

  constructor(input: string) {
    this.input = input;
    this.current = this.input[0] || "";
  }

  private advance(): void {
    this.position++;
    this.current = this.input[this.position] || "";
  }

  private peek(offset = 1): string {
    return this.input[this.position + offset] || "";
  }

  private skipWhitespace(): void {
    while (WHITESPACE_PATTERN.test(this.current)) {
      this.advance();
    }
  }

  private tryReadDate(): Token | null {
    const start = this.position;
    const savedPosition = this.position;
    const savedCurrent = this.current;
    let value = "";

    // Try to read DD
    let digits = 0;
    while (DIGIT_PATTERN.test(this.current) && digits < 2) {
      value += this.current;
      this.advance();
      digits++;
    }

    if (digits === 0) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    // Check for separator (. or /)
    if (this.current !== "." && this.current !== "/") {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    const separator = this.current;
    value += this.current;
    this.advance();

    // Try to read MM
    digits = 0;
    while (DIGIT_PATTERN.test(this.current) && digits < 2) {
      value += this.current;
      this.advance();
      digits++;
    }

    if (digits === 0) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    // Check for same separator
    if (this.current !== separator) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    value += this.current;
    this.advance();

    // Try to read YYYY
    digits = 0;
    while (DIGIT_PATTERN.test(this.current) && digits < 4) {
      value += this.current;
      this.advance();
      digits++;
    }

    if (digits !== 4) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    // Validate the date format
    const parts = value.split(separator);
    const day = Number.parseInt(parts[0] ?? "1", 10);
    const month = Number.parseInt(parts[1] ?? "1", 10);
    const year = Number.parseInt(parts[2] ?? "2000", 10);

    if (
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 1900 ||
      year > 2100
    ) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    return { type: TokenType.DATE_LITERAL, value, position: start };
  }

  private tryReadDateTime(): Token | null {
    const start = this.position;
    const savedPosition = this.position;
    const savedCurrent = this.current;

    // Look ahead for datetime pattern: DD.MM.YYYYTHH:MM or DD/MM/YYYYTHH:MM
    let lookahead = "";
    let tempPos = this.position;
    let count = 0;

    // Look for date pattern followed by T
    while (tempPos < this.input.length && count < 11) {
      // DD.MM.YYYY = 10 chars + T
      lookahead += this.input[tempPos];
      tempPos++;
      count++;
    }

    // Check if it matches datetime pattern
    if (!DATETIME_LOOKAHEAD_PATTERN.test(lookahead)) {
      return null;
    }

    // Now actually parse the datetime
    const dateToken = this.tryReadDate();
    if (!dateToken) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    // We should be at 'T' now
    if (this.current !== "T" && this.current !== "t") {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    // Include T in the value
    let value = `${dateToken.value}T`;
    this.advance(); // consume T

    // Try to read time part
    const _timeStart = this.position;
    const timeToken = this.tryReadTime();
    if (!timeToken) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    value += timeToken.value;

    return { type: TokenType.DATE_LITERAL, value, position: start };
  }

  private tryReadTime(): Token | null {
    const start = this.position;
    const savedPosition = this.position;
    const savedCurrent = this.current;
    let value = "";

    // Try to read HH
    let digits = 0;
    while (DIGIT_PATTERN.test(this.current) && digits < 2) {
      value += this.current;
      this.advance();
      digits++;
    }

    if (digits === 0) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    const hours = Number.parseInt(value, 10);
    if (hours < 0 || hours > 23) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    // Check for :
    if (this.current !== ":") {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    value += this.current;
    this.advance();

    // Try to read MM
    digits = 0;
    while (DIGIT_PATTERN.test(this.current) && digits < 2) {
      value += this.current;
      this.advance();
      digits++;
    }

    if (digits !== 2) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    const minutes = Number.parseInt(value.slice(-2), 10);
    if (minutes < 0 || minutes > 59) {
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    return { type: TokenType.TIME_LITERAL, value, position: start };
  }

  private readNumber(): Token {
    const start = this.position;
    let value = "";

    // Check if this could be a datetime pattern (DD.MM.YYYYTHH:MM)
    const datetimeToken = this.tryReadDateTime();
    if (datetimeToken) {
      return datetimeToken;
    }

    // Check if this could be a time pattern (HH:MM)
    const timeToken = this.tryReadTime();
    if (timeToken) {
      return timeToken;
    }

    // Check if this could be a date pattern (DD.MM.YYYY or DD/MM/YYYY)
    const dateToken = this.tryReadDate();
    if (dateToken) {
      return dateToken;
    }

    while (DIGIT_PATTERN.test(this.current)) {
      value += this.current;
      this.advance();
    }

    if (this.current === ".") {
      value += this.current;
      this.advance();

      while (DIGIT_PATTERN.test(this.current)) {
        value += this.current;
        this.advance();
      }
    }

    // Scientific notation - only consume 'e' if followed by valid exponent
    if (this.current === "e" || this.current === "E") {
      // Look ahead to check if this is valid scientific notation
      const savedPos = this.position;
      const savedCurrent = this.current;
      const savedValue = value;

      value += this.current;
      this.advance();

      // Check for optional sign
      const sign = this.current as string;
      if (sign === "+" || sign === "-") {
        value += sign;
        this.advance();
      }

      // Must have at least one digit for valid scientific notation
      if (DIGIT_PATTERN.test(this.current)) {
        // Valid scientific notation - consume all digits
        while (DIGIT_PATTERN.test(this.current)) {
          value += this.current;
          this.advance();
        }
      } else {
        // Not valid scientific notation - backtrack
        this.position = savedPos;
        this.current = savedCurrent;
        value = savedValue;
      }
    }

    return { type: TokenType.NUMBER, value, position: start };
  }

  private readIdentifier(): Token {
    const start = this.position;
    let value = "";

    // First, read a normal identifier without spaces
    while (UNICODE_LETTER_OR_DIGIT_PATTERN.test(this.current)) {
      value += this.current;
      this.advance();
    }

    // Special handling for UTC offsets (utc+5, utc-5, etc.)
    if (
      value.toLowerCase() === "utc" &&
      (this.current === "+" || this.current === "-")
    ) {
      const sign = this.current;
      value += sign;
      this.advance();

      // Read the offset number
      while (DIGIT_PATTERN.test(this.current)) {
        value += this.current;
        this.advance();
      }
    }

    // Check if this could be a multi-word timezone (only for known timezone prefixes)
    const lowerValue = value.toLowerCase();
    const multiWordTimezoneStarts = [
      "new",
      "los",
      "hong",
      "san",
      "cape",
      "sao",
      "buenos",
      "mexico",
    ];

    if (multiWordTimezoneStarts.includes(lowerValue) && this.current === " ") {
      // Save current position in case this isn't a timezone
      const savedPos = this.position;
      const savedValue = value;

      // Try to read the rest of the multi-word timezone
      value += this.current;
      this.advance();

      let nextPart = "";
      while (UNICODE_LETTER_PATTERN.test(this.current)) {
        nextPart += this.current;
        this.advance();
      }

      value += nextPart;
      const fullValue = value.trim();

      // Check if this forms a valid timezone
      if (this.isTimezone(fullValue)) {
        value = fullValue;
      } else {
        // Restore position and value if not a timezone
        this.position = savedPos;
        this.current = this.input[this.position] || "";
        value = savedValue;
      }
    }

    // Trim any trailing spaces
    value = value.trim();

    // Check if it's a keyword, function, unit, timezone, or variable
    const finalLowerValue = value.toLowerCase();

    // Check if it might be a timezone (contains UTC, GMT, or known timezone names)
    if (this.isTimezone(value)) {
      return { type: TokenType.TIMEZONE, value, position: start };
    }

    // Keywords
    if (
      [
        "in",
        "to",
        "as",
        "of",
        "what",
        "is",
        "prev",
        "total",
        "average",
        ...DATE_KEYWORDS,
        "from",
        "ago",
        "hence",
        "start",
        "end",
        "beginning",
      ].includes(finalLowerValue)
    ) {
      return {
        type: TokenType.KEYWORD,
        value: finalLowerValue,
        position: start,
      };
    }

    // Functions
    if (
      [
        "sqrt",
        "cbrt",
        "root",
        "abs",
        "log",
        "ln",
        "fact",
        "round",
        "ceil",
        "floor",
        "sin",
        "cos",
        "tan",
        "arcsin",
        "arccos",
        "arctan",
        "sinh",
        "cosh",
        "tanh",
        "sum",
        "average",
        "avg",
        "fromunix",
      ].includes(finalLowerValue)
    ) {
      return {
        type: TokenType.FUNCTION,
        value: finalLowerValue,
        position: start,
      };
    }

    // Units
    if (this.isUnit(value)) {
      return { type: TokenType.UNIT, value, position: start };
    }

    // Currency
    if (this.isCurrency(value)) {
      return {
        type: TokenType.CURRENCY,
        value: value.toUpperCase(),
        position: start,
      };
    }

    // Word operators
    if (
      [
        "plus",
        "minus",
        "times",
        "multiplied",
        "divided",
        "mod",
        "xor",
      ].includes(finalLowerValue)
    ) {
      return {
        type: TokenType.OPERATOR,
        value: this.wordToOperator(finalLowerValue),
        position: start,
      };
    }

    return { type: TokenType.VARIABLE, value, position: start };
  }

  private wordToOperator(word: string): string {
    const mapping: Record<string, string> = {
      plus: "+",
      minus: "-",
      times: "*",
      multiplied: "*",
      divided: "/",
      mod: "%",
      xor: "^",
    };
    return mapping[word] || word;
  }

  private isUnit(value: string): boolean {
    const units = [
      // Length
      "meter",
      "meters",
      "m",
      "centimeter",
      "centimeters",
      "cm",
      "millimeter",
      "millimeters",
      "mm",
      "kilometer",
      "kilometers",
      "km",
      "inch",
      "inches",
      "in",
      "foot",
      "feet",
      "ft",
      "yard",
      "yards",
      "yd",
      "mile",
      "miles",
      "mi",
      // Weight
      "gram",
      "grams",
      "g",
      "kilogram",
      "kilograms",
      "kg",
      "milligram",
      "milligrams",
      "mg",
      "pound",
      "pounds",
      "lb",
      "lbs",
      "ounce",
      "ounces",
      "oz",
      "stone",
      "stones",
      "st",
      // Temperature
      "celsius",
      "c",
      "fahrenheit",
      "f",
      "kelvin",
      "k",
      // Time
      "second",
      "seconds",
      "s",
      "sec",
      "minute",
      "minutes",
      "min",
      "m",
      "hour",
      "hours",
      "h",
      "hr",
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
      // Volume
      "liter",
      "liters",
      "l",
      "milliliter",
      "milliliters",
      "ml",
      "gallon",
      "gallons",
      "gal",
      "quart",
      "quarts",
      "qt",
      "pint",
      "pints",
      "pt",
      "cup",
      "cups",
      "tablespoon",
      "tablespoons",
      "tbsp",
      "teaspoon",
      "teaspoons",
      "tsp",
      // Area
      "hectare",
      "hectares",
      "ha",
      "acre",
      "acres",
      // Data
      "byte",
      "bytes",
      "b",
      "kilobyte",
      "kilobytes",
      "kb",
      "megabyte",
      "megabytes",
      "mb",
      "gigabyte",
      "gigabytes",
      "gb",
      "terabyte",
      "terabytes",
      "tb",
      "kibibyte",
      "kibibytes",
      "kib",
      "mebibyte",
      "mebibytes",
      "mib",
      "gibibyte",
      "gibibytes",
      "gib",
    ];

    return units.includes(value.toLowerCase());
  }

  private isCurrency(value: string): boolean {
    // Common currency codes - we'll validate against actual rates at evaluation time
    const commonCurrencies = [
      "usd",
      "eur",
      "gbp",
      "jpy",
      "cad",
      "aud",
      "chf",
      "cny",
      "inr",
      "krw",
      "sek",
      "nok",
      "dkk",
      "pln",
      "czk",
      "huf",
      "ron",
      "bgn",
      "hrk",
      "rub",
      "try",
      "brl",
      "mxn",
      "ars",
      "clp",
      "cop",
      "pen",
      "uyu",
      "zar",
      "thb",
      "sgd",
      "hkd",
      "twd",
      "php",
      "idr",
      "myr",
      "vnd",
      "nzd",
      "chf",
      "aed",
      "sar",
      "qar",
      "kwd",
      "bhd",
      "omr",
      "jod",
      "ils",
      "egp",
      "mad",
      "tnd",
      "lbp",
      "jmd",
      "bbd",
      "ttd",
      "xcd",
    ];
    return commonCurrencies.includes(value.toLowerCase());
  }

  private isTimezone(value: string): boolean {
    const lowerValue = value.toLowerCase();

    // Check for UTC offsets
    if (UTC_OFFSET_PATTERN.test(lowerValue)) {
      return true;
    }

    // Check for common timezone names
    const timezones = [
      "utc",
      "gmt",
      "est",
      "edt",
      "cst",
      "cdt",
      "mst",
      "mdt",
      "pst",
      "pdt",
      "moscow",
      "yerevan",
      "london",
      "paris",
      "berlin",
      "tokyo",
      "sydney",
      "new york",
      "newyork",
      "ny",
      "nyc",
      "la",
      "los angeles",
      "losangeles",
      "chicago",
      "denver",
      "dubai",
      "singapore",
      "hong kong",
      "hongkong",
      "shanghai",
      "beijing",
      "mumbai",
      "delhi",
      "bangalore",
      "kolkata",
      "bangkok",
      "seoul",
      "istanbul",
      "cairo",
      "lagos",
      "nairobi",
      "johannesburg",
      "cape town",
      "capetown",
      "sao paulo",
      "saopaulo",
      "buenos aires",
      "buenosaires",
      "mexico",
      "mexico city",
      "mexicocity",
      "toronto",
      "vancouver",
      "montreal",
      "bst",
      "cet",
      "cest",
      "jst",
      "ist",
      "aest",
      "aedt",
    ];

    return timezones.includes(lowerValue);
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
      if (
        DIGIT_PATTERN.test(this.current) ||
        (this.current === "." && DIGIT_PATTERN.test(this.peek()))
      ) {
        tokens.push(this.readNumber());
        continue;
      }

      // Identifiers (variables, functions, units, keywords)
      // Support Unicode letters including Cyrillic
      if (UNICODE_LETTER_PATTERN.test(this.current)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      // Operators and symbols
      switch (this.current) {
        case "+":
          tokens.push({
            type: TokenType.OPERATOR,
            value: "+",
            position: start,
          });
          this.advance();
          break;
        case "-":
          tokens.push({
            type: TokenType.OPERATOR,
            value: "-",
            position: start,
          });
          this.advance();
          break;
        case "*":
          tokens.push({
            type: TokenType.OPERATOR,
            value: "*",
            position: start,
          });
          this.advance();
          break;
        case "/":
          tokens.push({
            type: TokenType.OPERATOR,
            value: "/",
            position: start,
          });
          this.advance();
          break;
        case "^":
          tokens.push({
            type: TokenType.OPERATOR,
            value: "^",
            position: start,
          });
          this.advance();
          break;
        case "%":
          tokens.push({
            type: TokenType.OPERATOR,
            value: "%",
            position: start,
          });
          this.advance();
          break;
        case "(":
          tokens.push({ type: TokenType.LPAREN, value: "(", position: start });
          this.advance();
          break;
        case ")":
          tokens.push({ type: TokenType.RPAREN, value: ")", position: start });
          this.advance();
          break;
        case ",":
          tokens.push({ type: TokenType.COMMA, value: ",", position: start });
          this.advance();
          break;
        case "=":
          tokens.push({ type: TokenType.EQUALS, value: "=", position: start });
          this.advance();
          break;
        case "@":
          tokens.push({
            type: TokenType.AT_SYMBOL,
            value: "@",
            position: start,
          });
          this.advance();
          break;
        case "&":
          if (this.peek() === "&") {
            this.advance();
            this.advance();
            tokens.push({
              type: TokenType.OPERATOR,
              value: "&",
              position: start,
            });
          } else {
            tokens.push({
              type: TokenType.OPERATOR,
              value: "&",
              position: start,
            });
            this.advance();
          }
          break;
        case "|":
          if (this.peek() === "|") {
            this.advance();
            this.advance();
            tokens.push({
              type: TokenType.OPERATOR,
              value: "|",
              position: start,
            });
          } else {
            tokens.push({
              type: TokenType.OPERATOR,
              value: "|",
              position: start,
            });
            this.advance();
          }
          break;
        case "<":
          if (this.peek() === "<") {
            this.advance();
            this.advance();
            tokens.push({
              type: TokenType.OPERATOR,
              value: "<<",
              position: start,
            });
          } else {
            // Skip unknown character
            this.advance();
          }
          break;
        case ">":
          if (this.peek() === ">") {
            this.advance();
            this.advance();
            tokens.push({
              type: TokenType.OPERATOR,
              value: ">>",
              position: start,
            });
          } else {
            // Skip unknown character
            this.advance();
          }
          break;
        case "#":
          // Comment - skip the rest of the line
          while (this.position < this.input.length) {
            this.advance();
          }
          break;
        default:
          // Skip unknown characters
          this.advance();
      }
    }

    tokens.push({ type: TokenType.EOF, value: "", position: this.position });
    return tokens;
  }
}
