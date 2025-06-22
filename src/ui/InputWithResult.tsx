import React from 'react';
import { Box, Text, useInput, measureElement } from 'ink';
import { InputLine } from './InputLine';
import { formatResultWithUnit } from '../evaluator/unitFormatter';
import type { CalculatedValue } from '../types';

interface InputWithResultProps {
  value: string;
  cursorPosition?: number;
  result: CalculatedValue | null;
  error: string | null;
  isComment?: boolean;
  onChange?: (value: string, cursorPosition: number) => void;
  onNewLine?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onBackspaceOnEmptyLine?: () => void;
  isActive: boolean;
}

export const InputWithResult: React.FC<InputWithResultProps> = ({
  value,
  cursorPosition,
  result,
  error,
  isComment,
  onChange,
  onNewLine,
  onArrowUp,
  onArrowDown,
  onBackspaceOnEmptyLine,
  isActive
}) => {
  useInput((input, key) => {
    
    if (!isActive || !onChange) return;

    if (key.return) {
      onNewLine?.();
      return;
    }

    if (key.upArrow) {
      onArrowUp?.();
      return;
    }

    if (key.downArrow) {
      onArrowDown?.();
      return;
    }

    if (key.leftArrow) {
      if (cursorPosition !== undefined && cursorPosition > 0) {
        onChange(value, cursorPosition - 1);
      }
      return;
    }

    if (key.rightArrow) {
      if (cursorPosition !== undefined && cursorPosition < value.length) {
        onChange(value, cursorPosition + 1);
      }
      return;
    }

    if (key.backspace || key.delete) {
      if (cursorPosition === 0 && value === '') {
        // Backspace on empty line
        onBackspaceOnEmptyLine?.();
      } else if (cursorPosition !== undefined && cursorPosition > 0) {
        const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        onChange(newValue, cursorPosition - 1);
      }
      return;
    }

    // Regular character input
    if (input && !key.ctrl && !key.meta && cursorPosition !== undefined) {
      const newValue = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
      onChange(newValue, cursorPosition + input.length);
    }
  }, { isActive });

  // Format result
  const resultText = error 
    ? `Error: ${error}`
    : result 
    ? formatResultWithUnit(result)
    : '';

  return (
    <Box width="100%" justifyContent="space-between">
      <Box flexGrow={1}>
        {value === '' && !isActive ? (
          // Render empty lines with a space to ensure they take up height
          <Text> </Text>
        ) : isComment && !isActive ? (
          <Text dimColor>{value}</Text>
        ) : (
          <InputLine 
            text={value} 
            cursorPosition={isActive ? cursorPosition : undefined} 
            dimColor={isComment}
          />
        )}
      </Box>
      {resultText && !isComment && (
        <Box marginLeft={2}>
          <Text color={error ? 'red' : 'green'} bold={!error}>
            = {resultText}
          </Text>
        </Box>
      )}
    </Box>
  );
};