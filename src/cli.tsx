#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { Calculator } from './ui/Calculator';
import { CurrencyManager } from './utils/currencyManager';
import { ConfigManager } from './utils/configManager';
import { evaluate } from './evaluator/evaluate';
import { formatResultWithUnit } from './evaluator/unitFormatter';
import { readFileSync, existsSync } from 'fs';

function showHelp() {
  console.log(`
Boosted Calculator - A powerful terminal calculator

USAGE:
  calc                        Start interactive calculator
  calc <expression>           Evaluate expression and exit
  calc --file=<path>          Load calculations from file
  calc -f <path>              Load calculations from file (alternative)
  calc --update               Update currency exchange rates
  calc --help                 Show this help message
  calc -h                     Show this help message (alternative)

EXAMPLES:
  calc "2 + 2"                Basic arithmetic
  calc "sqrt(16)"             Mathematical functions
  calc "100 USD in EUR"       Currency conversion
  calc "5 feet in meters"     Unit conversion
  calc "today + 5 days"       Date arithmetic
  calc "20% of 150"           Percentage calculations

INTERACTIVE MODE:
  When running without arguments, the calculator starts in interactive mode.

KEYBOARD SHORTCUTS:
  Ctrl+C, ESC                 Exit calculator
  Ctrl+L                      Clear all calculations
  Ctrl+E                      Open in external editor
  Ctrl+Y                      Copy result to clipboard
  Ctrl+U, Ctrl+Shift+Y        Copy full line to clipboard
  Up/Down arrows              Navigate history
  Enter                       New line
  # comment                   Add inline comments

FEATURES:
  - Basic arithmetic: +, -, *, /, ^, %
  - Functions: sqrt, sin, cos, log, round, etc.
  - Variables: x = 10, then use x
  - Previous result: use 'prev'
  - Aggregates: 'total' and 'average'
  - Unit conversions: length, weight, time, data, etc.
  - Live currency conversion (300+ currencies)
  - Date/time operations with timezone support
  - Comments with # symbol

For more information, visit: https://github.com/pyboosted/calc
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  // Handle --help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
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