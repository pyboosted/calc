import { Tokenizer } from "../parser/tokenizer";
import {
  type CalculatedValue,
  type MarkdownElement,
  type MarkdownNode,
  type Token,
  TokenType,
} from "../types";
import { debugLog } from "../utils/debug";
import { getFunctionDefinitionColor, getTokenColor } from "./token-colors";

export function getHighlightedParts(
  text: string,
  result?: CalculatedValue | null
): Array<{ text: string; color?: string; bold?: boolean; italic?: boolean }> {
  if (!text) {
    return [];
  }

  // Check if this is a markdown result
  if (result && result.type === "markdown") {
    if (text.includes("`")) {
      debugLog("MARKDOWN", "Processing as markdown", { text });
    }
    return getMarkdownHighlightedParts(result.value);
  }

  // Check for comment
  const commentIndex = text.indexOf("#");
  if (commentIndex !== -1) {
    const parts: Array<{
      text: string;
      color?: string;
      bold?: boolean;
      italic?: boolean;
    }> = [];

    // Process the part before the comment
    if (commentIndex > 0) {
      const beforeComment = text.substring(0, commentIndex);
      parts.push(...getHighlightedPartsWithoutComment(beforeComment));
    }

    // Add the comment part in dim color
    parts.push({ text: text.substring(commentIndex), color: "dim" });

    return parts;
  }

  return getHighlightedPartsWithoutComment(text);
}

function isFunctionDefinition(tokens: Token[], index: number): boolean {
  // Check if this variable token is part of a function definition pattern:
  // variable(params...) = expression
  if (index >= tokens.length || tokens[index]?.type !== TokenType.VARIABLE) {
    return false;
  }

  // Look for pattern: VARIABLE LPAREN ... RPAREN EQUALS
  let i = index + 1;

  // Must be followed by LPAREN
  if (i >= tokens.length || tokens[i]?.type !== TokenType.LPAREN) {
    return false;
  }
  i++;

  // Skip parameters and commas until we find RPAREN
  let parenDepth = 1;
  while (i < tokens.length && parenDepth > 0) {
    const token = tokens[i];
    if (!token) {
      break;
    }

    if (token.type === TokenType.LPAREN) {
      parenDepth++;
    } else if (token.type === TokenType.RPAREN) {
      parenDepth--;
    }
    i++;
  }

  // Check if we found matching RPAREN and it's followed by EQUALS
  return i < tokens.length && tokens[i]?.type === TokenType.EQUALS;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This function handles complex syntax highlighting logic
function getHighlightedPartsWithoutComment(
  text: string
): Array<{ text: string; color?: string; bold?: boolean; italic?: boolean }> {
  if (!text) {
    return [];
  }

  try {
    const tokenizer = new Tokenizer(text);
    const tokens = tokenizer.tokenize();

    // Create a map of positions to tokens
    const tokenMap = new Map<
      number,
      {
        token: Token & {
          interpolations?: Array<{ position: number; expression: string }>;
        };
        end: number;
      }
    >();

    // Create an array of tokens (excluding EOF) with their indices for function definition detection
    const tokenArray: Token[] = [];
    const tokenIndexMap = new Map<Token, number>();

    for (const token of tokens) {
      if (token && token.type !== TokenType.EOF) {
        tokenIndexMap.set(token, tokenArray.length);
        tokenArray.push(token);

        // Calculate the actual token length in the input
        let tokenLength: number;

        // For string tokens, we need to find the actual length in the input
        if (
          token.type === TokenType.STRING_LITERAL ||
          token.type === TokenType.SINGLE_QUOTE_STRING ||
          token.type === TokenType.DOUBLE_QUOTE_STRING
        ) {
          // Find the closing quote in the original text
          let quote: string;
          if (token.type === TokenType.STRING_LITERAL) {
            quote = "`";
          } else if (token.type === TokenType.SINGLE_QUOTE_STRING) {
            quote = "'";
          } else {
            quote = '"';
          }

          // Find the actual end of the string in the original text
          let searchPos = token.position + 1; // Start after opening quote
          let inEscape = false;

          while (searchPos < text.length) {
            if (inEscape) {
              inEscape = false;
              searchPos++;
              continue;
            }

            if (text[searchPos] === "\\") {
              inEscape = true;
              searchPos++;
              continue;
            }

            if (text[searchPos] === quote) {
              searchPos++; // Include the closing quote
              break;
            }

            searchPos++;
          }

          tokenLength = searchPos - token.position;
        } else {
          tokenLength = token.value.length;
        }

        tokenMap.set(token.position, {
          token: token as Token & {
            interpolations?: Array<{ position: number; expression: string }>;
          },
          end: token.position + tokenLength,
        });
      }
    }

    // Build the parts preserving spaces
    const parts: Array<{
      text: string;
      color?: string;
      bold?: boolean;
      italic?: boolean;
    }> = [];
    let currentColor: string | undefined;
    let currentText = "";

    for (let i = 0; i < text.length; i++) {
      const tokenInfo = tokenMap.get(i);
      let charColor: string | undefined;

      if (tokenInfo) {
        // Handle all string literals (with or without interpolations)
        if (
          tokenInfo.token.type === TokenType.STRING_LITERAL ||
          tokenInfo.token.type === TokenType.SINGLE_QUOTE_STRING ||
          tokenInfo.token.type === TokenType.DOUBLE_QUOTE_STRING
        ) {
          // Flush any accumulated text before processing the string
          if (currentText) {
            parts.push({ text: currentText, color: currentColor });
            currentText = "";
            currentColor = undefined;
          }

          // Handle string based on type
          if (
            tokenInfo.token.type === TokenType.STRING_LITERAL &&
            tokenInfo.token.interpolations &&
            tokenInfo.token.interpolations.length > 0
          ) {
            // String with interpolations
            const tokenValueWithBackticks = `\`${tokenInfo.token.value}\``;
            const stringParts = getInterpolatedStringParts(
              tokenValueWithBackticks,
              tokenInfo.token.interpolations,
              i
            );
            parts.push(...stringParts);
          } else {
            // Regular string without interpolations
            let quote: string;
            if (tokenInfo.token.type === TokenType.STRING_LITERAL) {
              quote = "`";
            } else if (tokenInfo.token.type === TokenType.SINGLE_QUOTE_STRING) {
              quote = "'";
            } else {
              quote = '"';
            }

            parts.push({ text: quote, color: "green" });
            parts.push({ text: tokenInfo.token.value, color: "green" });
            parts.push({ text: quote, color: "green" });
          }

          i = tokenInfo.end - 1; // Skip to end of string
          continue;
        }

        // Check if this is a function definition
        if (tokenInfo.token.type === TokenType.VARIABLE) {
          const tokenIndex = tokenIndexMap.get(tokenInfo.token);
          if (
            tokenIndex !== undefined &&
            isFunctionDefinition(tokenArray, tokenIndex)
          ) {
            charColor = getFunctionDefinitionColor();
          } else {
            charColor = getTokenColor(
              tokenInfo.token.type,
              tokenInfo.token.value
            );
          }
        } else {
          charColor = getTokenColor(
            tokenInfo.token.type,
            tokenInfo.token.value
          );
        }
      } else {
        // Check if we're inside a token
        let insideString = false;
        for (const [start, info] of tokenMap) {
          if (i >= start && i < info.end) {
            // Skip if we're inside a string token (already processed)
            if (
              info.token.type === TokenType.STRING_LITERAL ||
              info.token.type === TokenType.SINGLE_QUOTE_STRING ||
              info.token.type === TokenType.DOUBLE_QUOTE_STRING
            ) {
              insideString = true;
              break;
            }

            // Check if this is a function definition
            if (info.token.type === TokenType.VARIABLE) {
              const tokenIndex = tokenIndexMap.get(info.token);
              if (
                tokenIndex !== undefined &&
                isFunctionDefinition(tokenArray, tokenIndex)
              ) {
                charColor = getFunctionDefinitionColor();
              } else {
                charColor = getTokenColor(info.token.type, info.token.value);
              }
            } else {
              charColor = getTokenColor(info.token.type, info.token.value);
            }
            break;
          }
        }

        // Skip characters inside string tokens
        if (insideString) {
          continue;
        }
      }

      // If color changed, flush current text
      if (charColor !== currentColor && currentText) {
        parts.push({ text: currentText, color: currentColor });
        currentText = "";
      }

      currentColor = charColor;
      currentText += text[i];
    }

    // Flush any remaining text
    if (currentText) {
      parts.push({ text: currentText, color: currentColor });
    }

    // Debug output
    if (text.includes("`")) {
      debugLog(
        "HIGHLIGHT",
        "Output parts",
        parts.map((p) => ({ text: p.text, len: p.text.length }))
      );
    }

    return parts;
  } catch (error) {
    // Debug error
    if (text.includes("`")) {
      debugLog("HIGHLIGHT", "Error in tokenization", {
        error: error instanceof Error ? error.message : "Unknown error",
        text,
      });
    }

    // If tokenization fails due to unterminated string literal,
    // we need to handle backticks specially to avoid duplication
    if (
      error instanceof Error &&
      error.message === "Unterminated string literal"
    ) {
      // Return the text as-is without any special processing
      return [{ text }];
    }
    // For other errors, return plain text
    return [{ text }];
  }
}

function getInterpolatedStringParts(
  stringText: string,
  interpolations: Array<{ position: number; expression: string }>,
  _stringStartPos: number
): Array<{ text: string; color?: string }> {
  const parts: Array<{ text: string; color?: string }> = [];

  // Add opening backtick
  parts.push({ text: "`", color: "green" });

  // The stringText includes the backticks, but interpolation positions are relative to the content
  const content = stringText.substring(1, stringText.length - 1);

  // We need to reconstruct the original string by replacing markers with interpolations
  const result = content;
  const replacements: Array<{
    start: number;
    end: number;
    expression: string;
  }> = [];

  // Find all markers and their positions
  for (let i = 0; i < interpolations.length; i++) {
    const interpolation = interpolations[i];
    if (!interpolation) {
      continue;
    }

    const marker = `\x00INTERP${i}\x00`;
    const markerIndex = result.indexOf(marker);
    if (markerIndex !== -1) {
      replacements.push({
        start: markerIndex,
        end: markerIndex + marker.length,
        expression: interpolation.expression,
      });
    }
  }

  // Sort replacements by position (should already be sorted)
  replacements.sort((a, b) => a.start - b.start);

  // Build the parts
  let currentPos = 0;
  for (const replacement of replacements) {
    // Add text before the interpolation
    if (replacement.start > currentPos) {
      const beforeText = result.substring(currentPos, replacement.start);
      if (beforeText) {
        parts.push({ text: beforeText, color: "green" });
      }
    }

    // Add the interpolation
    parts.push({ text: "${", color: "yellow" });
    parts.push({ text: replacement.expression, color: "cyan" });
    parts.push({ text: "}", color: "yellow" });

    currentPos = replacement.end;
  }

  // Add any remaining text
  if (currentPos < result.length) {
    const remainingText = result.substring(currentPos);
    if (remainingText) {
      parts.push({ text: remainingText, color: "green" });
    }
  }

  // Add closing backtick
  parts.push({ text: "`", color: "green" });

  return parts;
}

function getMarkdownHighlightedParts(
  markdown: MarkdownNode
): Array<{ text: string; color?: string; bold?: boolean; italic?: boolean }> {
  const parts: Array<{
    text: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
  }> = [];

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Processing different markdown element types requires multiple branches
  function processElements(elements: MarkdownElement[]): void {
    for (const element of elements) {
      switch (element.type) {
        case "text":
          parts.push({ text: element.value });
          break;

        case "bold": {
          // Render bold with syntax markers
          parts.push({ text: element.marker, color: "gray" });
          const boldStart = parts.length;
          processElements(element.content);
          // Apply bold style to content
          for (let i = boldStart; i < parts.length; i++) {
            const part = parts[i];
            if (part) {
              // Mark as bold (we'll handle the actual bold rendering in the display component)
              part.bold = true;
            }
          }
          parts.push({ text: element.marker, color: "gray" });
          break;
        }

        case "italic": {
          // Render italic with syntax markers
          parts.push({ text: element.marker, color: "gray" });
          const italicStart = parts.length;
          processElements(element.content);
          // Apply italic style to content
          for (let i = italicStart; i < parts.length; i++) {
            const part = parts[i];
            if (part) {
              // Mark as italic (we'll handle the actual italic rendering in the display component)
              part.italic = true;
            }
          }
          parts.push({ text: element.marker, color: "gray" });
          break;
        }

        case "code":
          parts.push({ text: "`", color: "gray" });
          parts.push({ text: element.value, color: "cyan" });
          parts.push({ text: "`", color: "gray" });
          break;

        case "codeblock": {
          debugLog("MARKDOWN", "Rendering codeblock", element);
          // Opening backticks with optional language
          parts.push({ text: "```", color: "gray" });
          if (element.language) {
            parts.push({ text: element.language, color: "yellow" });
            // Add space after language (it gets consumed during parsing)
            parts.push({ text: " ", color: "cyan" });
          }
          // Code content (only add if not empty)
          if (element.value) {
            parts.push({ text: element.value, color: "cyan" });
          }
          // Only show closing backticks if the code block is complete
          if (!element.incomplete) {
            parts.push({ text: "```", color: "gray" });
          }
          break;
        }

        case "link":
          // Render the full markdown link syntax
          parts.push({ text: "[", color: "gray" });
          parts.push({ text: element.text, color: "blue" });
          parts.push({ text: "](", color: "gray" });
          parts.push({ text: element.url, color: "cyan" });
          parts.push({ text: ")", color: "gray" });
          break;

        case "strikethrough": {
          // Render strikethrough with syntax markers
          parts.push({ text: "~~", color: "gray" });
          const strikeStart = parts.length;
          processElements(element.content);
          // Apply strikethrough style to content
          for (let i = strikeStart; i < parts.length; i++) {
            const part = parts[i];
            if (part && !part.color) {
              part.color = "dim";
            }
          }
          parts.push({ text: "~~", color: "gray" });
          break;
        }

        default: {
          // Exhaustive check
          const _exhaustiveCheck: never = element;
          _exhaustiveCheck;
        }
      }
    }
  }

  processElements(markdown.elements);
  return parts;
}
