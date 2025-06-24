import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { showHelp } from "./help";

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Try multiple possible locations for package.json
let packageJson: { version: string } | undefined;
const possiblePaths = [
  join(__dirname, "..", "..", "package.json"), // Development: src/cli.tsx -> calc/package.json
  join(__dirname, "..", "package.json"), // Installed: dist/cli.js -> calc/package.json
];

for (const path of possiblePaths) {
  if (existsSync(path)) {
    try {
      packageJson = JSON.parse(readFileSync(path, "utf-8"));
      break;
    } catch (_e) {
      // Continue to next path
    }
  }
}

function handleEarlyFlags(args: string[]) {
  // Handle --help flag FIRST (before any heavy imports)
  if (args.includes("--help") || args.includes("-h")) {
    showHelp(packageJson?.version);
    process.exit(0);
  }

  // Handle --version flag FIRST (before any heavy imports)
  if (args.includes("--version") || args.includes("-v")) {
    console.log(packageJson?.version || "unknown");
    process.exit(0);
  }
}

async function loadDependencies() {
  const chalk = (await import("chalk")).default;
  const { render } = await import("ink");
  const { evaluate } = await import("./evaluator/evaluate");
  const { formatResultWithUnit } = await import("./evaluator/unit-formatter");
  const { Calculator } = await import("./ui/calculator");
  const { ConfigManager } = await import("./utils/config-manager");
  const { CurrencyManager } = await import("./utils/currency-manager");

  return {
    chalk,
    render,
    evaluate,
    formatResultWithUnit,
    Calculator,
    ConfigManager,
    CurrencyManager,
  };
}

async function initializeManagers(
  ConfigManager: typeof import("./utils/config-manager").ConfigManager,
  CurrencyManager: typeof import("./utils/currency-manager").CurrencyManager,
  args: string[]
) {
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

function loadFileContent(
  args: string[],
  chalk: typeof import("chalk").default
): string | undefined {
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

function processNonInteractiveMode(
  input: string,
  evaluate: typeof import("./evaluator/evaluate").evaluate,
  formatResultWithUnit: typeof import("./evaluator/unit-formatter").formatResultWithUnit,
  chalk: typeof import("chalk").default
) {
  const lines = input.split("\n").filter((line) => line.trim());
  const variables = new Map();
  const previousResults: import("./types").CalculatedValue[] = [];
  let hasError = false;

  for (const line of lines) {
    if (line.trim().startsWith("#")) {
      continue; // Skip comments
    }

    try {
      const result = evaluate(line.trim(), variables, { previousResults });
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

  // Load dependencies
  const {
    chalk,
    render,
    evaluate,
    formatResultWithUnit,
    Calculator,
    ConfigManager,
    CurrencyManager,
  } = await loadDependencies();

  // Initialize managers
  await initializeManagers(ConfigManager, CurrencyManager, args);

  // Load file content if specified
  const fileContent = loadFileContent(args, chalk);

  // Determine mode and execute
  const input = fileContent || args.join(" ");
  if (input.trim()) {
    // Non-interactive mode
    processNonInteractiveMode(input, evaluate, formatResultWithUnit, chalk);
  } else {
    // Interactive mode
    render(<Calculator initialContent={input} />);
  }
}

// Handle errors
main().catch((error) => {
  // Only load chalk if we need to show an error
  import("chalk").then(({ default: chalk }) => {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  });
});
