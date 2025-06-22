import { ASTNode, NumberNode, BinaryOpNode, UnaryOpNode, FunctionNode, VariableNode, AssignmentNode, CalculatedValue, DateNode, DateOperationNode } from '../types';
import { Tokenizer } from '../parser/tokenizer';
import { Parser } from '../parser/parser';
import { mathFunctions } from './mathFunctions';
import { convertUnits } from './unitConverter';
import { DateManager } from '../utils/dateManager';

function isTimePeriodUnit(unit: string | undefined): boolean {
  if (!unit) return false;
  return ['second', 'seconds', 'minute', 'minutes', 'hour', 'hours', 
          'day', 'days', 'week', 'weeks', 'month', 'months', 
          'year', 'years'].includes(unit);
}

export function evaluate(input: string, variables: Map<string, CalculatedValue>): CalculatedValue {
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  const parser = new Parser(tokens);
  const ast = parser.parse();
  
  return evaluateNode(ast, variables);
}

function evaluateNode(node: ASTNode, variables: Map<string, CalculatedValue>): CalculatedValue {
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
      const result = evaluateNode(assignNode.value, variables);
      variables.set(assignNode.variable, result);
      return result;
    }
    
    case 'unary': {
      const unaryNode = node as UnaryOpNode;
      const operand = evaluateNode(unaryNode.operand, variables);
      
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
        const leftResult = evaluateNode(binaryNode.left, variables);
        const rightNode = binaryNode.right as NumberNode;
        
        if (leftResult.unit && rightNode.unit) {
          const convertedValue = convertUnits(leftResult.value, leftResult.unit, rightNode.unit);
          return { value: convertedValue, unit: rightNode.unit };
        }
        return leftResult;
      }
      
      const left = evaluateNode(binaryNode.left, variables);
      const right = evaluateNode(binaryNode.right, variables);
      
      switch (binaryNode.operator) {
        case '+': 
        case '-': {
          // Special handling for date arithmetic
          if ((left.unit === 'timestamp' && left.date) || (right.unit === 'timestamp' && right.date)) {
            const dateManager = DateManager.getInstance();
            
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
      const args = funcNode.args.map(arg => evaluateNode(arg, variables));
      
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
    
    case 'dateOperation': {
      const dateOpNode = node as DateOperationNode;
      const dateResult = evaluateNode(dateOpNode.date, variables);
      
      if (!dateResult.date) {
        throw new Error('Date operation requires a date');
      }
      
      const dateManager = DateManager.getInstance();
      const date = dateResult.date;
      
      if (dateOpNode.operation === 'add' || dateOpNode.operation === 'subtract') {
        const valueResult = evaluateNode(dateOpNode.value!, variables);
        const value = valueResult.value;
        const unit = dateOpNode.unit!;
        
        const newDate = dateOpNode.operation === 'add' 
          ? dateManager.addPeriod(date, value, unit)
          : dateManager.subtractPeriod(date, value, unit);
          
        return { value: newDate.getTime(), unit: 'timestamp', date: newDate };
      }
      
      throw new Error(`Unknown date operation: ${dateOpNode.operation}`);
    }
    
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}