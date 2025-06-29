import { existsSync, readFileSync } from "node:fs";
import chalk from "chalk";
import { render } from "ink";
import { evaluate } from "./evaluator/evaluate";
import { formatResultWithUnit } from "./evaluator/unit-formatter";
import { showHelp } from "./help";
import { MarkdownParser } from "./parser/markdown-parser";
import type { CalculatedValue } from "./types";
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

function getMarkdownMode(args: string[], config: ConfigManager): boolean {
  // Check for explicit disable flags
  if (args.includes("--md=false") || args.includes("--markdown=false")) {
    return false;
  }

  // Check for explicit enable flags
  if (
    args.includes("-m") ||
    args.includes("--markdown") ||
    args.includes("--md")
  ) {
    return true;
  }

  // Otherwise use config value (defaults to true)
  return config.markdownSupport;
}

function parseExpressions(args: string[]): string[] {
  const expressions: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-e") {
      const expression = args[i + 1];
      if (!expression) {
        console.error(chalk.red("Error: No expression provided after -e"));
        process.exit(1);
      }
      expressions.push(expression);
      i++; // Skip the expression argument
    }
  }
  return expressions;
}

function separateArgs(args: string[]): {
  flagArgs: string[];
  nonFlagArgs: string[];
} {
  const flagArgs: string[] = [];
  const nonFlagArgs: string[] = [];

  // Skip args that are values for flags
  const skipNext = new Set<number>();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--arg" && args[i + 1]) {
      skipNext.add(i + 1);
    }
  }

  for (let i = 0; i < args.length; i++) {
    if (skipNext.has(i)) {
      continue; // Skip argument values
    }

    const arg = args[i];
    if (arg?.startsWith("-")) {
      flagArgs.push(arg);
    } else if (arg) {
      nonFlagArgs.push(arg);
    }
  }

  return { flagArgs, nonFlagArgs };
}

interface FileResult {
  processed: boolean;
  filename?: string;
  fileContent?: string;
  isNewFile?: boolean;
}

function handleFileOrExpression(
  nonFlagArgs: string[],
  debugMode: boolean,
  markdownMode: boolean,
  _outputMode: boolean,
  stdinData: string | undefined,
  cliArg: string | undefined
): FileResult {
  if (nonFlagArgs.length === 0) {
    return { processed: false };
  }

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
    try {
      const fileContent = readFileSync(potentialFile, "utf-8");
      return {
        processed: false,
        filename: potentialFile,
        fileContent,
        isNewFile: false,
      };
    } catch (error) {
      console.error(chalk.red(`Error reading file: ${error}`));
      process.exit(1);
    }
  } else if (potentialFile?.includes(".")) {
    // Looks like a filename but doesn't exist - create new file on save
    if (debugMode) {
      console.log(
        chalk.gray(`File "${potentialFile}" will be created on save`)
      );
    }
    return {
      processed: false,
      filename: potentialFile,
      fileContent: "",
      isNewFile: true,
    };
  } else {
    // Not a file, treat as expression for backwards compatibility
    const input = nonFlagArgs.join(" ");
    processNonInteractiveMode(input, {
      debugMode,
      markdownMode,
      outputMode: false, // Backwards compatibility mode doesn't use -o
      stdinData,
      cliArg,
    });
    return { processed: true };
  }
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

function readStdin(): Promise<string | undefined> {
  // When stdin is piped, isTTY is false or undefined (depending on environment)
  // When interactive, isTTY is true
  if (process.stdin.isTTY === true) {
    // Definitely interactive, no piped data
    return Promise.resolve(undefined);
  }

  // Either piped or uncertain, try to read with timeout
  return new Promise<string | undefined>((resolve) => {
    let data = "";

    // Set a short timeout (50ms should be enough for piped data)
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(data.length > 0 ? data : undefined);
    }, 50);

    const cleanup = () => {
      clearTimeout(timeoutId);
      process.stdin.pause();
      process.stdin.removeAllListeners("data");
      process.stdin.removeAllListeners("end");
      process.stdin.removeAllListeners("error");
    };

    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk) => {
      data += chunk;
    });

    process.stdin.on("end", () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(data.length > 0 ? data : undefined);
    });

    process.stdin.on("error", () => {
      cleanup();
      resolve(undefined);
    });

    // Start reading
    process.stdin.resume();
  });
}

interface ProcessOptions {
  debugMode: boolean;
  markdownMode: boolean;
  outputMode: boolean;
  stdinData?: string;
  cliArg?: string;
}

function handleMarkdownFallback(
  line: string,
  _error: Error,
  options: ProcessOptions,
  onSuccess: (result: CalculatedValue) => void
): boolean {
  if (!options.markdownMode) {
    return false;
  }

  try {
    // Parse as markdown if evaluation fails
    const markdownParser = new MarkdownParser(line);
    const markdownAst = markdownParser.parse();
    const markdownResult: CalculatedValue = {
      type: "markdown",
      value: markdownAst,
    };

    // Call success callback
    onSuccess(markdownResult);

    // Only output if not in output mode
    if (!options.outputMode) {
      // For markdown, just show the original text
      console.log(line);
    }

    return true;
  } catch (_mdError) {
    // Markdown parsing failed, return false to indicate error should be shown
    return false;
  }
}

function processNonInteractiveMode(input: string, options: ProcessOptions) {
  // Set debug mode for non-interactive execution
  setDebugMode(options.debugMode);

  const lines = input.split("\n").filter((line) => line.trim());
  const variables = new Map<string, CalculatedValue>();
  const previousResults: CalculatedValue[] = [];
  let hasError = false;
  let lastResult: CalculatedValue | undefined;

  for (const line of lines) {
    if (line.trim().startsWith("#")) {
      continue; // Skip comments
    }

    try {
      const result = evaluate(line.trim(), variables, {
        previousResults,
        debugMode: options.debugMode,
        stdinData: options.stdinData,
        cliArg: options.cliArg,
      });

      // Store last result
      lastResult = result;

      // Only output if not in output mode (output mode shows only last result)
      if (!options.outputMode) {
        const config = ConfigManager.getInstance();
        console.log(
          chalk.green(formatResultWithUnit(result, undefined, config.precision))
        );
      }

      // Add result to previousResults for aggregate operations
      previousResults.push(result);

      // Also update 'prev' variable with the latest result
      variables.set("prev", result);
    } catch (error) {
      const markdownHandled = handleMarkdownFallback(
        line.trim(),
        error as Error,
        options,
        (result) => {
          lastResult = result;
          previousResults.push(result);
          variables.set("prev", result);
        }
      );

      if (!markdownHandled) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        hasError = true;
      }
    }
  }

  // In output mode, only print the last result
  if (options.outputMode && lastResult) {
    // In output mode, print raw value for piping
    if (lastResult.type === "string") {
      console.log(lastResult.value);
    } else if (lastResult.type === "number") {
      console.log(lastResult.value);
    } else if (lastResult.type === "boolean") {
      console.log(lastResult.value);
    } else if (lastResult.type === "null") {
      console.log("null");
    } else if (lastResult.type === "array" || lastResult.type === "object") {
      // Convert array/object to JSON for piping
      console.log(JSON.stringify(convertToJSON(lastResult)));
    } else if (lastResult.type === "markdown") {
      // For markdown, we need to reconstruct the original text
      // This is a simplified version - ideally we'd have a markdown renderer
      console.log("[markdown content]");
    } else {
      // For other types, use the formatter
      const config = ConfigManager.getInstance();
      console.log(
        formatResultWithUnit(lastResult, undefined, config.precision)
      );
    }
  }

  if (hasError) {
    process.exit(1);
  }
}

// Helper to convert CalculatedValue array/object to JSON-serializable format
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

function convertToJSON(value: CalculatedValue): JSONValue {
  if (value.type === "array") {
    return value.value.map((item) => convertToJSON(item));
  }
  if (value.type === "object") {
    const obj: { [key: string]: JSONValue } = {};
    value.value.forEach((val, key) => {
      obj[key] = convertToJSON(val);
    });
    return obj;
  }
  if (value.type === "date") {
    return value.value.toISOString();
  }
  if (value.type === "function") {
    // Functions cannot be serialized to JSON
    return `<function ${value.value.name}>`;
  }
  if (value.type === "lambda") {
    // Lambdas cannot be serialized to JSON
    return `<lambda(${value.value.parameters.join(", ")})>`;
  }
  if (value.type === "partial") {
    // Partials cannot be serialized to JSON
    return `<partial(${value.value.remainingParams.join(", ")})>`;
  }
  if (value.type === "markdown") {
    // Markdown cannot be serialized to JSON
    return "<markdown>";
  }
  // Handle Decimal types
  if (
    value.type === "number" ||
    value.type === "percentage" ||
    value.type === "quantity"
  ) {
    const { fromDecimal } = require("./utils/decimal-math");
    return fromDecimal(value.value);
  }
  return value.value;
}

async function main() {
  const args = process.argv.slice(2);

  // Handle early flags before loading dependencies
  handleEarlyFlags(args);

  // Check debug mode
  const debugMode = isDebugMode(args);

  // Check output mode
  const outputMode = args.includes("-o") || args.includes("--output");

  // Initialize managers
  await initializeManagers(args);

  // Get config and check markdown mode
  const config = ConfigManager.getInstance();
  const markdownMode = getMarkdownMode(args, config);

  // Read stdin data if available
  const stdinData = await readStdin();

  // Parse --arg flag
  let cliArg: string | undefined;
  const argIndex = args.indexOf("--arg");
  if (argIndex !== -1 && args[argIndex + 1]) {
    cliArg = args[argIndex + 1];
  }

  // Check for -e flag(s) for expression evaluation
  const expressions = parseExpressions(args);
  if (expressions.length > 0) {
    // Join all expressions with newlines to evaluate them in sequence
    // Note: -o flag doesn't apply to -e expressions (already non-interactive)
    processNonInteractiveMode(expressions.join("\n"), {
      debugMode,
      markdownMode,
      outputMode: false, // Always show all results for -e expressions
      stdinData,
      cliArg,
    });
    return;
  }

  // Separate flags from non-flag arguments
  const { nonFlagArgs } = separateArgs(args);

  // Handle file or expression arguments
  const fileResult = handleFileOrExpression(
    nonFlagArgs,
    debugMode,
    markdownMode,
    outputMode,
    stdinData,
    cliArg
  );
  if (fileResult.processed) {
    return;
  }

  const { filename, fileContent, isNewFile } = fileResult;

  // If we loaded a file
  if (filename && fileContent !== undefined) {
    // Check if we should execute the file non-interactively with -o flag
    if (outputMode) {
      // Execute file content and output only the last result
      processNonInteractiveMode(fileContent, {
        debugMode,
        markdownMode,
        outputMode: true,
        stdinData,
        cliArg,
      });
    } else {
      // Interactive mode with file content
      render(
        <Calculator
          cliArg={cliArg}
          debugMode={debugMode}
          filename={filename}
          initialContent={fileContent}
          isNewFile={isNewFile}
          markdownMode={markdownMode}
          stdinData={stdinData}
        />
      );
    }
  } else {
    // Interactive mode with empty content
    render(
      <Calculator
        cliArg={cliArg}
        debugMode={debugMode}
        markdownMode={markdownMode}
        stdinData={stdinData}
      />
    );
  }
}

// Handle errors
main().catch((error) => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});
