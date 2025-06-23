import React from 'react';
import { Text, Box } from 'ink';
import { Tokenizer } from '../parser/tokenizer';
import { TokenType } from '../types';

interface InputLineProps {
  text: string;
  cursorPosition?: number;
  dimColor?: boolean;
}

export const InputLine: React.FC<InputLineProps> = ({ text, cursorPosition, dimColor }) => {
  // For empty input with cursor at position 0
  if (text === '' && cursorPosition === 0) {
    return <Text inverse> </Text>;
  }

  if (cursorPosition === undefined) {
    // No cursor on this line, just render highlighted text
    return dimColor ? <Text dimColor>{text}</Text> : <HighlightedText text={text} />;
  }

  // When we have a cursor position, we need to be careful about rendering
  // We'll render everything in a single Text component to avoid layout issues
  const parts: Array<{ text: string; inverse?: boolean; color?: string }> = [];
  
  // Build parts with syntax highlighting
  if (text === '') {
    parts.push({ text: ' ', inverse: true });
  } else {
    // Get highlighted parts for the entire text
    const highlightedParts = getHighlightedParts(text);
    
    // Now split these parts around the cursor
    let charIndex = 0;
    for (const part of highlightedParts) {
      const partEnd = charIndex + part.text.length;
      
      if (cursorPosition >= charIndex && cursorPosition < partEnd) {
        // Cursor is within this part, split it
        const relPos = cursorPosition - charIndex;
        if (relPos > 0) {
          parts.push({ text: part.text.slice(0, relPos), color: part.color });
        }
        parts.push({ text: part.text[relPos] || ' ', inverse: true });
        if (relPos < part.text.length - 1) {
          parts.push({ text: part.text.slice(relPos + 1), color: part.color });
        }
      } else if (cursorPosition === partEnd && partEnd === text.length) {
        // Cursor is at the end of text
        parts.push({ text: part.text, color: part.color });
        parts.push({ text: ' ', inverse: true });
      } else {
        // Cursor is not in this part
        parts.push({ text: part.text, color: part.color });
      }
      
      charIndex = partEnd;
    }
  }

  // Render all parts in a single Text component
  return (
    <Text dimColor={dimColor}>
      {parts.map((part, i) => (
        <Text 
          key={i} 
          color={dimColor ? undefined : (part.color === 'dim' ? undefined : part.color)} 
          dimColor={part.color === 'dim'}
          inverse={part.inverse}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
};

const HighlightedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const parts = getHighlightedParts(text);
  
  return (
    <Text>
      {parts.map((part, i) => (
        <Text 
          key={i} 
          color={part.color === 'dim' ? undefined : part.color}
          dimColor={part.color === 'dim'}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
};

function getHighlightedParts(text: string): Array<{ text: string; color?: string }> {
  if (!text) return [];

  // Check for comment
  const commentIndex = text.indexOf('#');
  if (commentIndex !== -1) {
    const parts: Array<{ text: string; color?: string }> = [];
    
    // Process the part before the comment
    if (commentIndex > 0) {
      const beforeComment = text.substring(0, commentIndex);
      parts.push(...getHighlightedPartsWithoutComment(beforeComment));
    }
    
    // Add the comment part in dim color
    parts.push({ text: text.substring(commentIndex), color: 'dim' });
    
    return parts;
  }

  return getHighlightedPartsWithoutComment(text);
}

function getHighlightedPartsWithoutComment(text: string): Array<{ text: string; color?: string }> {
  if (!text) return [];

  try {
    const tokenizer = new Tokenizer(text);
    const tokens = tokenizer.tokenize();
    
    // Create a map of positions to tokens
    const tokenMap = new Map<number, { token: any; end: number }>();
    tokens.forEach(token => {
      if (token.type !== TokenType.EOF) {
        tokenMap.set(token.position, { 
          token, 
          end: token.position + token.value.length 
        });
      }
    });
    
    // Build the parts preserving spaces
    const parts: Array<{ text: string; color?: string }> = [];
    let currentColor: string | undefined;
    let currentText = '';
    
    for (let i = 0; i < text.length; i++) {
      const tokenInfo = tokenMap.get(i);
      let charColor: string | undefined;
      
      if (tokenInfo) {
        charColor = getTokenColor(tokenInfo.token.type);
      } else {
        // Check if we're inside a token
        for (const [start, info] of tokenMap) {
          if (i >= start && i < info.end) {
            charColor = getTokenColor(info.token.type);
            break;
          }
        }
      }
      
      // If color changed, flush current text
      if (charColor !== currentColor && currentText) {
        parts.push({ text: currentText, color: currentColor });
        currentText = '';
      }
      
      currentColor = charColor;
      currentText += text[i];
    }
    
    // Flush any remaining text
    if (currentText) {
      parts.push({ text: currentText, color: currentColor });
    }
    
    return parts;
  } catch (error) {
    // If tokenization fails, just return plain text
    return [{ text }];
  }
}

function getTokenColor(type: TokenType): string {
  switch (type) {
    case TokenType.NUMBER:
      return 'green';
    case TokenType.OPERATOR:
      return 'blue';
    case TokenType.UNIT:
    case TokenType.CURRENCY:
      return 'yellow';
    case TokenType.FUNCTION:
      return 'magenta';
    case TokenType.VARIABLE:
      return '#d19a66';
    case TokenType.KEYWORD:
      return 'blue';
    default:
      return 'white';
  }
}