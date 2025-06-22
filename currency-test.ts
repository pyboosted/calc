import { evaluate } from './src/evaluator/evaluate';
import { CalculatedValue } from './src/types';
import { formatResultWithUnit } from './src/evaluator/unitFormatter';
import { CurrencyManager } from './src/utils/currencyManager';

async function testCurrencies() {
  // Initialize currency manager
  const currencyManager = CurrencyManager.getInstance();
  await currencyManager.initialize();
  
  const testCases = [
    // Traditional currency conversions
    '100 USD in EUR',
    '50 EUR in GBP',
    '1000 JPY in USD',
    '100 GBP in CHF',
    
    // Cryptocurrency conversions (if available)
    '1 BTC in USD',
    '100 USD in ETH',
    
    // Complex calculations with currencies
    '(100 USD + 50 EUR) in GBP',
    '1000 USD * 1.05',  // 5% increase
  ];

  console.log('Currency Conversion Test\n');

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
}

testCurrencies().catch(console.error);