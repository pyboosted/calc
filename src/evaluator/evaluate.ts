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
import { DateManager } from "../utils/dateManager";
import { TimezoneManager } from "../utils/timezoneManager";
import { mathFunctions } from "./mathFunctions";
import { convertUnits } from "./unitConverter";

function isTimePeriodUnit(unit: string | undefined): boolean {
  if (!unit) return false;
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
  context?: EvaluationContext,
): CalculatedValue {
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();

  const parser = new Parser(tokens);
  const ast = parser.parse();

  return evaluateNode(ast, variables, context);
}

function evaluateNode(
  node: ASTNode,
  variables: Map<string, CalculatedValue>,
  context?: EvaluationContext,
): CalculatedValue {
  switch (node.type) {
    case "number": {
      const numNode = node as NumberNode;
      return { value: numNode.value, unit: numNode.unit };
    }

    case "variable": {
      const varNode = node as VariableNode;
      const stored = variables.get(varNode.name);
      if (stored === undefined) {
        throw new Error(`Unknown variable: ${varNode.name}`);
      }
      return stored;
    }

    case "assignment": {
      const assignNode = node as AssignmentNode;
      const result = evaluateNode(assignNode.value, variables, context);
      variables.set(assignNode.variable, result);
      return result;
    }

    case "unary": {
      const unaryNode = node as UnaryOpNode;
      const operand = evaluateNode(unaryNode.operand, variables, context);

      switch (unaryNode.operator) {
        case "+":
          return operand;
        case "-":
          return { value: -operand.value, unit: operand.unit };
        default:
          throw new Error(`Unknown unary operator: ${unaryNode.operator}`);
      }
    }

    case "binary": {
      const binaryNode = node as BinaryOpNode;

      // Special handling for unit conversion
      if (binaryNode.operator === "convert") {
        const leftResult = evaluateNode(binaryNode.left, variables, context);
        const rightNode = binaryNode.right as NumberNode;

        if (leftResult.unit && rightNode.unit) {
          const convertedValue = convertUnits(leftResult.value, leftResult.unit, rightNode.unit);
          return { value: convertedValue, unit: rightNode.unit };
        }
        return leftResult;
      }

      // Special handling for timezone conversion
      if (binaryNode.operator === "timezone_convert") {
        const leftResult = evaluateNode(binaryNode.left, variables, context);
        const rightNode = binaryNode.right as VariableNode;
        const targetTimezone = rightNode.name;

        if (leftResult.unit === "timestamp" && leftResult.date) {
          const timezoneManager = TimezoneManager.getInstance();

          // Get source timezone (default to system timezone if not specified)
          const sourceTimezone = leftResult.timezone || timezoneManager.getSystemTimezone();

          // For "now in timezone", we don't need to convert, just get current time in target timezone
          if (
            leftResult.timezone === undefined &&
            binaryNode.left.type === "date" &&
            (binaryNode.left as DateNode).value === "now"
          ) {
            const date = timezoneManager.getNowInTimezone(targetTimezone);
            return { value: date.getTime(), unit: "timestamp", date, timezone: targetTimezone };
          }

          // Validate and convert timezone
          try {
            const convertedDate = timezoneManager.convertTimezone(
              leftResult.date,
              sourceTimezone,
              targetTimezone,
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
            const convertedValue = convertUnits(leftResult.value, leftResult.unit, targetTimezone);
            return { value: convertedValue, unit: targetTimezone };
          } catch (_error) {
            // If unit conversion also fails, throw the original error
            throw new Error("Timezone conversion requires a timestamp value");
          }
        }

        throw new Error("Timezone conversion requires a timestamp value");
      }

      const left = evaluateNode(binaryNode.left, variables, context);
      const right = evaluateNode(binaryNode.right, variables, context);

      switch (binaryNode.operator) {
        case "+":
        case "-": {
          // Special handling for date arithmetic
          if (
            (left.unit === "timestamp" && left.date) ||
            (right.unit === "timestamp" && right.date)
          ) {
            const dateManager = DateManager.getInstance();

            // Handle: date - date (returns difference in milliseconds)
            if (
              left.unit === "timestamp" &&
              left.date &&
              right.unit === "timestamp" &&
              right.date
            ) {
              if (binaryNode.operator === "-") {
                const diffMs = left.date.getTime() - right.date.getTime();
                // Convert to seconds for easier unit conversion
                const diffSeconds = diffMs / 1000;
                return { value: diffSeconds, unit: "seconds" };
              } else {
                throw new Error("Cannot add two dates");
              }
            }

            // Handle: date + time period
            if (
              left.unit === "timestamp" &&
              left.date &&
              right.unit &&
              isTimePeriodUnit(right.unit)
            ) {
              const newDate =
                binaryNode.operator === "+"
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
              if (binaryNode.operator === "+") {
                const newDate = dateManager.addPeriod(right.date, left.value, left.unit);
                // Preserve timezone if present
                return {
                  value: newDate.getTime(),
                  unit: "timestamp",
                  date: newDate,
                  timezone: right.timezone,
                };
              } else {
                throw new Error("Cannot subtract a date from a time period");
              }
            }
          }

          // Special handling for percentage units
          if (right.unit === "%") {
            // Calculate percentage of the left value
            const percentageAmount = left.value * (right.value / 100);
            const result =
              binaryNode.operator === "+"
                ? left.value + percentageAmount
                : left.value - percentageAmount;
            return { value: result, unit: left.unit };
          }

          // Regular unit conversion for non-date arithmetic
          if (left.unit && right.unit && left.unit !== right.unit) {
            // Try to convert right to left's unit
            try {
              const convertedRight = convertUnits(right.value, right.unit, left.unit);
              const result =
                binaryNode.operator === "+"
                  ? left.value + convertedRight
                  : left.value - convertedRight;
              return { value: result, unit: left.unit };
            } catch {
              throw new Error(
                `Cannot ${binaryNode.operator === "+" ? "add" : "subtract"} ${left.unit} and ${right.unit}`,
              );
            }
          }
          const result =
            binaryNode.operator === "+" ? left.value + right.value : left.value - right.value;
          return { value: result, unit: left.unit || right.unit };
        }

        case "*": {
          // Multiplication: handle unit multiplication
          const result = left.value * right.value;
          // For now, keep the unit from the side that has one
          const unit = left.unit || right.unit;
          return { value: result, unit };
        }

        case "/": {
          if (right.value === 0) throw new Error("Division by zero");
          const result = left.value / right.value;
          // Division cancels units if they're the same
          const unit = left.unit && right.unit && left.unit === right.unit ? undefined : left.unit;
          return { value: result, unit };
        }

        case "%":
          return { value: left.value % right.value };

        case "percent":
          // Keep percentage as a unit instead of converting immediately
          return { value: left.value, unit: "%" };

        case "^":
          return { value: left.value ** right.value };

        case "&":
          return { value: left.value & right.value };

        case "|":
          return { value: left.value | right.value };

        case "<<":
          return { value: left.value << right.value };

        case ">>":
          return { value: left.value >> right.value };

        default:
          throw new Error(`Unknown binary operator: ${binaryNode.operator}`);
      }
    }

    case "function": {
      const funcNode = node as FunctionNode;
      const args = funcNode.args.map((arg) => evaluateNode(arg, variables, context));

      const func = mathFunctions[funcNode.name];
      if (!func) {
        throw new Error(`Unknown function: ${funcNode.name}`);
      }

      // Most math functions strip units
      const result = func(...args.map((a) => a.value));
      return { value: result };
    }

    case "date": {
      const dateNode = node as DateNode;
      const dateManager = DateManager.getInstance();
      const date = dateManager.parseRelativeDate(dateNode.value);

      if (!date) {
        throw new Error(`Invalid date: ${dateNode.value}`);
      }

      // Return the date as a timestamp with a special unit
      return { value: date.getTime(), unit: "timestamp", date };
    }

    case "time": {
      const timeNode = node as TimeNode;
      const timezoneManager = TimezoneManager.getInstance();

      try {
        // Parse time components
        const [hours, minutes] = timeNode.value.split(":").map(Number);

        // Get current date in the specified timezone
        const timezone = timeNode.timezone || timezoneManager.getSystemTimezone();
        const now = new Date();

        // Create date with time in specified timezone
        const date = timezoneManager.createDateInTimezone(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate(),
          hours ?? 0,
          minutes ?? 0,
          timezone,
        );

        // Check if the date is valid
        if (!date || Number.isNaN(date.getTime())) {
          throw new Error(`Invalid time value: ${timeNode.value}`);
        }

        return { value: date.getTime(), unit: "timestamp", date, timezone };
      } catch (_error) {
        // If there's an error creating the date, return a default time with system timezone
        const [hours, minutes] = timeNode.value.split(":").map(Number);
        const now = new Date();
        const date = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes,
          0,
          0,
        );
        return { value: date.getTime(), unit: "timestamp", date };
      }
    }

    case "datetime": {
      const datetimeNode = node as DateTimeNode;
      const timezoneManager = TimezoneManager.getInstance();

      // Parse date components
      const dateParts = datetimeNode.dateValue.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
      if (!dateParts) {
        throw new Error(`Invalid date format: ${datetimeNode.dateValue}`);
      }

      const day = parseInt(dateParts[1] ?? "1");
      const month = parseInt(dateParts[2] ?? "1");
      const year = parseInt(dateParts[3] ?? "2000");

      // Parse time components
      const [hours, minutes] = datetimeNode.timeValue.split(":").map(Number);

      // Get timezone or use system timezone
      const timezone = datetimeNode.timezone || timezoneManager.getSystemTimezone();

      // Create date in specified timezone
      const date = timezoneManager.createDateInTimezone(
        year,
        month,
        day,
        hours ?? 0,
        minutes ?? 0,
        timezone,
      );

      return { value: date.getTime(), unit: "timestamp", date, timezone };
    }

    case "dateOperation": {
      const dateOpNode = node as DateOperationNode;
      const dateResult = evaluateNode(dateOpNode.date, variables, context);

      if (!dateResult.date) {
        throw new Error("Date operation requires a date");
      }

      const dateManager = DateManager.getInstance();
      const date = dateResult.date;

      if (dateOpNode.operation === "add" || dateOpNode.operation === "subtract") {
        if (!dateOpNode.value || !dateOpNode.unit) {
          throw new Error("Date operation requires value and unit");
        }
        const valueResult = evaluateNode(dateOpNode.value, variables, context);
        const value = valueResult.value;
        const unit = dateOpNode.unit;

        const newDate =
          dateOpNode.operation === "add"
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

      throw new Error(`Unknown date operation: ${dateOpNode.operation}`);
    }

    case "aggregate": {
      const aggNode = node as AggregateNode;

      if (!context?.previousResults || context.previousResults.length === 0) {
        throw new Error(`No values to ${aggNode.operation}`);
      }

      // Filter for numeric values with their units
      const valuesWithUnits = context.previousResults
        .filter(
          (result) => result && typeof result.value === "number" && !Number.isNaN(result.value),
        )
        .map((result) => ({ value: result.value, unit: result.unit }));

      if (valuesWithUnits.length === 0) {
        throw new Error(`No numeric values to ${aggNode.operation}`);
      }

      // Group by unit type
      const unitGroups = new Map<string | undefined, Array<{ value: number; unit?: string }>>();

      for (const item of valuesWithUnits) {
        const key = item.unit || "no-unit";
        if (!unitGroups.has(key)) {
          unitGroups.set(key, []);
        }
        unitGroups.get(key)?.push(item);
      }

      // If we have a target unit, try to convert all compatible values
      let totalValue = 0;
      let resultUnit = aggNode.targetUnit;

      if (aggNode.targetUnit) {
        // Convert all compatible values to target unit
        for (const [_unit, items] of unitGroups) {
          for (const item of items) {
            try {
              if (item.unit && item.unit !== aggNode.targetUnit) {
                // Try to convert
                const converted = convertUnits(item.value, item.unit, aggNode.targetUnit);
                totalValue += converted;
              } else if (item.unit === aggNode.targetUnit) {
                totalValue += item.value;
              } else if (!item.unit) {
                // No unit - just add the value
                totalValue += item.value;
              }
            } catch (_error) {
              // Conversion failed - skip this value
              // Could optionally warn the user
            }
          }
        }
      } else {
        // No target unit specified - try to find a common unit
        let commonUnit: string | undefined;
        const allUnits: string[] = [];

        // Collect all unique units
        for (const [key, items] of unitGroups) {
          if (key !== "no-unit" && items.length > 0) {
            for (const item of items) {
              if (item.unit && !allUnits.includes(item.unit)) {
                allUnits.push(item.unit);
              }
            }
          }
        }

        if (allUnits.length === 0) {
          // No units at all
          totalValue = valuesWithUnits.reduce((sum, item) => sum + item.value, 0);
          resultUnit = undefined;
        } else if (allUnits.length === 1) {
          // All same unit
          totalValue = valuesWithUnits.reduce((sum, item) => sum + item.value, 0);
          resultUnit = allUnits[0];
        } else {
          // Multiple units - check if they're compatible
          // Use the first unit as the target
          commonUnit = allUnits[0];
          let allCompatible = true;

          // Try to convert all values to the common unit
          for (const item of valuesWithUnits) {
            if (item.unit && item.unit !== commonUnit && commonUnit) {
              try {
                const converted = convertUnits(item.value, item.unit, commonUnit);
                totalValue += converted;
              } catch (_error) {
                // Not compatible - fall back to raw sum
                allCompatible = false;
                break;
              }
            } else if (item.unit === commonUnit) {
              totalValue += item.value;
            } else if (!item.unit) {
              totalValue += item.value;
            }
          }

          if (!allCompatible) {
            // Units not compatible - just sum raw values
            totalValue = valuesWithUnits.reduce((sum, item) => sum + item.value, 0);
            resultUnit = undefined;
          } else {
            resultUnit = commonUnit;
          }
        }
      }

      if (aggNode.operation === "total") {
        return { value: totalValue, unit: resultUnit };
      } else {
        // average
        const avg = totalValue / valuesWithUnits.length;
        return { value: avg, unit: resultUnit };
      }
    }

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
