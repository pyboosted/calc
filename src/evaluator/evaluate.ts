import { ASTNode, NumberNode, BinaryOpNode, UnaryOpNode, FunctionNode, VariableNode, AssignmentNode, AggregateNode, CalculatedValue, DateNode, TimeNode, DateTimeNode, DateOperationNode } from '../types';
import { Tokenizer } from '../parser/tokenizer';
import { Parser } from '../parser/parser';
import { mathFunctions } from './mathFunctions';
import { convertUnits } from './unitConverter';
import { DateManager } from '../utils/dateManager';
import { TimezoneManager } from '../utils/timezoneManager';

function isTimePeriodUnit(unit: string | undefined): boolean {
  if (!unit) return false;
  return ['second', 'seconds', 'minute', 'minutes', 'hour', 'hours', 
          'day', 'days', 'week', 'weeks', 'month', 'months', 
          'year', 'years'].includes(unit);
}

export interface EvaluationContext {
  previousResults?: CalculatedValue[];
}

export function evaluate(input: string, variables: Map<string, CalculatedValue>, context?: EvaluationContext): CalculatedValue {
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  const parser = new Parser(tokens);
  const ast = parser.parse();
  
  return evaluateNode(ast, variables, context);
}

function evaluateNode(node: ASTNode, variables: Map<string, CalculatedValue>, context?: EvaluationContext): CalculatedValue {
  switch (node.type) {
    case 'number': {
      const numNode = node as NumberNode;
      return { value: numNode.value, unit: numNode.unit };
    }
    
    case 'variable': {
      const varNode = node as VariableNode;
      const stored = variables.get(varNode.name);
      if (stored === undefined) {
        throw new Error(`Unknown variable: ${varNode.name}`);
      }
      return stored;
    }
    
    case 'assignment': {
      const assignNode = node as AssignmentNode;
      const result = evaluateNode(assignNode.value, variables, context);
      variables.set(assignNode.variable, result);
      return result;
    }
    
    case 'unary': {
      const unaryNode = node as UnaryOpNode;
      const operand = evaluateNode(unaryNode.operand, variables, context);
      
      switch (unaryNode.operator) {
        case '+': return operand;
        case '-': return { value: -operand.value, unit: operand.unit };
        default: throw new Error(`Unknown unary operator: ${unaryNode.operator}`);
      }
    }
    
    case 'binary': {
      const binaryNode = node as BinaryOpNode;
      
      // Special handling for unit conversion
      if (binaryNode.operator === 'convert') {
        const leftResult = evaluateNode(binaryNode.left, variables, context);
        const rightNode = binaryNode.right as NumberNode;
        
        if (leftResult.unit && rightNode.unit) {
          const convertedValue = convertUnits(leftResult.value, leftResult.unit, rightNode.unit);
          return { value: convertedValue, unit: rightNode.unit };
        }
        return leftResult;
      }
      
      // Special handling for timezone conversion
      if (binaryNode.operator === 'timezone_convert') {
        const leftResult = evaluateNode(binaryNode.left, variables, context);
        const rightNode = binaryNode.right as VariableNode;
        const targetTimezone = rightNode.name;
        
        if (leftResult.unit === 'timestamp' && leftResult.date) {
          const timezoneManager = TimezoneManager.getInstance();
          
          // Get source timezone (default to system timezone if not specified)
          const sourceTimezone = leftResult.timezone || timezoneManager.getSystemTimezone();
          
          // For "now in timezone", we don't need to convert, just get current time in target timezone
          if (leftResult.timezone === undefined && binaryNode.left.type === 'date' && (binaryNode.left as DateNode).value === 'now') {
            const date = timezoneManager.getNowInTimezone(targetTimezone);
            return { value: date.getTime(), unit: 'timestamp', date, timezone: targetTimezone };
          }
          
          // Convert timezone
          const convertedDate = timezoneManager.convertTimezone(leftResult.date, sourceTimezone, targetTimezone);
          return { value: convertedDate.getTime(), unit: 'timestamp', date: convertedDate, timezone: targetTimezone };
        }
        
        throw new Error('Timezone conversion requires a timestamp value');
      }
      
      const left = evaluateNode(binaryNode.left, variables, context);
      const right = evaluateNode(binaryNode.right, variables, context);
      
      switch (binaryNode.operator) {
        case '+': 
        case '-': {
          // Special handling for date arithmetic
          if ((left.unit === 'timestamp' && left.date) || (right.unit === 'timestamp' && right.date)) {
            const dateManager = DateManager.getInstance();
            
            // Handle: date - date (returns difference in milliseconds)
            if (left.unit === 'timestamp' && left.date && right.unit === 'timestamp' && right.date) {
              if (binaryNode.operator === '-') {
                const diffMs = left.date.getTime() - right.date.getTime();
                // Convert to seconds for easier unit conversion
                const diffSeconds = diffMs / 1000;
                return { value: diffSeconds, unit: 'seconds' };
              } else {
                throw new Error('Cannot add two dates');
              }
            }
            
            // Handle: date + time period
            if (left.unit === 'timestamp' && left.date && isTimePeriodUnit(right.unit)) {
              const newDate = binaryNode.operator === '+' 
                ? dateManager.addPeriod(left.date, right.value, right.unit!)
                : dateManager.subtractPeriod(left.date, right.value, right.unit!);
              return { value: newDate.getTime(), unit: 'timestamp', date: newDate };
            }
            
            // Handle: time period + date
            if (right.unit === 'timestamp' && right.date && isTimePeriodUnit(left.unit)) {
              if (binaryNode.operator === '+') {
                const newDate = dateManager.addPeriod(right.date, left.value, left.unit!);
                return { value: newDate.getTime(), unit: 'timestamp', date: newDate };
              } else {
                throw new Error('Cannot subtract a date from a time period');
              }
            }
          }
          
          // Regular unit conversion for non-date arithmetic
          if (left.unit && right.unit && left.unit !== right.unit) {
            // Try to convert right to left's unit
            try {
              const convertedRight = convertUnits(right.value, right.unit, left.unit);
              const result = binaryNode.operator === '+' 
                ? left.value + convertedRight 
                : left.value - convertedRight;
              return { value: result, unit: left.unit };
            } catch {
              throw new Error(`Cannot ${binaryNode.operator === '+' ? 'add' : 'subtract'} ${left.unit} and ${right.unit}`);
            }
          }
          const result = binaryNode.operator === '+' 
            ? left.value + right.value 
            : left.value - right.value;
          return { value: result, unit: left.unit || right.unit };
        }
        
        case '*': {
          // Multiplication: handle unit multiplication
          const result = left.value * right.value;
          // For now, keep the unit from the side that has one
          const unit = left.unit || right.unit;
          return { value: result, unit };
        }
        
        case '/': {
          if (right.value === 0) throw new Error('Division by zero');
          const result = left.value / right.value;
          // Division cancels units if they're the same
          const unit = (left.unit && right.unit && left.unit === right.unit) 
            ? undefined 
            : left.unit;
          return { value: result, unit };
        }
        
        case '%': 
          return { value: left.value % right.value };
          
        case 'percent':
          return { value: left.value / 100, unit: left.unit };
          
        case '^': 
          return { value: Math.pow(left.value, right.value) };
          
        case '&': 
          return { value: left.value & right.value };
          
        case '|': 
          return { value: left.value | right.value };
          
        case '<<': 
          return { value: left.value << right.value };
          
        case '>>': 
          return { value: left.value >> right.value };
          
        default: 
          throw new Error(`Unknown binary operator: ${binaryNode.operator}`);
      }
    }
    
    case 'function': {
      const funcNode = node as FunctionNode;
      const args = funcNode.args.map(arg => evaluateNode(arg, variables, context));
      
      const func = mathFunctions[funcNode.name];
      if (!func) {
        throw new Error(`Unknown function: ${funcNode.name}`);
      }
      
      // Most math functions strip units
      const result = func(...args.map(a => a.value));
      return { value: result };
    }
    
    case 'date': {
      const dateNode = node as DateNode;
      const dateManager = DateManager.getInstance();
      const date = dateManager.parseRelativeDate(dateNode.value);
      
      if (!date) {
        throw new Error(`Invalid date: ${dateNode.value}`);
      }
      
      // Return the date as a timestamp with a special unit
      return { value: date.getTime(), unit: 'timestamp', date };
    }
    
    case 'time': {
      const timeNode = node as TimeNode;
      const timezoneManager = TimezoneManager.getInstance();
      
      // Parse time components
      const [hours, minutes] = timeNode.value.split(':').map(Number);
      
      // Get current date in the specified timezone
      const timezone = timeNode.timezone || timezoneManager.getSystemTimezone();
      const now = new Date();
      
      // Create date with time in specified timezone
      const date = timezoneManager.createDateInTimezone(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        hours,
        minutes,
        timezone
      );
      
      return { value: date.getTime(), unit: 'timestamp', date, timezone };
    }
    
    case 'datetime': {
      const datetimeNode = node as DateTimeNode;
      const timezoneManager = TimezoneManager.getInstance();
      
      // Parse date components
      const dateParts = datetimeNode.dateValue.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
      if (!dateParts) {
        throw new Error(`Invalid date format: ${datetimeNode.dateValue}`);
      }
      
      const day = parseInt(dateParts[1]);
      const month = parseInt(dateParts[2]);
      const year = parseInt(dateParts[3]);
      
      // Parse time components
      const [hours, minutes] = datetimeNode.timeValue.split(':').map(Number);
      
      // Get timezone or use system timezone
      const timezone = datetimeNode.timezone || timezoneManager.getSystemTimezone();
      
      // Create date in specified timezone
      const date = timezoneManager.createDateInTimezone(
        year,
        month,
        day,
        hours,
        minutes,
        timezone
      );
      
      return { value: date.getTime(), unit: 'timestamp', date, timezone };
    }
    
    case 'dateOperation': {
      const dateOpNode = node as DateOperationNode;
      const dateResult = evaluateNode(dateOpNode.date, variables, context);
      
      if (!dateResult.date) {
        throw new Error('Date operation requires a date');
      }
      
      const dateManager = DateManager.getInstance();
      const date = dateResult.date;
      
      if (dateOpNode.operation === 'add' || dateOpNode.operation === 'subtract') {
        const valueResult = evaluateNode(dateOpNode.value!, variables, context);
        const value = valueResult.value;
        const unit = dateOpNode.unit!;
        
        const newDate = dateOpNode.operation === 'add' 
          ? dateManager.addPeriod(date, value, unit)
          : dateManager.subtractPeriod(date, value, unit);
          
        return { value: newDate.getTime(), unit: 'timestamp', date: newDate };
      }
      
      throw new Error(`Unknown date operation: ${dateOpNode.operation}`);
    }
    
    case 'aggregate': {
      const aggNode = node as AggregateNode;
      
      if (!context?.previousResults || context.previousResults.length === 0) {
        throw new Error(`No values to ${aggNode.operation}`);
      }
      
      const values = context.previousResults
        .filter(result => result && typeof result.value === 'number')
        .map(result => result.value);
      
      if (values.length === 0) {
        throw new Error(`No numeric values to ${aggNode.operation}`);
      }
      
      if (aggNode.operation === 'total') {
        const sum = values.reduce((acc, val) => acc + val, 0);
        return { value: sum };
      } else { // average
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;
        return { value: avg };
      }
    }
    
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}