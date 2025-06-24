import { readFileSync } from "node:fs";
import chalk from "chalk";
import { render } from "ink";
import { evaluate } from "./evaluator/evaluate";
import { formatResultWithUnit } from "./evaluator/unit-formatter";
import { showHelp } from "./help";
import { Calculator } from "./ui/calculator";
import { ConfigManager } from "./utils/config-manager";
import { CurrencyManager } from "./utils/currency-manager";
import { setDebugMode } from "./utils/debug";
import { getVersion } from "./utils/version";

function handleEarlyFlags(args: string[]) {
  // Handle --help flag FIRST (before any heavy imports)
  if (args.includes("--help") || args.includes("-h")) {
    showHelp(getVersion());
    process.exit(0);
  }

  // Handle --version flag FIRST (before any heavy imports)
  if (args.includes("--version") || args.includes("-v")) {
    console.log(getVersion());
    process.exit(0);
  }
}

function isDebugMode(args: string[]): boolean {
  return args.includes("--debug");
}

async function initializeManagers(args: string[]) {
  // Initialize config manager
  const configManager = ConfigManager.getInstance();
  await configManager.initialize();

  // Initialize currency manager
  const currencyManager = CurrencyManager.getInstance();

  // Handle --update flag
  if (args.includes("--update")) {
    await currencyManager.updateCurrencyData();
    process.exit(0);
  }

  // Initialize currency data
  await currencyManager.initialize();
}

function loadFileContent(args: string[]): string | undefined {
  const fileArg = args.find((arg) => arg.startsWith("--file=") || arg === "-f");
  if (!fileArg) {
    return;
  }

  const filePath =
    fileArg === "-f" ? args[args.indexOf("-f") + 1] : fileArg.split("=")[1];
  if (!filePath) {
    console.error(chalk.red("Error: No file path provided"));
    process.exit(1);
  }

  try {
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(chalk.red(`Error reading file: ${error}`));
    process.exit(1);
  }
}

function processNonInteractiveMode(input: string, debugMode: boolean) {
  // Set debug mode for non-interactive execution
  setDebugMode(debugMode);

  const lines = input.split("\n").filter((line) => line.trim());
  const variables = new Map();
  const previousResults: import("./types").CalculatedValue[] = [];
  let hasError = false;

  for (const line of lines) {
    if (line.trim().startsWith("#")) {
      continue; // Skip comments
    }

    try {
      const result = evaluate(line.trim(), variables, {
        previousResults,
        debugMode,
      });
      console.log(chalk.green(formatResultWithUnit(result)));

      // Add result to previousResults for aggregate operations
      previousResults.push(result);

      // Also update 'prev' variable with the latest result
      variables.set("prev", result.value);
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      hasError = true;
    }
  }

  if (hasError) {
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Handle early flags before loading dependencies
  handleEarlyFlags(args);

  // Check debug mode
  const debugMode = isDebugMode(args);

  // Initialize managers
  await initializeManagers(args);

  // Load file content if specified
  const fileContent = loadFileContent(args);

  // Filter out --debug from args for input processing
  const inputArgs = args.filter((arg) => arg !== "--debug");

  // Determine mode and execute
  const input = fileContent || inputArgs.join(" ");
  if (input.trim()) {
    // Non-interactive mode
    processNonInteractiveMode(input, debugMode);
  } else {
    // Interactive mode
    render(<Calculator debugMode={debugMode} initialContent={input} />);
  }
}

// Handle errors
main().catch((error) => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});
