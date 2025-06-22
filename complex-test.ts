import { evaluate } from './src/evaluator/evaluate';
import { CalculatedValue } from './src/types';
import { formatResultWithUnit } from './src/evaluator/unitFormatter';

const testCases = [
  // Complex unit conversion expressions
  '100 min * 20',
  '100 min * 20 in hours',
  '2000 minutes in hours',
  '3.5 hours in minutes',
  '125 minutes',
  '125 minutes in hours',
  '90 minutes',
  '150 minutes',
  '1.5 hours',
  '1.75 hours',
];

console.log('Complex Expression Test\n');

const variables = new Map<string, CalculatedValue>();
variables.set('prev', { value: 0 });

for (const testCase of testCases) {
  try {
    const result = evaluate(testCase, variables);
    const resultStr = formatResultWithUnit(result);
    console.log(`${testCase} = ${resultStr}`);
    variables.set('prev', result);
  } catch (error) {
    console.log(`${testCase} => ERROR: ${error.message}`);
  }
}