#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { Calculator } from './ui/Calculator';
import { CurrencyManager } from './utils/currencyManager';
import { ConfigManager } from './utils/configManager';
import { evaluate } from './evaluator/evaluate';
import { formatResultWithUnit } from './evaluator/unitFormatter';

async function main() {
  const args = process.argv.slice(2);
  
  // Initialize config manager
  const configManager = ConfigManager.getInstance();
  await configManager.initialize();
  
  // Initialize currency manager
  const currencyManager = CurrencyManager.getInstance();
  
  // Handle --update flag
  if (args.includes('--update')) {
    await currencyManager.updateCurrencyData();
    process.exit(0);
  }
  
  // Initialize currency data
  await currencyManager.initialize();
  
  // Check if expression provided as argument
  const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));
  if (nonFlagArgs.length > 0) {
    // Non-interactive mode: evaluate expression and print result
    const expression = nonFlagArgs.join(' ');
    try {
      const result = evaluate(expression, new Map());
      console.log(formatResultWithUnit(result));
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    process.exit(0);
  }
  
  // Interactive mode: start the calculator UI
  render(<Calculator />, { exitOnCtrlC: false });
}

main().catch(console.error);