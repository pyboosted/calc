// Plain text help without any dependencies for fast startup

export function showHelp(version: string | undefined) {
  console.log(`
Boosted Calculator v${version || "unknown"} - A powerful terminal calculator

USAGE:
  calc                        Start interactive calculator
  calc <expression>           Evaluate expression and exit
  calc --file=<path>          Load calculations from file
  calc -f <path>              Load calculations from file (alternative)
  calc --update               Update currency exchange rates
  calc --version              Show version number
  calc -v                     Show version number (alternative)
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

FEATURES:
  • Basic arithmetic: +, -, *, /, ^, %
  • Functions: sqrt, sin, cos, log, round, etc.
  • Variables: x = 10, then use x
  • Previous result: use 'prev'
  • Aggregates: 'total' and 'average'
  • Unit conversions: length, weight, time, data, etc.
  • Live currency conversion (300+ currencies)
  • Date/time operations with timezone support
  • Comments with # symbol

For more information, visit: https://github.com/pyboosted/calc
`);
}