import { Parser } from "../parser/parser";
import { Tokenizer } from "../parser/tokenizer";
import type {
  AggregateNode,
  ASTNode,
  AssignmentNode,
  BinaryOpNode,
  CalculatedValue,
  DateNode,
  DateOperationNode,
  DateTimeNode,
  FunctionNode,
  NumberNode,
  TimeNode,
  UnaryOpNode,
  VariableNode,
} from "../types";
import { DateManager } from "../utils/date-manager";
import { TimezoneManager } from "../utils/timezone-manager";
import { mathFunctions } from "./math-functions";
import { convertUnits } from "./unit-converter";

// Regex patterns
const DATE_PATTERN = /(\d{1,2})[./](\d{1,2})[./](\d{4})/;

function isTimePeriodUnit(unit: string | undefined): boolean {
  if (!unit) {
    return false;
  }
  return [
    "second",
    "seconds",
    "s",
    "sec",
    "minute",
    "minutes",
    "min",
    "m",
    "hour",
    "hours",
    "h",
    "hr",
    "day",
    "days",
    "d",
    "week",
    "weeks",
    "w",
    "month",
    "months",
    "year",
    "years",
    "yr",
  ].includes(unit);
}

export interface EvaluationContext {
  previousResults?: CalculatedValue[];
}

export function evaluate(
  input: string,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();

  const parser = new Parser(tokens);
  const ast = parser.parse();

  return evaluateNode(ast, variables, context);
}

// Handler functions for each node type
function evaluateNumberNode(node: NumberNode): CalculatedValue {
  return { value: node.value, unit: node.unit };
}

function evaluateVariableNode(
  node: VariableNode,
  variables: Map<string, CalculatedValue>
): CalculatedValue {
  const value = variables.get(node.name);
  if (value === undefined) {
    throw new Error(`Unknown variable: ${node.name}`);
  }
  return value;
}

function evaluateAssignmentNode(
  node: AssignmentNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const result = evaluateNode(node.value, variables, context);
  variables.set(node.variable, result);
  return result;
}

function evaluateUnaryNode(
  node: UnaryOpNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const operand = evaluateNode(node.operand, variables, context);

  switch (node.operator) {
    case "+":
      return operand;
    case "-":
      return { value: -operand.value, unit: operand.unit };
    default:
      throw new Error(`Unknown unary operator: ${node.operator}`);
  }
}

function evaluateFunctionNode(
  node: FunctionNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const args = node.args.map((arg) => evaluateNode(arg, variables, context));

  const func = mathFunctions[node.name];
  if (!func) {
    throw new Error(`Unknown function: ${node.name}`);
  }

  // Most math functions strip units
  const result = func(...args.map((a) => a.value));
  return { value: result };
}

function evaluateDateNode(node: DateNode): CalculatedValue {
  const dateManager = DateManager.getInstance();
  const date = dateManager.parseRelativeDate(node.value);

  if (!date) {
    throw new Error(`Invalid date: ${node.value}`);
  }

  // Return the date as a timestamp with a special unit
  return { value: date.getTime(), unit: "timestamp", date };
}

function evaluateTimeNode(node: TimeNode): CalculatedValue {
  const timezoneManager = TimezoneManager.getInstance();

  try {
    // Parse time components
    const [hours, minutes] = node.value.split(":").map(Number);

    // Get current date in the specified timezone
    const timezone = node.timezone || timezoneManager.getSystemTimezone();
    const now = new Date();

    // Create date with time in specified timezone
    const date = timezoneManager.createDateInTimezone(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      hours ?? 0,
      minutes ?? 0,
      timezone
    );

    // Check if the date is valid
    if (!date || Number.isNaN(date.getTime())) {
      throw new Error(`Invalid time value: ${node.value}`);
    }

    return { value: date.getTime(), unit: "timestamp", date, timezone };
  } catch (_error) {
    // If there's an error creating the date, return a default time with system timezone
    const [hours, minutes] = node.value.split(":").map(Number);
    const now = new Date();
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );
    return { value: date.getTime(), unit: "timestamp", date };
  }
}

function evaluateDateTimeNode(node: DateTimeNode): CalculatedValue {
  const timezoneManager = TimezoneManager.getInstance();

  // Parse date components
  const dateParts = node.dateValue.match(DATE_PATTERN);
  if (!dateParts) {
    throw new Error(`Invalid date format: ${node.dateValue}`);
  }

  const day = Number.parseInt(dateParts[1] ?? "1", 10);
  const month = Number.parseInt(dateParts[2] ?? "1", 10);
  const year = Number.parseInt(dateParts[3] ?? "2000", 10);

  // Parse time components
  const [hours, minutes] = node.timeValue.split(":").map(Number);

  // Get timezone or use system timezone
  const timezone = node.timezone || timezoneManager.getSystemTimezone();

  // Create date in specified timezone
  const date = timezoneManager.createDateInTimezone(
    year,
    month,
    day,
    hours ?? 0,
    minutes ?? 0,
    timezone
  );

  return { value: date.getTime(), unit: "timestamp", date, timezone };
}

function evaluateDateOperationNode(
  node: DateOperationNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  const dateResult = evaluateNode(node.date, variables, context);

  if (!dateResult.date) {
    throw new Error("Date operation requires a date");
  }

  const dateManager = DateManager.getInstance();
  const date = dateResult.date;

  if (node.operation === "add" || node.operation === "subtract") {
    if (!(node.value && node.unit)) {
      throw new Error("Date operation requires value and unit");
    }
    const valueResult = evaluateNode(node.value, variables, context);
    const value = valueResult.value;
    const unit = node.unit;

    const newDate =
      node.operation === "add"
        ? dateManager.addPeriod(date, value, unit)
        : dateManager.subtractPeriod(date, value, unit);

    // Preserve timezone if present
    return {
      value: newDate.getTime(),
      unit: "timestamp",
      date: newDate,
      timezone: dateResult.timezone,
    };
  }

  throw new Error(`Unknown date operation: ${node.operation}`);
}

function evaluateBinaryNode(
  node: BinaryOpNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  // Special handling for unit conversion
  if (node.operator === "convert") {
    const leftResult = evaluateNode(node.left, variables, context);
    const rightNode = node.right as NumberNode;

    if (leftResult.unit && rightNode.unit) {
      const convertedValue = convertUnits(
        leftResult.value,
        leftResult.unit,
        rightNode.unit
      );
      return { value: convertedValue, unit: rightNode.unit };
    }
    return leftResult;
  }

  // Special handling for timezone conversion
  if (node.operator === "timezone_convert") {
    const leftResult = evaluateNode(node.left, variables, context);
    const rightNode = node.right as VariableNode;
    const targetTimezone = rightNode.name;

    if (leftResult.unit === "timestamp" && leftResult.date) {
      const timezoneManager = TimezoneManager.getInstance();

      // Get source timezone (default to system timezone if not specified)
      const sourceTimezone =
        leftResult.timezone || timezoneManager.getSystemTimezone();

      // For "now in timezone", we don't need to convert, just get current time in target timezone
      if (
        leftResult.timezone === undefined &&
        node.left.type === "date" &&
        (node.left as DateNode).value === "now"
      ) {
        const date = timezoneManager.getNowInTimezone(targetTimezone);
        return {
          value: date.getTime(),
          unit: "timestamp",
          date,
          timezone: targetTimezone,
        };
      }

      // Validate and convert timezone
      try {
        const convertedDate = timezoneManager.convertTimezone(
          leftResult.date,
          sourceTimezone,
          targetTimezone
        );
        return {
          value: convertedDate.getTime(),
          unit: "timestamp",
          date: convertedDate,
          timezone: targetTimezone,
        };
      } catch (_error) {
        // If timezone conversion fails, return the original date with the attempted timezone
        return { ...leftResult, timezone: targetTimezone };
      }
    }

    // Not a timestamp - try regular unit conversion instead
    if (leftResult.unit && targetTimezone) {
      try {
        const convertedValue = convertUnits(
          leftResult.value,
          leftResult.unit,
          targetTimezone
        );
        return { value: convertedValue, unit: targetTimezone };
      } catch (_error) {
        // If unit conversion also fails, throw the original error
        throw new Error("Timezone conversion requires a timestamp value");
      }
    }

    throw new Error("Timezone conversion requires a timestamp value");
  }

  const left = evaluateNode(node.left, variables, context);
  const right = evaluateNode(node.right, variables, context);

  // Extract binary operations into separate helper functions
  return evaluateBinaryOperation(node.operator, left, right);
}

function evaluateBinaryOperation(
  operator: string,
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  switch (operator) {
    case "+":
    case "-":
      return evaluateAddSubtract(operator, left, right);

    case "*":
      return evaluateMultiply(left, right);

    case "/":
      return evaluateDivide(left, right);

    case "%":
      return { value: left.value % right.value };

    case "percent":
      // Keep percentage as a unit instead of converting immediately
      return { value: left.value, unit: "%" };

    case "^":
      return { value: left.value ** right.value };

    case "&":
      // biome-ignore lint/nursery/noBitwiseOperators: Calculator supports bitwise operations
      return { value: left.value & right.value };

    case "|":
      // biome-ignore lint/nursery/noBitwiseOperators: Calculator supports bitwise operations
      return { value: left.value | right.value };

    case "<<":
      // biome-ignore lint/nursery/noBitwiseOperators: Calculator supports bitwise operations
      return { value: left.value << right.value };

    case ">>":
      // biome-ignore lint/nursery/noBitwiseOperators: Calculator supports bitwise operations
      return { value: left.value >> right.value };

    default:
      throw new Error(`Unknown binary operator: ${operator}`);
  }
}

function evaluateAddSubtract(
  operator: string,
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  // Special handling for date arithmetic
  if (
    (left.unit === "timestamp" && left.date) ||
    (right.unit === "timestamp" && right.date)
  ) {
    return evaluateDateArithmetic(operator, left, right);
  }

  // Special handling for percentage units
  if (right.unit === "%") {
    return evaluatePercentageOperation(operator, left, right);
  }

  // Regular unit conversion for non-date arithmetic
  if (left.unit && right.unit && left.unit !== right.unit) {
    return evaluateWithUnitConversion(operator, left, right);
  }

  // Simple arithmetic
  const result =
    operator === "+" ? left.value + right.value : left.value - right.value;
  return { value: result, unit: left.unit || right.unit };
}

function evaluateDateArithmetic(
  operator: string,
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  const dateManager = DateManager.getInstance();

  // Handle: date - date (returns difference in milliseconds)
  if (
    left.unit === "timestamp" &&
    left.date &&
    right.unit === "timestamp" &&
    right.date
  ) {
    if (operator === "-") {
      const diffMs = left.date.getTime() - right.date.getTime();
      // Convert to seconds for easier unit conversion
      const diffSeconds = diffMs / 1000;
      return { value: diffSeconds, unit: "seconds" };
    }
    throw new Error("Cannot add two dates");
  }

  // Handle: date + time period
  if (
    left.unit === "timestamp" &&
    left.date &&
    right.unit &&
    isTimePeriodUnit(right.unit)
  ) {
    const newDate =
      operator === "+"
        ? dateManager.addPeriod(left.date, right.value, right.unit)
        : dateManager.subtractPeriod(left.date, right.value, right.unit);
    // Preserve timezone if present
    return {
      value: newDate.getTime(),
      unit: "timestamp",
      date: newDate,
      timezone: left.timezone,
    };
  }

  // Handle: time period + date
  if (
    right.unit === "timestamp" &&
    right.date &&
    left.unit &&
    isTimePeriodUnit(left.unit)
  ) {
    if (operator === "+") {
      const newDate = dateManager.addPeriod(right.date, left.value, left.unit);
      // Preserve timezone if present
      return {
        value: newDate.getTime(),
        unit: "timestamp",
        date: newDate,
        timezone: right.timezone,
      };
    }
    throw new Error("Cannot subtract a date from a time period");
  }

  // Shouldn't reach here, but return a default
  throw new Error("Invalid date arithmetic operation");
}

function evaluatePercentageOperation(
  operator: string,
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  const percentageAmount = left.value * (right.value / 100);
  const result =
    operator === "+"
      ? left.value + percentageAmount
      : left.value - percentageAmount;
  return { value: result, unit: left.unit };
}

function evaluateWithUnitConversion(
  operator: string,
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  if (!(left.unit && right.unit)) {
    throw new Error("Unit conversion requires both values to have units");
  }

  try {
    const convertedRight = convertUnits(right.value, right.unit, left.unit);
    const result =
      operator === "+"
        ? left.value + convertedRight
        : left.value - convertedRight;
    return { value: result, unit: left.unit };
  } catch {
    throw new Error(
      `Cannot ${operator === "+" ? "add" : "subtract"} ${left.unit} and ${right.unit}`
    );
  }
}

function evaluateMultiply(
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  const result = left.value * right.value;
  // For now, keep the unit from the side that has one
  const unit = left.unit || right.unit;
  return { value: result, unit };
}

function evaluateDivide(
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  if (right.value === 0) {
    throw new Error("Division by zero");
  }
  const result = left.value / right.value;
  // Division cancels units if they're the same
  const unit =
    left.unit && right.unit && left.unit === right.unit ? undefined : left.unit;
  return { value: result, unit };
}

function evaluateAggregateNode(
  node: AggregateNode,
  context?: EvaluationContext
): CalculatedValue {
  if (!context?.previousResults || context.previousResults.length === 0) {
    throw new Error(`No values to ${node.operation}`);
  }

  // Check if we have a date/timestamp and time periods for smart date arithmetic
  const dateResults = context.previousResults.filter(
    (result) => result && result.unit === "timestamp" && result.date
  );
  const timePeriodResults = context.previousResults.filter(
    (result) => result && isTimePeriodUnit(result.unit)
  );

  // If we have exactly one date and one or more time periods, add them together
  if (
    node.operation === "total" &&
    dateResults.length === 1 &&
    timePeriodResults.length > 0 &&
    !node.targetUnit
  ) {
    const dateResult = dateResults[0];

    // Sum all time periods, converting to seconds
    let totalSeconds = 0;
    for (const period of timePeriodResults) {
      try {
        if (period.unit) {
          const seconds = convertUnits(period.value, period.unit, "seconds");
          totalSeconds += seconds;
        }
      } catch (_error) {
        // If conversion fails, skip this period
      }
    }

    // Add the total time period to the date
    if (totalSeconds !== 0 && dateResult && dateResult.date) {
      const dateManagerInstance = DateManager.getInstance();
      const newDate = dateManagerInstance.addPeriod(
        dateResult.date,
        totalSeconds,
        "seconds"
      );
      return {
        value: newDate.getTime(),
        unit: "timestamp",
        date: newDate,
        timezone: dateResult.timezone,
      };
    }
  }

  // Filter for numeric values with their units (original behavior)
  const valuesWithUnits = context.previousResults
    .filter(
      (result) =>
        result &&
        typeof result.value === "number" &&
        !Number.isNaN(result.value)
    )
    .map((result) => ({ value: result.value, unit: result.unit }));

  if (valuesWithUnits.length === 0) {
    throw new Error(`No numeric values to ${node.operation}`);
  }

  const totalValue = calculateAggregateValue(valuesWithUnits, node.targetUnit);
  const resultUnit = determineResultUnit(valuesWithUnits, node.targetUnit);

  if (node.operation === "total") {
    return { value: totalValue, unit: resultUnit };
  }
  // average
  const avg = totalValue / valuesWithUnits.length;
  return { value: avg, unit: resultUnit };
}

function calculateAggregateValue(
  valuesWithUnits: Array<{ value: number; unit?: string }>,
  targetUnit?: string
): number {
  if (targetUnit) {
    return calculateWithTargetUnit(valuesWithUnits, targetUnit);
  }

  return calculateWithoutTargetUnit(valuesWithUnits);
}

function calculateWithTargetUnit(
  valuesWithUnits: Array<{ value: number; unit?: string }>,
  targetUnit: string
): number {
  let totalValue = 0;

  for (const item of valuesWithUnits) {
    totalValue += convertItemToUnit(item, targetUnit);
  }

  return totalValue;
}

function calculateWithoutTargetUnit(
  valuesWithUnits: Array<{ value: number; unit?: string }>
): number {
  const commonUnit = findCommonUnit(valuesWithUnits);

  if (!commonUnit) {
    // No common unit - just sum raw values
    return valuesWithUnits.reduce((sum, item) => sum + item.value, 0);
  }

  let totalValue = 0;
  for (const item of valuesWithUnits) {
    if (item.unit && item.unit !== commonUnit) {
      try {
        const converted = convertUnits(item.value, item.unit, commonUnit);
        totalValue += converted;
      } catch (_error) {
        // Not compatible - just add raw value
        totalValue += item.value;
      }
    } else {
      totalValue += item.value;
    }
  }

  return totalValue;
}

function convertItemToUnit(
  item: { value: number; unit?: string },
  targetUnit: string
): number {
  if (!item.unit) {
    // No unit - just return the value
    return item.value;
  }

  if (item.unit === targetUnit) {
    return item.value;
  }

  try {
    return convertUnits(item.value, item.unit, targetUnit);
  } catch (_error) {
    // Conversion failed - skip this value
    return 0;
  }
}

function findCommonUnit(
  valuesWithUnits: Array<{ value: number; unit?: string }>
): string | undefined {
  const unitGroups = new Map<string, number>();

  // Count occurrences of each unit
  for (const item of valuesWithUnits) {
    if (item.unit) {
      unitGroups.set(item.unit, (unitGroups.get(item.unit) || 0) + 1);
    }
  }

  if (unitGroups.size === 0) {
    return;
  }

  if (unitGroups.size === 1) {
    return Array.from(unitGroups.keys())[0];
  }

  // Multiple units - use the most common one
  let maxCount = 0;
  let commonUnit: string | undefined;
  for (const [unit, count] of unitGroups) {
    if (count > maxCount) {
      maxCount = count;
      commonUnit = unit;
    }
  }

  return commonUnit;
}

function determineResultUnit(
  valuesWithUnits: Array<{ value: number; unit?: string }>,
  targetUnit?: string
): string | undefined {
  if (targetUnit) {
    return targetUnit;
  }

  const commonUnit = findCommonUnit(valuesWithUnits);
  if (!commonUnit) {
    return;
  }

  // Check if all units are compatible with the common unit
  for (const item of valuesWithUnits) {
    if (item.unit && item.unit !== commonUnit) {
      try {
        convertUnits(1, item.unit, commonUnit);
      } catch (_error) {
        // Not compatible - return undefined
        return;
      }
    }
  }

  return commonUnit;
}

function evaluateNode(
  node: ASTNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext
): CalculatedValue {
  switch (node.type) {
    case "number":
      return evaluateNumberNode(node);

    case "variable":
      return evaluateVariableNode(node, variables);

    case "assignment":
      return evaluateAssignmentNode(node, variables, context);

    case "unary":
      return evaluateUnaryNode(node, variables, context);

    case "binary":
      return evaluateBinaryNode(node, variables, context);

    case "function":
      return evaluateFunctionNode(node, variables, context);

    case "date":
      return evaluateDateNode(node);

    case "time":
      return evaluateTimeNode(node);

    case "datetime":
      return evaluateDateTimeNode(node);

    case "dateOperation":
      return evaluateDateOperationNode(node, variables, context);

    case "aggregate":
      return evaluateAggregateNode(node, context);

    default: {
      // This ensures exhaustiveness - TypeScript will error if we miss a case
      const _exhaustiveCheck: never = node;
      throw new Error(
        `Unknown node type: ${(node as unknown as { type: string }).type}`
      );
    }
  }
}
