#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { Calculator } from './ui/Calculator';
import { CurrencyManager } from './utils/currencyManager';
import { ConfigManager } from './utils/configManager';
import { evaluate } from './evaluator/evaluate';
import { formatResultWithUnit } from './evaluator/unitFormatter';
import { readFileSync, existsSync } from 'fs';

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
  
  // Check for file loading
  let fileContent: string | undefined;
  const fileArg = args.find(arg => arg.startsWith('--file=') || arg === '-f');
  if (fileArg) {
    const filePath = fileArg === '-f' 
      ? args[args.indexOf('-f') + 1]
      : fileArg.split('=')[1];
      
    if (filePath && existsSync(filePath)) {
      try {
        fileContent = readFileSync(filePath, 'utf-8');
      } catch (error) {
        console.error(`Error reading file: ${error.message}`);
        process.exit(1);
      }
    } else {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
  }
  
  // Check if expression provided as argument (non-file arguments)
  const nonFlagArgs = args.filter(arg => !arg.startsWith('--') && arg !== '-f' && args[args.indexOf(arg) - 1] !== '-f');
  if (nonFlagArgs.length > 0 && !fileContent) {
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
  render(<Calculator initialContent={fileContent} />, { exitOnCtrlC: false });
}

main().catch(console.error);