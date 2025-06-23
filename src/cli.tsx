#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { Calculator } from './ui/Calculator';
import { CurrencyManager } from './utils/currencyManager';
import { ConfigManager } from './utils/configManager';
import { evaluate } from './evaluator/evaluate';
import { formatResultWithUnit } from './evaluator/unitFormatter';
import { readFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Try multiple possible locations for package.json
let packageJson: { version: string } | undefined;
const possiblePaths = [
  join(__dirname, '..', '..', 'package.json'), // Development: src/cli.tsx -> calc/package.json
  join(__dirname, '..', 'package.json'),       // Installed: lib/src/cli.tsx -> lib/package.json
];

for (const path of possiblePaths) {
  if (existsSync(path)) {
    packageJson = JSON.parse(readFileSync(path, 'utf-8'));
    break;
  }
}

if (!packageJson) {
  console.error(chalk.red('Error: Could not find package.json'));
  process.exit(1);
}

function showHelp() {
  console.log(`
${chalk.bold.cyan('Boosted Calculator')} v${packageJson?.version || '-unknown'} - A powerful terminal calculator

${chalk.bold.yellow('USAGE:')}
  ${chalk.green('calc')}                        Start interactive calculator
  ${chalk.green('calc')} ${chalk.cyan('<expression>')}           Evaluate expression and exit
  ${chalk.green('calc')} ${chalk.cyan('--file=<path>')}          Load calculations from file
  ${chalk.green('calc')} ${chalk.cyan('-f <path>')}              Load calculations from file (alternative)
  ${chalk.green('calc')} ${chalk.cyan('--update')}               Update currency exchange rates
  ${chalk.green('calc')} ${chalk.cyan('--version')}              Show version number
  ${chalk.green('calc')} ${chalk.cyan('-v')}                     Show version number (alternative)
  ${chalk.green('calc')} ${chalk.cyan('--help')}                 Show this help message
  ${chalk.green('calc')} ${chalk.cyan('-h')}                     Show this help message (alternative)

${chalk.bold.yellow('EXAMPLES:')}
  ${chalk.green('calc')} ${chalk.cyan('"2 + 2"')}                Basic arithmetic
  ${chalk.green('calc')} ${chalk.cyan('"sqrt(16)"')}             Mathematical functions
  ${chalk.green('calc')} ${chalk.cyan('"100 USD in EUR"')}       Currency conversion
  ${chalk.green('calc')} ${chalk.cyan('"5 feet in meters"')}     Unit conversion
  ${chalk.green('calc')} ${chalk.cyan('"today + 5 days"')}       Date arithmetic
  ${chalk.green('calc')} ${chalk.cyan('"20% of 150"')}           Percentage calculations

${chalk.bold.yellow('INTERACTIVE MODE:')}
  When running without arguments, the calculator starts in interactive mode.

${chalk.bold.yellow('KEYBOARD SHORTCUTS:')}
  ${chalk.magenta('Ctrl+C, ESC')}                 Exit calculator
  ${chalk.magenta('Ctrl+L')}                      Clear all calculations
  ${chalk.magenta('Ctrl+E')}                      Open in external editor
  ${chalk.magenta('Ctrl+Y')}                      Copy result to clipboard
  ${chalk.magenta('Ctrl+U, Ctrl+Shift+Y')}        Copy full line to clipboard
  ${chalk.magenta('Up/Down arrows')}              Navigate history
  ${chalk.magenta('Enter')}                       New line

${chalk.bold.yellow('FEATURES:')}
  ${chalk.gray('•')} Basic arithmetic: ${chalk.cyan('+, -, *, /, ^, %')}
  ${chalk.gray('•')} Functions: ${chalk.cyan('sqrt, sin, cos, log, round, etc.')}
  ${chalk.gray('•')} Variables: ${chalk.cyan('x = 10')}, then use ${chalk.cyan('x')}
  ${chalk.gray('•')} Previous result: use ${chalk.cyan("'prev'")}
  ${chalk.gray('•')} Aggregates: ${chalk.cyan("'total'")} and ${chalk.cyan("'average'")}
  ${chalk.gray('•')} Unit conversions: ${chalk.cyan('length, weight, time, data, etc.')}
  ${chalk.gray('•')} Live currency conversion ${chalk.cyan('(300+ currencies)')}
  ${chalk.gray('•')} Date/time operations with timezone support
  ${chalk.gray('•')} Comments with ${chalk.cyan('#')} symbol

For more information, visit: ${chalk.blue.underline('https://github.com/pyboosted/calc')}
`);
}

async function main() {
  const args = process.argv.slice(2);

  // Handle --help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Handle --version flag
  if (args.includes('--version') || args.includes('-v')) {
    console.log(packageJson?.version || 'unknown');
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
        console.error(chalk.red(`Error reading file: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    } else {
      console.error(chalk.red(`File not found: ${filePath}`));
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
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
    process.exit(0);
  }

  // Interactive mode: start the calculator UI
  render(<Calculator initialContent={fileContent} />, { exitOnCtrlC: false });
}

main().catch(console.error);