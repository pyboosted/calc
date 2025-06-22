import React from 'react';
import { Box, Text } from 'ink';

interface SimpleInputProps {
  value: string;
  cursorPosition: number;
}

export const SimpleInput: React.FC<SimpleInputProps> = ({ value, cursorPosition }) => {
  // For empty input, show just cursor
  if (value === '') {
    return (
      <Box>
        <Text inverse> </Text>
      </Box>
    );
  }

  // Split text around cursor
  const beforeCursor = value.slice(0, cursorPosition);
  const atCursor = value[cursorPosition] || ' ';
  const afterCursor = value.slice(cursorPosition + 1);

  return (
    <Box>
      <Text>{beforeCursor}</Text>
      <Text inverse>{atCursor}</Text>
      <Text>{afterCursor}</Text>
    </Box>
  );
};