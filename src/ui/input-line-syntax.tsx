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
    const tokenMap = new Map<number, { token: Token; end: number }>();
    for (const token of tokens) {
      if (token.type !== TokenType.EOF) {
        tokenMap.set(token.position, {
          token,
          end: token.position + token.value.length,
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
