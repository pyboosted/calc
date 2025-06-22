#!/usr/bin/env bun
import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';

const SpaceTest = () => {
  const [value, setValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev.slice(-4), msg]);
  };

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      process.exit();
    }
    
    if (key.leftArrow) {
      if (cursorPosition > 0) {
        setCursorPosition(cursorPosition - 1);
        addLog(`Left arrow: cursor ${cursorPosition} -> ${cursorPosition - 1}`);
      }
      return;
    }

    if (key.rightArrow) {
      if (cursorPosition < value.length) {
        setCursorPosition(cursorPosition + 1);
        addLog(`Right arrow: cursor ${cursorPosition} -> ${cursorPosition + 1}`);
      }
      return;
    }

    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        setValue(newValue);
        setCursorPosition(cursorPosition - 1);
        addLog(`Backspace: "${value}" -> "${newValue}"`);
      }
      return;
    }

    // Regular character input
    if (input && !key.ctrl && !key.meta) {
      const newValue = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
      const newCursor = cursorPosition + input.length;
      setValue(newValue);
      setCursorPosition(newCursor);
      addLog(`Input "${input}": "${value}" -> "${newValue}", cursor ${cursorPosition} -> ${newCursor}`);
    }
  });

  // Simple rendering without syntax highlighting
  const beforeCursor = value.slice(0, cursorPosition);
  const atCursor = value[cursorPosition] || ' ';
  const afterCursor = value.slice(cursorPosition + 1);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Space Character Test (ESC to exit)</Text>
      <Box marginTop={1}>
        <Text>
          {beforeCursor}
          <Text inverse>{atCursor}</Text>
          {afterCursor}
        </Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Debug Info:</Text>
        <Text dimColor>Value: "{value}" (length: {value.length})</Text>
        <Text dimColor>Cursor: {cursorPosition}</Text>
        <Text dimColor>Before: "{beforeCursor}" (length: {beforeCursor.length})</Text>
        <Text dimColor>At cursor: "{atCursor}"</Text>
        <Text dimColor>After: "{afterCursor}" (length: {afterCursor.length})</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Log:</Text>
        {log.map((line, i) => (
          <Text key={i} dimColor>{line}</Text>
        ))}
      </Box>
    </Box>
  );
};

render(<SpaceTest />);