#!/usr/bin/env bun
/** @jsx React.createElement */
import React from 'react';
import { render, Box, Text } from 'ink';
import { evaluate } from './src/evaluator/evaluate';
import { InputWithResult } from './src/ui/InputWithResult';
import { CalculatedValue } from './src/types';

const Demo = () => {
  const examples = [
    '2 + 2',
    'sqrt(16)',
    '100 cm in meters',
    '32 fahrenheit in celsius',
    'x = 10',
    'y = 20',
    'x + y',
    'sqrt(x^2 + y^2)',
    '20% * 100',
    '5 feet * 2',
    '1 hour + 30 minutes',
    '100 min * 20 in hours',
    '125 minutes',
  ];

  const variables = new Map<string, CalculatedValue>([['prev', { value: 0 }]]);
  const results: Array<{ input: string; result: CalculatedValue | null; error: string | null }> = [];

  for (const example of examples) {
    try {
      const result = evaluate(example, variables);
      results.push({ input: example, result, error: null });
      variables.set('prev', result);
    } catch (error) {
      results.push({ 
        input: example, 
        result: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">Boosted Calculator Demo</Text>
      </Box>
      
      <Box flexDirection="column">
        {results.map((item, index) => (
          <InputWithResult
            key={index}
            value={item.input}
            result={item.result}
            error={item.error}
            isActive={false}
          />
        ))}
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>
          Run 'bun start' for interactive mode
        </Text>
      </Box>
    </Box>
  );
};

render(<Demo />);