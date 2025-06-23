import { Text } from "ink";
import type React from "react";
import { Tokenizer } from "../parser/tokenizer";
import { TokenType } from "../types";

interface HighlightedTextProps {
  text: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text }) => {
  if (!text) return null;

  try {
    const tokenizer = new Tokenizer(text);
    const tokens = tokenizer.tokenize();

    let lastPosition = 0;
    const elements: React.ReactElement[] = [];

    tokens.forEach((token, _index) => {
      // Add any whitespace before the token
      if (token.position > lastPosition) {
        const whitespace = text.slice(lastPosition, token.position);
        const wsKey = `ws-${lastPosition}-${token.position}-${whitespace.length}`;
        elements.push(<Text key={wsKey}>{whitespace}</Text>);
      }

      // Skip EOF token
      if (token.type === TokenType.EOF) return;

      // Add the token with appropriate color
      const color = getTokenColor(token.type, token.value);
      const tokenKey = `token-${token.position}-${token.type}-${token.value}`;
      elements.push(
        <Text key={tokenKey} color={color}>
          {token.value}
        </Text>,
      );

      lastPosition = token.position + token.value.length;
    });

    // Add any remaining text
    if (lastPosition < text.length) {
      elements.push(<Text key="remaining">{text.slice(lastPosition)}</Text>);
    }

    return <>{elements}</>;
  } catch (_error) {
    // If tokenization fails, just return plain text
    return <Text>{text}</Text>;
  }
};

function getTokenColor(type: TokenType, value?: string): string {
  switch (type) {
    case TokenType.NUMBER:
      return "green";
    case TokenType.OPERATOR:
      return "blue";
    case TokenType.UNIT:
    case TokenType.CURRENCY:
      return "yellow";
    case TokenType.FUNCTION:
      return "magenta";
    case TokenType.VARIABLE:
      return "#d19a66"; // Orange
    case TokenType.KEYWORD:
      // Date keywords get special color
      if (
        value &&
        [
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
        ].includes(value)
      ) {
        return "cyan";
      }
      return "blue";
    default:
      return "white";
  }
}
