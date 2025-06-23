import chalk from "chalk";

export function showHelp(version: string | undefined) {
  console.log(`
${chalk.bold.cyan("Boosted Calculator")} v${version || "-unknown"} - A powerful terminal calculator

${chalk.bold.yellow("USAGE:")}
  ${chalk.green("calc")}                        Start interactive calculator
  ${chalk.green("calc")} ${chalk.cyan("<expression>")}           Evaluate expression and exit
  ${chalk.green("calc")} ${chalk.cyan("--file=<path>")}          Load calculations from file
  ${chalk.green("calc")} ${chalk.cyan("-f <path>")}              Load calculations from file (alternative)
  ${chalk.green("calc")} ${chalk.cyan("--update")}               Update currency exchange rates
  ${chalk.green("calc")} ${chalk.cyan("--version")}              Show version number
  ${chalk.green("calc")} ${chalk.cyan("-v")}                     Show version number (alternative)
  ${chalk.green("calc")} ${chalk.cyan("--help")}                 Show this help message
  ${chalk.green("calc")} ${chalk.cyan("-h")}                     Show this help message (alternative)

${chalk.bold.yellow("EXAMPLES:")}
  ${chalk.green("calc")} ${chalk.cyan('"2 + 2"')}                Basic arithmetic
  ${chalk.green("calc")} ${chalk.cyan('"sqrt(16)"')}             Mathematical functions
  ${chalk.green("calc")} ${chalk.cyan('"100 USD in EUR"')}       Currency conversion
  ${chalk.green("calc")} ${chalk.cyan('"5 feet in meters"')}     Unit conversion
  ${chalk.green("calc")} ${chalk.cyan('"today + 5 days"')}       Date arithmetic
  ${chalk.green("calc")} ${chalk.cyan('"20% of 150"')}           Percentage calculations

${chalk.bold.yellow("INTERACTIVE MODE:")}
  When running without arguments, the calculator starts in interactive mode.

${chalk.bold.yellow("KEYBOARD SHORTCUTS:")}
  ${chalk.magenta("Ctrl+C, ESC")}                 Exit calculator
  ${chalk.magenta("Ctrl+L")}                      Clear all calculations
  ${chalk.magenta("Ctrl+E")}                      Open in external editor
  ${chalk.magenta("Ctrl+Y")}                      Copy result to clipboard
  ${chalk.magenta("Ctrl+U, Ctrl+Shift+Y")}        Copy full line to clipboard
  ${chalk.magenta("Up/Down arrows")}              Navigate history
  ${chalk.magenta("Enter")}                       New line

${chalk.bold.yellow("FEATURES:")}
  ${chalk.gray("•")} Basic arithmetic: ${chalk.cyan("+, -, *, /, ^, %")}
  ${chalk.gray("•")} Functions: ${chalk.cyan("sqrt, sin, cos, log, round, etc.")}
  ${chalk.gray("•")} Variables: ${chalk.cyan("x = 10")}, then use ${chalk.cyan("x")}
  ${chalk.gray("•")} Previous result: use ${chalk.cyan("'prev'")}
  ${chalk.gray("•")} Aggregates: ${chalk.cyan("'total'")} and ${chalk.cyan("'average'")}
  ${chalk.gray("•")} Unit conversions: ${chalk.cyan("length, weight, time, data, etc.")}
  ${chalk.gray("•")} Live currency conversion ${chalk.cyan("(300+ currencies)")}
  ${chalk.gray("•")} Date/time operations with timezone support
  ${chalk.gray("•")} Comments with ${chalk.cyan("#")} symbol

For more information, visit: ${chalk.blue.underline("https://github.com/pyboosted/calc")}
`);
}
