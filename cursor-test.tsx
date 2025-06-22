#!/usr/bin/env bun
import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { SimpleInput } from './src/ui/SimpleInput';

const CursorTest = () => {
  const [value, setValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      process.exit();
    }
    
    if (key.leftArrow) {
      if (cursorPosition > 0) {
        setCursorPosition(cursorPosition - 1);
      }
      return;
    }

    if (key.rightArrow) {
      if (cursorPosition < value.length) {
        setCursorPosition(cursorPosition + 1);
      }
      return;
    }

    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        setValue(newValue);
        setCursorPosition(cursorPosition - 1);
      }
      return;
    }

    // Regular character input
    if (input && !key.ctrl && !key.meta) {
      const newValue = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
      setValue(newValue);
      setCursorPosition(cursorPosition + input.length);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Cursor Test (ESC to exit)</Text>
      <Text dimColor>Type to see cursor behavior</Text>
      <Box marginTop={1}>
        <SimpleInput value={value} cursorPosition={cursorPosition} />
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Value: "{value}" | Cursor: {cursorPosition}
        </Text>
      </Box>
    </Box>
  );
};

render(<CursorTest />);