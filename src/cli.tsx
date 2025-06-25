import { existsSync, readFileSync } from "node:fs";
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

  // Check for -e flag for expression evaluation
  const expressionIndex = args.indexOf("-e");
  if (expressionIndex !== -1) {
    const expression = args[expressionIndex + 1];
    if (!expression) {
      console.error(chalk.red("Error: No expression provided after -e"));
      process.exit(1);
    }
    processNonInteractiveMode(expression, debugMode);
    return;
  }

  // Separate flags from non-flag arguments
  const flagArgs: string[] = [];
  const nonFlagArgs: string[] = [];

  for (const arg of args) {
    if (arg.startsWith("-")) {
      flagArgs.push(arg);
    } else {
      nonFlagArgs.push(arg);
    }
  }

  // Check if first non-flag argument is a file
  let filename: string | undefined;
  let fileContent: string | undefined;
  let isNewFile = false;

  if (nonFlagArgs.length > 0) {
    // Error if there are multiple positional arguments
    if (nonFlagArgs.length > 1) {
      console.error(
        chalk.red("Error: Too many arguments. Only one filename is allowed.")
      );
      console.error(chalk.gray("Usage: calc [filename]"));
      console.error(chalk.gray('       calc -e "expression"'));
      process.exit(1);
    }

    const potentialFile = nonFlagArgs[0];

    // Single argument - check if it's a file
    if (potentialFile && existsSync(potentialFile)) {
      // It's an existing file - load it
      filename = potentialFile;
      try {
        fileContent = readFileSync(potentialFile, "utf-8");
      } catch (error) {
        console.error(chalk.red(`Error reading file: ${error}`));
        process.exit(1);
      }
    } else if (potentialFile?.includes(".")) {
      // Looks like a filename but doesn't exist - create new file on save
      filename = potentialFile;
      fileContent = ""; // Start with empty content
      isNewFile = true;
      if (debugMode) {
        console.log(
          chalk.gray(`File "${potentialFile}" will be created on save`)
        );
      }
    } else {
      // Not a file, treat as expression for backwards compatibility
      const input = nonFlagArgs.join(" ");
      processNonInteractiveMode(input, debugMode);
      return;
    }
  }

  // If we loaded a file, use interactive mode with that content
  if (filename && fileContent !== undefined) {
    render(
      <Calculator
        debugMode={debugMode}
        filename={filename}
        initialContent={fileContent}
        isNewFile={isNewFile}
      />
    );
  } else {
    // Interactive mode with empty content
    render(<Calculator debugMode={debugMode} />);
  }
}

// Handle errors
main().catch((error) => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});
