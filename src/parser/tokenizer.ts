import {
  dateKeywords,
  isFunction,
  isKeyword,
  isMathConstant,
  mathConstants,
} from "../data/keywords";
import {
  operatorMap,
  singleCharTokens,
  wordOperators,
} from "../data/operators";
import { isTimezone, multiWordTimezoneStarts } from "../data/timezones";
import { isUnit } from "../data/units";
import { type Token, TokenType } from "../types";
import { CurrencyManager } from "../utils/currency-manager";

// Regex patterns
const WHITESPACE_PATTERN = /\s/;
const DIGIT_PATTERN = /[0-9]/;
const UNICODE_LETTER_PATTERN = /\p{L}/u;
const UNICODE_LETTER_OR_DIGIT_PATTERN = /[\p{L}\p{N}_]/u;
const DATETIME_LOOKAHEAD_PATTERN = /^\d{1,2}[./]\d{1,2}[./]\d{4}[Tt]/;
const CURRENCY_CODE_PATTERN = /^[A-Za-z]{3}$/;
const HEX_DIGIT_PATTERN = /[0-9a-fA-F]/;
const BINARY_DIGIT_PATTERN = /[01]/;

// Re-export for backward compatibility
export const DATE_KEYWORDS = dateKeywords;
export const MATH_CONSTANTS = mathConstants;

export class Tokenizer {
  private input: string;
  private position = 0;
  private current = "";
  private lastToken: Token | null = null;
  private processedTokens: Token[] = [];

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

  private getProcessedTokensCount(): number {
    return this.processedTokens.length;
  }

  private getTokenAt(offset: number): Token | null {
    // offset is negative, so -1 means last token, -2 means second last, etc.
    const index = this.processedTokens.length + offset;
    return index >= 0 ? this.processedTokens[index] || null : null;
  }

  private skipWhitespace(): void {
    while (WHITESPACE_PATTERN.test(this.current)) {
      this.advance();
    }
  }

  private tryReadConcatenatedUnit(): Token[] | null {
    // Try to detect patterns like "1h30min" or "2kg300g"
    const start = this.position;
    const savedPosition = this.position;
    const savedCurrent = this.current;
    const tokens: Token[] = [];

    // Read first number
    let numberValue = "";
    while (DIGIT_PATTERN.test(this.current)) {
      numberValue += this.current;
      this.advance();
    }

    if (numberValue.length === 0) {
      return null;
    }

    // Check if followed by a unit
    let unitValue = "";
    while (UNICODE_LETTER_PATTERN.test(this.current)) {
      unitValue += this.current;
      this.advance();
    }

    if (!isUnit(unitValue)) {
      // Not a unit, restore position
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    // We have a number followed by a unit
    tokens.push({
      type: TokenType.NUMBER,
      value: numberValue,
      position: start,
    });
    tokens.push({
      type: TokenType.UNIT,
      value: unitValue,
      position: start + numberValue.length,
    });

    // Check if there's another number immediately following
    if (!DIGIT_PATTERN.test(this.current)) {
      // No more concatenated units
      this.position = savedPosition;
      this.current = savedCurrent;
      return null;
    }

    // Continue reading concatenated units
    while (DIGIT_PATTERN.test(this.current)) {
      const numStart = this.position;
      numberValue = "";

      while (DIGIT_PATTERN.test(this.current)) {
        numberValue += this.current;
        this.advance();
      }

      unitValue = "";
      while (UNICODE_LETTER_PATTERN.test(this.current)) {
        unitValue += this.current;
        this.advance();
      }

      if (!isUnit(unitValue)) {
        // Not a valid unit, this might be something else
        break;
      }

      tokens.push({
        type: TokenType.NUMBER,
        value: numberValue,
        position: numStart,
      });
      tokens.push({
        type: TokenType.UNIT,
        value: unitValue,
        position: numStart + numberValue.length,
      });
    }

    // Check if we successfully parsed concatenated units
    if (tokens.length >= 4) {
      // At least 2 number-unit pairs
      return tokens;
    }

    // Restore position if we didn't find valid concatenated units
    this.position = savedPosition;
    this.current = savedCurrent;
    return null;
  }

  private pushToken(tokens: Token[], token: Token): void {
    tokens.push(token);
    this.processedTokens.push(token);
    this.lastToken = token;
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

  private readHexLiteral(start: number): Token {
    let value = "0";
    this.advance(); // skip '0'
    value += this.current; // 'x' or 'X'
    this.advance();

    // Must have at least one hex digit
    if (!HEX_DIGIT_PATTERN.test(this.current)) {
      throw new Error("Invalid hex literal: expected hex digit after 0x");
    }

    while (HEX_DIGIT_PATTERN.test(this.current)) {
      value += this.current;
      this.advance();
    }

    // Keep the full hex string for display, but also provide decimal value
    return {
      type: TokenType.NUMBER,
      value, // Keep original format (e.g., "0xFF")
      position: start,
      format: "hex" as const,
    };
  }

  private readBinaryLiteral(start: number): Token {
    let value = "0";
    this.advance(); // skip '0'
    value += this.current; // 'b' or 'B'
    this.advance();

    // Must have at least one binary digit
    if (!BINARY_DIGIT_PATTERN.test(this.current)) {
      throw new Error("Invalid binary literal: expected 0 or 1 after 0b");
    }

    while (BINARY_DIGIT_PATTERN.test(this.current)) {
      value += this.current;
      this.advance();
    }

    // Keep the full binary string for display
    return {
      type: TokenType.NUMBER,
      value, // Keep original format (e.g., "0b1010")
      position: start,
      format: "binary" as const,
    };
  }

  private readNumber(): Token {
    const start = this.position;
    let value = "";

    // Check for hex literal (0x prefix)
    if (this.current === "0" && (this.peek() === "x" || this.peek() === "X")) {
      return this.readHexLiteral(start);
    }

    // Check for binary literal (0b prefix)
    if (this.current === "0" && (this.peek() === "b" || this.peek() === "B")) {
      return this.readBinaryLiteral(start);
    }

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

  private tryReadKeywordOrIdentifier(): Token {
    const start = this.position;
    let value = "";

    // First, read a normal identifier without spaces
    while (UNICODE_LETTER_OR_DIGIT_PATTERN.test(this.current)) {
      value += this.current;
      this.advance();
    }

    // Check for trailing ! (for mutation functions)
    if (this.current === "!" && value.length > 0) {
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
      if (isTimezone(fullValue)) {
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

    // Check if it's a keyword, function, constant, unit, timezone, or variable
    const finalLowerValue = value.toLowerCase();

    // Check for boolean literals
    if (finalLowerValue === "true") {
      return { type: TokenType.TRUE, value: finalLowerValue, position: start };
    }
    if (finalLowerValue === "false") {
      return { type: TokenType.FALSE, value: finalLowerValue, position: start };
    }

    // Check for null literal
    if (finalLowerValue === "null") {
      return { type: TokenType.NULL, value: finalLowerValue, position: start };
    }

    // Check for logical operators
    if (["and", "or", "not"].includes(finalLowerValue)) {
      return {
        type: TokenType[finalLowerValue.toUpperCase() as "AND" | "OR" | "NOT"],
        value: finalLowerValue,
        position: start,
      };
    }

    // Check if it might be a timezone (contains UTC, GMT, or known timezone names)
    if (isTimezone(value)) {
      return { type: TokenType.TIMEZONE, value, position: start };
    }

    // Check if this is a function
    if (isFunction(finalLowerValue)) {
      return {
        type: TokenType.FUNCTION,
        value: finalLowerValue,
        position: start,
      };
    }

    // Check if this is a keyword
    // Special case: "in" can be both a keyword and a unit (inches)
    // If it follows a number, it's likely the unit
    if (isKeyword(finalLowerValue)) {
      // Special handling for "in" which can be a unit
      if (
        finalLowerValue === "in" &&
        this.lastToken &&
        this.lastToken.type === TokenType.NUMBER
      ) {
        // In this context, "in" is likely the unit for inches
        return { type: TokenType.VARIABLE, value, position: start };
      }
      return {
        type: TokenType.KEYWORD,
        value: finalLowerValue,
        position: start,
      };
    }

    // Currency (keep this check before units since currencies are less likely to conflict with variables)
    if (this.isCurrency(value)) {
      return {
        type: TokenType.CURRENCY,
        value: value.toUpperCase(),
        position: start,
      };
    }

    // Don't automatically classify as unit - let context determine this

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

    // Mathematical constants (check last so variables can override)
    if (isMathConstant(finalLowerValue)) {
      return {
        type: TokenType.CONSTANT,
        value, // Keep original case
        position: start,
      };
    }

    return { type: TokenType.VARIABLE, value, position: start };
  }

  private wordToOperator(word: string): string {
    return wordOperators[word] || word;
  }

  private tryReadSingleQuoteString(): Token | null {
    if (this.current !== "'") {
      return null;
    }

    const start = this.position;
    let value = "";

    this.advance(); // Skip opening single quote

    while (this.position < this.input.length && this.current !== "'") {
      if (this.current === "\\" && this.peek() !== "") {
        // Handle escape sequences
        this.advance(); // Skip backslash
        value += this.current;
        this.advance();
      } else {
        value += this.current;
        this.advance();
      }
    }

    if (this.current !== "'") {
      throw new Error("Unterminated string literal");
    }

    this.advance(); // Skip closing single quote

    return {
      type: TokenType.SINGLE_QUOTE_STRING,
      value,
      position: start,
    };
  }

  private tryReadDoubleQuoteString(): Token | null {
    if (this.current !== '"') {
      return null;
    }

    const start = this.position;
    let value = "";

    this.advance(); // Skip opening double quote

    while (this.position < this.input.length && this.current !== '"') {
      if (this.current === "\\" && this.peek() !== "") {
        // Handle escape sequences
        this.advance(); // Skip backslash
        value += this.current;
        this.advance();
      } else {
        value += this.current;
        this.advance();
      }
    }

    if (this.current !== '"') {
      throw new Error("Unterminated string literal");
    }

    this.advance(); // Skip closing double quote

    return {
      type: TokenType.DOUBLE_QUOTE_STRING,
      value,
      position: start,
    };
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: it is complex cause it means to be
  private tryReadStringLiteral(): Token | null {
    if (this.current !== "`") {
      return null;
    }

    const start = this.position;
    let value = "";
    const interpolations: { position: number; expression: string }[] = [];

    this.advance(); // Skip opening backtick

    while (this.position < this.input.length && this.current !== "`") {
      if (this.current === "\\" && this.peek() !== "") {
        // Handle escape sequences
        this.advance(); // Skip backslash
        value += this.current;
        this.advance();
      } else if (this.current === "$" && this.peek() === "{") {
        // Handle interpolation
        const interpStart = value.length;
        this.advance(); // Skip $
        this.advance(); // Skip {

        let braceCount = 1;
        let expression = "";

        while (this.position < this.input.length && braceCount > 0) {
          if (this.current === "{") {
            braceCount++;
          } else if (this.current === "}") {
            braceCount--;
            if (braceCount === 0) {
              break;
            }
          }
          expression += this.current;
          this.advance();
        }

        if (braceCount !== 0) {
          throw new Error("Unterminated string interpolation");
        }

        this.advance(); // Skip closing }
        interpolations.push({ position: interpStart, expression });
        // Add a marker that will be replaced later
        value += `\x00INTERP${interpolations.length - 1}\x00`;
      } else {
        value += this.current;
        this.advance();
      }
    }

    if (this.current !== "`") {
      throw new Error("Unterminated string literal");
    }

    this.advance(); // Skip closing backtick

    return {
      type: TokenType.STRING_LITERAL,
      value,
      position: start,
      interpolations, // Store interpolations in token for parser
    } as Token & {
      interpolations?: { position: number; expression: string }[];
    };
  }

  private isCurrency(value: string): boolean {
    // Check if this value is a known unit first to avoid conflicts
    if (isUnit(value)) {
      return false;
    }

    try {
      // Check against actual available currencies from CurrencyManager
      const currencyManager = CurrencyManager.getInstance();
      const rate = currencyManager.getRate(value);

      // If we have rates loaded, use them
      if (currencyManager.getAvailableCurrencies().length > 0) {
        return rate !== undefined;
      }

      // If no rates are loaded (e.g., in tests), fall back to common currencies
      // This allows tests to pass without initializing CurrencyManager
      const commonCurrencies = [
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "CAD",
        "AUD",
        "CHF",
        "CNY",
        "INR",
        "KRW",
        "GEL",
        "BYR",
        "RUB",
        "BRL",
        "MXN",
        "ZAR",
        "SEK",
        "NOK",
        "DKK",
        "PLN",
      ];

      return commonCurrencies.includes(value.toUpperCase());
    } catch {
      // If CurrencyManager isn't available, accept 3-letter codes
      return value.length === 3 && CURRENCY_CODE_PATTERN.test(value);
    }
  }

  private shouldTokenizeAsUnit(token: Token): boolean {
    // Check if this identifier should be treated as a unit based on context
    if (token.type !== TokenType.VARIABLE || !isUnit(token.value)) {
      return false;
    }

    // Case 1: Unit follows a number (directly or with space)
    if (this.lastToken && this.lastToken.type === TokenType.NUMBER) {
      return true;
    }

    // Case 2: Unit follows a conversion keyword (in, to, as)
    if (
      this.lastToken &&
      this.lastToken.type === TokenType.KEYWORD &&
      ["in", "to", "as"].includes(this.lastToken.value)
    ) {
      return true;
    }

    // Case 3: Unit follows another unit (for compound units)
    if (this.lastToken && this.lastToken.type === TokenType.UNIT) {
      return true;
    }

    // Case 4: Unit follows a "/" or "*" operator (for compound units like kg/s or m*s)
    // But only in the context of unit expressions, not general arithmetic
    if (
      this.lastToken &&
      this.lastToken.type === TokenType.OPERATOR &&
      ["/", "*"].includes(this.lastToken.value)
    ) {
      // Check if we're in a unit context by looking back further
      // We need at least 2 tokens before: should be either NUMBER UNIT or just UNIT
      const tokensLength = this.getProcessedTokensCount();
      if (tokensLength >= 2) {
        const secondLastToken = this.getTokenAt(-2);
        // If the token before the operator is a UNIT, then this is likely a compound unit
        if (secondLastToken && secondLastToken.type === TokenType.UNIT) {
          return true;
        }
        // If we have NUMBER UNIT OPERATOR, this is also a compound unit
        if (tokensLength >= 3) {
          const thirdLastToken = this.getTokenAt(-3);
          if (
            thirdLastToken &&
            thirdLastToken.type === TokenType.NUMBER &&
            secondLastToken &&
            secondLastToken.type === TokenType.UNIT
          ) {
            return true;
          }
        }
      }
      return false;
    }

    return false;
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: tokenizer is alwayscomplex
  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.input.length) {
      this.skipWhitespace();

      if (this.position >= this.input.length) {
        break;
      }

      const start = this.position;

      // String literals with interpolation (backticks)
      if (this.current === "`") {
        const token = this.tryReadStringLiteral();
        if (token) {
          this.pushToken(tokens, token);
          continue;
        }
      }

      // Single quote strings (no interpolation)
      if (this.current === "'") {
        const token = this.tryReadSingleQuoteString();
        if (token) {
          this.pushToken(tokens, token);
          continue;
        }
      }

      // Double quote strings (no interpolation)
      if (this.current === '"') {
        const token = this.tryReadDoubleQuoteString();
        if (token) {
          this.pushToken(tokens, token);
          continue;
        }
      }

      // Try concatenated units first (like "1h30min")
      if (DIGIT_PATTERN.test(this.current)) {
        const concatenatedTokens = this.tryReadConcatenatedUnit();
        if (concatenatedTokens) {
          // Push all tokens from concatenated units
          for (const token of concatenatedTokens) {
            this.pushToken(tokens, token);
          }
          continue;
        }
      }

      // Numbers
      if (
        DIGIT_PATTERN.test(this.current) ||
        (this.current === "." && DIGIT_PATTERN.test(this.peek()))
      ) {
        const token = this.readNumber();
        this.pushToken(tokens, token);
        continue;
      }

      // Identifiers (variables, functions, units, keywords)
      // Support Unicode letters including Cyrillic
      if (UNICODE_LETTER_PATTERN.test(this.current)) {
        let token = this.tryReadKeywordOrIdentifier();

        // Check if this variable should be converted to a unit based on context
        if (this.shouldTokenizeAsUnit(token)) {
          token = { ...token, type: TokenType.UNIT };
        }

        this.pushToken(tokens, token);
        continue;
      }

      // Handle comments
      if (this.current === "#") {
        // Skip the rest of the line
        while (this.position < this.input.length) {
          this.advance();
        }
        continue;
      }

      // Check for compound assignment operators first (+=, -=)
      if (this.current === "+" && this.peek() === "=") {
        const token = {
          type: TokenType.PLUS_EQUALS,
          value: "+=",
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        this.advance();
        continue;
      }

      if (this.current === "-" && this.peek() === "=") {
        const token = {
          type: TokenType.MINUS_EQUALS,
          value: "-=",
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        this.advance();
        continue;
      }

      // Check for comparison operators first (==, !=, <=, >=)
      if (this.current === "=" && this.peek() === "=") {
        const token = { type: TokenType.EQUAL, value: "==", position: start };
        this.pushToken(tokens, token);
        this.advance();
        this.advance();
        continue;
      }

      if (this.current === "!" && this.peek() === "=") {
        const token = {
          type: TokenType.NOT_EQUAL,
          value: "!=",
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        this.advance();
        continue;
      }

      if (this.current === "<" && this.peek() === "=") {
        const token = {
          type: TokenType.LESS_EQUAL,
          value: "<=",
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        this.advance();
        continue;
      }

      if (this.current === ">" && this.peek() === "=") {
        const token = {
          type: TokenType.GREATER_EQUAL,
          value: ">=",
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        this.advance();
        continue;
      }

      // Check for arrow operator (=>)
      if (this.current === "=" && this.peek() === ">") {
        const token = {
          type: TokenType.ARROW,
          value: "=>",
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        this.advance();
        continue;
      }

      // Single character comparison operators
      if (this.current === "<") {
        const token = {
          type: TokenType.LESS_THAN,
          value: "<",
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        continue;
      }

      if (this.current === ">") {
        const token = {
          type: TokenType.GREATER_THAN,
          value: ">",
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        continue;
      }

      // Check for multi-character operators
      const twoChar = this.current + this.peek();
      const twoCharConfig = operatorMap[twoChar];
      if (twoCharConfig?.multiChar) {
        const token = {
          type: twoCharConfig.tokenType,
          value: twoCharConfig.value,
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        this.advance();
        continue;
      }

      // Check for single character operators with optional second char
      const singleCharConfig = operatorMap[this.current];
      if (singleCharConfig) {
        let token: Token;

        if (
          singleCharConfig.consumeNext &&
          this.peek() === singleCharConfig.consumeNext
        ) {
          // Consume both characters but use single char value
          this.advance();
          this.advance();
          token = {
            type: singleCharConfig.tokenType,
            value: singleCharConfig.value,
            position: start,
          };
        } else {
          // Single character operator
          this.advance();
          token = {
            type: singleCharConfig.tokenType,
            value: singleCharConfig.value,
            position: start,
          };
        }

        this.pushToken(tokens, token);
        continue;
      }

      // Check for question mark (ternary operator)
      if (this.current === "?") {
        const token = {
          type: TokenType.QUESTION,
          value: this.current,
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        continue;
      }

      // Check for colon (ternary operator)
      if (this.current === ":") {
        const token = {
          type: TokenType.COLON,
          value: this.current,
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        continue;
      }

      // Check for dot operator
      if (this.current === ".") {
        const token = {
          type: TokenType.DOT,
          value: this.current,
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        continue;
      }

      // Check for other single character tokens
      const singleTokenType = singleCharTokens[this.current];
      if (singleTokenType) {
        const token = {
          type: singleTokenType,
          value: this.current,
          position: start,
        };
        this.pushToken(tokens, token);
        this.advance();
        continue;
      }

      // Skip unknown characters
      this.advance();
    }

    tokens.push({ type: TokenType.EOF, value: "", position: this.position });
    return tokens;
  }
}
