import { evaluate } from './src/evaluator/evaluate';
import { CalculatedValue } from './src/types';

const testCases = [
  // Unit preservation in calculations
  '10 meters + 5 meters',
  '100 cm + 1 meter',
  '5 feet * 2',
  '100 kg / 2',
  '32 fahrenheit + 10 fahrenheit',
  
  // Mixed calculations
  '(100 cm + 50 cm) in inches',
  '2 hours + 30 minutes',
  '1 gb - 500 mb',
];

console.log('Unit Preservation Test\n');

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