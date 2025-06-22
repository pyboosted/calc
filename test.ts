import { evaluate } from './src/evaluator/evaluate';
import { CalculatedValue } from './src/types';

const testCases = [
  // Basic arithmetic
  '2 + 2',
  '10 - 5',
  '3 * 4',
  '20 / 4',
  '2 ^ 3',
  '10 % 3',
  
  // Functions
  'sqrt(16)',
  'sin(0)',
  'cos(0)',
  'abs(-5)',
  'round(3.14159)',
  'ceil(3.1)',
  'floor(3.9)',
  
  // Unit conversions
  '100 cm in meters',
  '32 fahrenheit in celsius',
  '1 hour in minutes',
  '1 gb in mb',
  
  // Variables
  'x = 10',
  'y = 20',
  'x + y',
  
  // Percentages
  '20% * 100',
  
  // Complex expressions
  '(2 + 3) * 4',
  'sqrt(16) + 2^3',
];

console.log('Boosted Calculator Test Suite\n');

const variables = new Map<string, CalculatedValue>();
variables.set('prev', { value: 0 });

for (const testCase of testCases) {
  try {
    const result = evaluate(testCase, variables);
    const resultStr = result.unit ? `${result.value} ${result.unit}` : `${result.value}`;
    console.log(`${testCase} = ${resultStr}`);
    variables.set('prev', result);
  } catch (error) {
    console.log(`${testCase} => ERROR: ${error.message}`);
  }
}