import chalk from "chalk";

export function showHelp(version: string | undefined) {
  console.log(`
${chalk.bold.cyan("Boosted Calculator")} v${version || "-unknown"} - A powerful terminal calculator

${chalk.bold.yellow("USAGE:")}
  ${chalk.green("calc")}                        Start interactive calculator
  ${chalk.green("calc")} ${chalk.cyan("<file>")}                 Open file in interactive mode
  ${chalk.green("calc")} ${chalk.cyan("-e <expression>")}        Evaluate expression and exit
  ${chalk.green("calc")} ${chalk.cyan("--update")}               Update currency exchange rates
  ${chalk.green("calc")} ${chalk.cyan("--debug")}                Enable debug mode (verbose logging)
  ${chalk.green("calc")} ${chalk.cyan("--version")}              Show version number
  ${chalk.green("calc")} ${chalk.cyan("-v")}                     Show version number (alternative)
  ${chalk.green("calc")} ${chalk.cyan("--help")}                 Show this help message
  ${chalk.green("calc")} ${chalk.cyan("-h")}                     Show this help message (alternative)
  ${chalk.green("calc")} ${chalk.cyan("--arg <value>")}          Pass argument to arg() function
  ${chalk.green("calc")} ${chalk.cyan("<file> -o")}              Execute file, output only last result

${chalk.bold.yellow("EXAMPLES:")}
  ${chalk.green("calc")} ${chalk.cyan("-e '2 + 2'")}                Basic arithmetic
  ${chalk.green("calc")} ${chalk.cyan("-e 'sqrt(16)'")}             Mathematical functions
  ${chalk.green("calc")} ${chalk.cyan("-e '2 * pi'")}               Using mathematical constants
  ${chalk.green("calc")} ${chalk.cyan("-e '100 USD in EUR'")}       Currency conversion
  ${chalk.green("calc")} ${chalk.cyan("-e '5 feet in meters'")}     Unit conversion
  ${chalk.green("calc")} ${chalk.cyan("-e 'today + 5 days'")}       Date arithmetic
  ${chalk.green("calc")} ${chalk.cyan("-e '100m / 10s'")}           Velocity calculation
  ${chalk.green("calc")} ${chalk.cyan("-e '60 km/h to m/s'")}       Compound unit conversion
  ${chalk.green("calc")} ${chalk.cyan("-e '5kg * 2 m/s²'")}         Force calculation (Newton)
  ${chalk.green("calc")} ${chalk.cyan("-e '20% of 150'")}           Percentage calculations
  ${chalk.green("calc")} ${chalk.cyan('-e "`Hello, World!`"')}     String literal
  ${chalk.green("calc")} ${chalk.cyan('-e "123 as string"')}        Type casting
  ${chalk.green("calc")} ${chalk.cyan('-e "5 > 3"')}                Comparison operators
  ${chalk.green("calc")} ${chalk.cyan('-e "true and false"')}       Logical operators
  ${chalk.green("calc")} ${chalk.cyan('-e "x > 5 ? 10 : 20"')}      Ternary operator
  ${chalk.green("calc")} ${chalk.cyan('-e "[1, 2, 3]"')}            Array literal
  ${chalk.green("calc")} ${chalk.cyan('-e "{a: 1, b: 2}"')}         Object literal
  ${chalk.green("calc")} ${chalk.cyan('-e "sum([1, 2, 3])"')}       Array functions
  ${chalk.green("calc")} ${chalk.cyan('-e "x = 5; x += 3"')}        Compound assignment
  ${chalk.green("calc")} ${chalk.cyan('-e "env(\\"HOME\\")"')}        Read environment variable
  ${chalk.green("calc")} ${chalk.cyan('-e "arg()"')} ${chalk.cyan('--arg "42"')}     Pass command-line argument
  ${chalk.green("echo 100 | calc")} ${chalk.cyan('-e "arg() * 2"')}  Read from stdin
  ${chalk.green("calc")} ${chalk.cyan('-e "square(x) = x * x; square(5)"')} User-defined function
  ${chalk.green("calc")} ${chalk.cyan('-e "fact(n) = n <= 1 ? 1 : n * fact(n-1); fact(5)"')} Recursion
  ${chalk.green("calc")} ${chalk.cyan('-e "filter([1, -2, 3], x => x > 0)"')} Lambda filter
  ${chalk.green("calc")} ${chalk.cyan('-e "map([1, 2, 3], x => x * x)"')}    Lambda map
  ${chalk.green("calc")} ${chalk.cyan('-e "sort([3, 1, 4], (a, b) => a - b)"')} Lambda sort
  ${chalk.green("calc")} ${chalk.cyan('-e "[1, 2, 3] | sum"')}               Pipe operator
  ${chalk.green("calc")} ${chalk.cyan('-e "\\"hello\\" | trim | len"')}       Chain operations
  ${chalk.green("calc")} ${chalk.cyan('-e "255 to hex"')}                    Decimal to hexadecimal
  ${chalk.green("calc")} ${chalk.cyan('-e "10 to binary"')}                  Decimal to binary
  ${chalk.green("calc")} ${chalk.cyan('-e "0xFF + 0b1010"')}                 Hex and binary literals
  ${chalk.green("calc")} ${chalk.cyan("budget.calc")}            Open existing file
  ${chalk.green("calc")} ${chalk.cyan("new-file.calc")}         Create new file

${chalk.bold.yellow("INTERACTIVE MODE:")}
  When running without arguments, the calculator starts in interactive mode.

${chalk.bold.yellow("KEYBOARD SHORTCUTS:")}
  ${chalk.magenta("Ctrl+C, ESC")}                 Exit calculator
  ${chalk.magenta("Ctrl+L")}                      Clear all calculations
  ${chalk.magenta("Ctrl+Y")}                      Copy result to clipboard
  ${chalk.magenta("Ctrl+S")}                      Save file
  ${chalk.magenta("Enter")}                       New line

${chalk.bold.yellow("FEATURES:")}
  ${chalk.gray("•")} Arbitrary precision arithmetic with Decimal.js ${chalk.cyan("(v1.5.0)")}
  ${chalk.gray("•")} Basic arithmetic: ${chalk.cyan("+, -, *, /, ^, %")}
  ${chalk.gray("•")} Compound assignments: ${chalk.cyan("+=, -=")} for all types
  ${chalk.gray("•")} Mathematical constants: ${chalk.cyan("pi, e")} (case-insensitive)
  ${chalk.gray("•")} Built-in functions: ${chalk.cyan("sqrt, sin, cos, log, round, etc.")}
  ${chalk.gray("•")} User-defined functions: ${chalk.cyan("name(params) = expression")} with recursion
  ${chalk.gray("•")} Lambda functions: ${chalk.cyan("x => x * 2, (a, b) => a + b")}
  ${chalk.gray("•")} Higher-order functions: ${chalk.cyan("filter, map, reduce, sort, groupBy")}
  ${chalk.gray("•")} Pipe operator: ${chalk.cyan("[1, 2, 3] | sum")}, ${chalk.cyan("text | trim | len")}
  ${chalk.gray("•")} Variables: ${chalk.cyan("x = 10")}, then use ${chalk.cyan("x")}
  ${chalk.gray("•")} Previous result: use ${chalk.cyan("'prev'")}
  ${chalk.gray("•")} Aggregates: ${chalk.cyan("'total'")} and ${chalk.cyan("'average'")}
  ${chalk.gray("•")} String support: ${chalk.cyan("literals, interpolation, operations")}
  ${chalk.gray("•")} Boolean operations: ${chalk.cyan("true/false, comparisons, logical ops")}
  ${chalk.gray("•")} Ternary operator: ${chalk.cyan("condition ? true : false")}
  ${chalk.gray("•")} Arrays and objects: ${chalk.cyan("literals, functions, property access")}
  ${chalk.gray("•")} Type casting: ${chalk.cyan("as string, as number, as boolean, as array, as object")}
  ${chalk.gray("•")} Unit conversions: ${chalk.cyan("length, weight, time, data, etc.")}
  ${chalk.gray("•")} Dimensional analysis: ${chalk.cyan("m/s, kg⋅m/s², N, J, W, Hz, Pa")}
  ${chalk.gray("•")} Compound unit conversions: ${chalk.cyan("km/h to m/s, kWh to J")}
  ${chalk.gray("•")} Live currency conversion ${chalk.cyan("(300+ currencies)")}
  ${chalk.gray("•")} Date/time operations with timezone support
  ${chalk.gray("•")} Environment variables: ${chalk.cyan('env("VAR_NAME")')}
  ${chalk.gray("•")} Command-line arguments: ${chalk.cyan("arg()")} with stdin or ${chalk.cyan("--arg")}
  ${chalk.gray("•")} Comments with ${chalk.cyan("#")} symbol

${chalk.bold.yellow("DEBUG MODE:")}
  When enabled with ${chalk.cyan("--debug")}, provides verbose logging to stderr:
  ${chalk.gray("•")} Shows all keypresses with metadata (key codes, modifiers)
  ${chalk.gray("•")} Displays errors in red instead of treating them as comments
  ${chalk.gray("•")} Logs tokenization process for debugging syntax issues
  ${chalk.gray("•")} Shows AST (Abstract Syntax Tree) for parsed expressions
  ${chalk.gray("•")} Tracks evaluation steps and intermediate results

For more information, visit: ${chalk.blue.underline("https://github.com/pyboosted/calc")}
`);
}
