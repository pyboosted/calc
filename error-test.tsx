#!/usr/bin/env bun
/** @jsx React.createElement */
import React from 'react';
import { render, Box, Text } from 'ink';
import { evaluate } from './src/evaluator/evaluate';
import { InputWithResult } from './src/ui/InputWithResult';
import { CalculatedValue } from './src/types';

const ErrorDemo = () => {
  const examples = [
    // These will show errors when not active
    { input: 'undefined_var', active: false },
    { input: '2 + ', active: false },
    { input: 'sqrt(', active: false },
    
    // This is the active line - no error shown while typing
    { input: 'x + y', active: true },
    
    // Valid expressions
    { input: 'x = 10', active: false },
    { input: 'y = 20', active: false },
    { input: '2 + 2', active: false },
  ];

  const variables = new Map<string, CalculatedValue>([['prev', { value: 0 }]]);
  
  // Process each example
  const results = examples.map(example => {
    if (example.active) {
      // Active line - never show errors
      return { ...example, result: null, error: null };
    }
    
    try {
      const result = evaluate(example.input, variables);
      if (example.input.includes('=')) {
        variables.set(example.input.split('=')[0].trim(), result);
      }
      return { ...example, result, error: null };
    } catch (error) {
      return { 
        ...example,
        result: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">Error Handling Demo</Text>
        <Text> (Active line shows no errors while typing)</Text>
      </Box>
      
      <Box flexDirection="column">
        {results.map((item, index) => (
          <Box key={index}>
            {item.active && <Text color="yellow">→ </Text>}
            {!item.active && <Text>  </Text>}
            <InputWithResult
              value={item.input}
              result={item.result}
              error={item.error}
              isActive={item.active}
              cursorPosition={item.active ? item.input.length : undefined}
            />
          </Box>
        ))}
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>
          Notice: The active line (marked with →) shows no error even though variables x and y are undefined
        </Text>
      </Box>
    </Box>
  );
};

render(<ErrorDemo />);