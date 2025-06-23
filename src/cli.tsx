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

async function main() {
  const args = process.argv.slice(2);

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

  // Now we can lazy load all heavy dependencies
  const chalk = (await import("chalk")).default;
  const { render } = await import("ink");
  const { evaluate } = await import("./evaluator/evaluate");
  const { formatResultWithUnit } = await import("./evaluator/unitFormatter");
  const { Calculator } = await import("./ui/Calculator");
  const { ConfigManager } = await import("./utils/configManager");
  const { CurrencyManager } = await import("./utils/currencyManager");

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

  // Check for file loading
  let fileContent: string | undefined;
  const fileArg = args.find((arg) => arg.startsWith("--file=") || arg === "-f");
  if (fileArg) {
    const filePath = fileArg === "-f" ? args[args.indexOf("-f") + 1] : fileArg.split("=")[1];
    if (!filePath) {
      console.error(chalk.red("Error: No file path provided"));
      process.exit(1);
    }
    try {
      fileContent = readFileSync(filePath, "utf-8");
    } catch (error) {
      console.error(chalk.red(`Error reading file: ${error}`));
      process.exit(1);
    }
  }

  // Non-interactive mode
  const input = fileContent || args.join(" ");
  if (input.trim()) {
    // Process file content line by line or single expression
    const lines = input.split("\n").filter((line) => line.trim());
    const variables = new Map();
    let hasError = false;

    for (const line of lines) {
      if (line.trim().startsWith("#")) continue; // Skip comments

      try {
        const result = evaluate(line.trim(), variables);
        console.log(chalk.green(formatResultWithUnit(result)));
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        hasError = true;
      }
    }
    
    if (hasError) {
      process.exit(1);
    }
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