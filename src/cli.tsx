#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { Calculator } from './ui/Calculator';
import { CurrencyManager } from './utils/currencyManager';
import { ConfigManager } from './utils/configManager';

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
  
  // Start the calculator with exit on Ctrl+C disabled (we handle it ourselves)
  render(<Calculator />, { exitOnCtrlC: false });
}

main().catch(console.error);