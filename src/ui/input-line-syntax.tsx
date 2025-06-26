import { Tokenizer } from "../parser/tokenizer";
import { type Token, TokenType } from "../types";
import { getTokenColor } from "./token-colors";

export function getHighlightedParts(
  text: string
): Array<{ text: string; color?: string }> {
  if (!text) {
    return [];
  }

  // Check for comment
  const commentIndex = text.indexOf("#");
  if (commentIndex !== -1) {
    const parts: Array<{ text: string; color?: string }> = [];

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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This function handles complex syntax highlighting logic
function getHighlightedPartsWithoutComment(
  text: string
): Array<{ text: string; color?: string }> {
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
    for (const token of tokens) {
      if (token.type !== TokenType.EOF) {
        // Calculate the actual token length in the input
        let tokenLength = token.value.length;

        // For string tokens, add 2 for the quotes
        if (
          token.type === TokenType.STRING_LITERAL ||
          token.type === TokenType.SINGLE_QUOTE_STRING ||
          token.type === TokenType.DOUBLE_QUOTE_STRING
        ) {
          tokenLength += 2; // Add opening and closing quotes
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
    const parts: Array<{ text: string; color?: string }> = [];
    let currentColor: string | undefined;
    let currentText = "";

    for (let i = 0; i < text.length; i++) {
      const tokenInfo = tokenMap.get(i);
      let charColor: string | undefined;

      if (tokenInfo) {
        // Handle string literals with interpolations
        if (
          tokenInfo.token.type === TokenType.STRING_LITERAL &&
          tokenInfo.token.interpolations &&
          tokenInfo.token.interpolations.length > 0
        ) {
          // Flush any accumulated text before processing the interpolated string
          if (currentText) {
            parts.push({ text: currentText, color: currentColor });
            currentText = "";
            currentColor = undefined;
          }

          // This is the start of a string with interpolations
          // We need to pass the token value (with markers) wrapped in backticks
          const tokenValueWithBackticks = `\`${tokenInfo.token.value}\``;
          const stringParts = getInterpolatedStringParts(
            tokenValueWithBackticks,
            tokenInfo.token.interpolations,
            i
          );
          parts.push(...stringParts);
          i = tokenInfo.end - 1; // Skip to end of string
          continue;
        }
        charColor = getTokenColor(tokenInfo.token.type, tokenInfo.token.value);
      } else {
        // Check if we're inside a token
        for (const [start, info] of tokenMap) {
          if (i >= start && i < info.end) {
            charColor = getTokenColor(info.token.type, info.token.value);
            break;
          }
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

    return parts;
  } catch (_error) {
    // If tokenization fails, just return plain text
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
