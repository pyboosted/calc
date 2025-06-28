import type { CalculatedValue } from "../types";
import {
  add,
  Decimal,
  divide,
  fromDecimal,
  isZero,
  multiply,
  power,
  subtract,
  toDecimal,
} from "../utils/decimal-math";
import type { DimensionMap } from "./dimensions";
import {
  areDimensionsCompatible,
  convertCompoundUnit,
  createDimensionFromUnit,
  divideDimensions,
  isDimensionless,
  multiplyDimensions,
  parseUnit,
  powerDimensions,
} from "./dimensions";
import { convertUnits } from "./unit-converter";

// Add two quantities
export function addQuantities(
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  // Special handling for percentage
  if (right.type === "percentage") {
    if (left.type === "quantity") {
      const percentageAmount = multiply(
        left.value,
        divide(right.value, toDecimal(100))
      );
      return {
        type: "quantity",
        value: add(left.value, percentageAmount),
        dimensions: left.dimensions,
      };
    }
    if (left.type === "number") {
      const percentageAmount = multiply(
        left.value,
        divide(right.value, toDecimal(100))
      );
      return {
        type: "number",
        value: add(left.value, percentageAmount),
      };
    }
    throw new Error(`Cannot add percentage to ${left.type}`);
  }

  // Handle simple numbers (no units)
  if (left.type === "number" && right.type === "number") {
    return { type: "number", value: add(left.value, right.value) };
  }

  // Convert to quantities for complex operations
  const leftQuantity = left;
  const rightQuantity = right;

  // Handle dimensionless numbers
  if (leftQuantity.type === "number" && rightQuantity.type === "number") {
    return {
      type: "number",
      value: add(leftQuantity.value, rightQuantity.value),
    };
  }

  // Handle mixed quantity/number
  if (leftQuantity.type === "quantity" && rightQuantity.type === "number") {
    if (isDimensionless(leftQuantity.dimensions)) {
      return {
        type: "number",
        value: add(leftQuantity.value, rightQuantity.value),
      };
    }
    throw new Error(
      "Cannot add dimensionless number to quantity with dimensions"
    );
  }

  if (leftQuantity.type === "number" && rightQuantity.type === "quantity") {
    if (isDimensionless(rightQuantity.dimensions)) {
      return {
        type: "number",
        value: add(leftQuantity.value, rightQuantity.value),
      };
    }
    throw new Error(
      "Cannot add dimensionless number to quantity with dimensions"
    );
  }

  // Both are quantities
  if (leftQuantity.type === "quantity" && rightQuantity.type === "quantity") {
    if (
      !areDimensionsCompatible(
        leftQuantity.dimensions,
        rightQuantity.dimensions
      )
    ) {
      throw new Error("Cannot add quantities with incompatible dimensions");
    }

    // Convert right to left's units if needed
    let rightValue = rightQuantity.value;
    if (hasUnitDifference(leftQuantity.dimensions, rightQuantity.dimensions)) {
      rightValue = convertCompoundUnit(
        rightQuantity.value,
        rightQuantity.dimensions,
        leftQuantity.dimensions
      );
    }

    return {
      type: "quantity",
      value: add(leftQuantity.value, rightValue),
      dimensions: leftQuantity.dimensions,
    };
  }

  throw new Error(`Cannot add ${leftQuantity.type} and ${rightQuantity.type}`);
}

// Subtract two quantities
export function subtractQuantities(
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  // Special handling for percentage
  if (right.type === "percentage") {
    if (left.type === "quantity") {
      const percentageAmount = multiply(
        left.value,
        divide(right.value, toDecimal(100))
      );
      return {
        type: "quantity",
        value: subtract(left.value, percentageAmount),
        dimensions: left.dimensions,
      };
    }
    if (left.type === "number") {
      const percentageAmount = multiply(
        left.value,
        divide(right.value, toDecimal(100))
      );
      return {
        type: "number",
        value: subtract(left.value, percentageAmount),
      };
    }
    throw new Error(`Cannot subtract percentage from ${left.type}`);
  }

  // Handle simple numbers (no units)
  if (left.type === "number" && right.type === "number") {
    return {
      type: "number",
      value: subtract(left.value, right.value),
    };
  }

  // Convert to quantities for complex operations
  const leftQuantity = left;
  const rightQuantity = right;

  // Handle dimensionless numbers
  if (leftQuantity.type === "number" && rightQuantity.type === "number") {
    return {
      type: "number",
      value: subtract(leftQuantity.value, rightQuantity.value),
    };
  }

  // Handle mixed quantity/number
  if (leftQuantity.type === "quantity" && rightQuantity.type === "number") {
    if (isDimensionless(leftQuantity.dimensions)) {
      return {
        type: "number",
        value: subtract(leftQuantity.value, rightQuantity.value),
      };
    }
    throw new Error(
      "Cannot subtract dimensionless number from quantity with dimensions"
    );
  }

  if (leftQuantity.type === "number" && rightQuantity.type === "quantity") {
    if (isDimensionless(rightQuantity.dimensions)) {
      return {
        type: "number",
        value: subtract(leftQuantity.value, rightQuantity.value),
      };
    }
    throw new Error(
      "Cannot subtract quantity with dimensions from dimensionless number"
    );
  }

  // Both are quantities
  if (leftQuantity.type === "quantity" && rightQuantity.type === "quantity") {
    if (
      !areDimensionsCompatible(
        leftQuantity.dimensions,
        rightQuantity.dimensions
      )
    ) {
      throw new Error(
        "Cannot subtract quantities with incompatible dimensions"
      );
    }

    // Convert right to left's units if needed
    let rightValue = rightQuantity.value;
    if (hasUnitDifference(leftQuantity.dimensions, rightQuantity.dimensions)) {
      rightValue = convertCompoundUnit(
        rightQuantity.value,
        rightQuantity.dimensions,
        leftQuantity.dimensions
      );
    }

    return {
      type: "quantity",
      value: subtract(leftQuantity.value, rightValue),
      dimensions: leftQuantity.dimensions,
    };
  }

  throw new Error(
    `Cannot subtract ${rightQuantity.type} from ${leftQuantity.type}`
  );
}

// Multiply two quantities
export function multiplyQuantities(
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  // Convert numbers with units to quantities
  const leftQuantity = left;
  const rightQuantity = right;

  // Handle dimensionless numbers
  if (leftQuantity.type === "number" && rightQuantity.type === "number") {
    return {
      type: "number",
      value: multiply(leftQuantity.value, rightQuantity.value),
    };
  }

  // Handle mixed quantity/number
  if (leftQuantity.type === "quantity" && rightQuantity.type === "number") {
    return {
      type: "quantity",
      value: multiply(leftQuantity.value, rightQuantity.value),
      dimensions: leftQuantity.dimensions,
    };
  }

  if (leftQuantity.type === "number" && rightQuantity.type === "quantity") {
    return {
      type: "quantity",
      value: multiply(leftQuantity.value, rightQuantity.value),
      dimensions: rightQuantity.dimensions,
    };
  }

  // Both are quantities
  if (leftQuantity.type === "quantity" && rightQuantity.type === "quantity") {
    // Before multiplying, we need to handle unit conversions for dimensions that will cancel out
    const leftValue = leftQuantity.value;
    let rightValue = rightQuantity.value;

    // Check each dimension to see if it will cancel out
    for (const dim of Object.keys(
      leftQuantity.dimensions
    ) as (keyof DimensionMap)[]) {
      const leftDim = leftQuantity.dimensions[dim];
      const rightDim = rightQuantity.dimensions[dim];

      if (
        leftDim &&
        rightDim &&
        leftDim.exponent + rightDim.exponent === 0 &&
        "unit" in leftDim &&
        "unit" in rightDim &&
        leftDim.unit &&
        rightDim.unit &&
        leftDim.unit !== rightDim.unit
      ) {
        // This dimension will cancel out - convert to common unit first
        // Convert right value to left's unit
        const conversionFactor = convertUnits(
          new Decimal(1),
          rightDim.unit,
          leftDim.unit
        );
        rightValue = multiply(
          rightValue,
          power(conversionFactor, toDecimal(Math.abs(rightDim.exponent)))
        );
      }
    }

    const newDimensions = multiplyDimensions(
      leftQuantity.dimensions,
      rightQuantity.dimensions
    );

    // Check if result is dimensionless
    if (isDimensionless(newDimensions)) {
      return {
        type: "number",
        value: multiply(leftValue, rightValue),
      };
    }

    return {
      type: "quantity",
      value: multiply(leftValue, rightValue),
      dimensions: newDimensions,
    };
  }

  throw new Error(
    `Cannot multiply ${leftQuantity.type} and ${rightQuantity.type}`
  );
}

// Divide two quantities
export function divideQuantities(
  left: CalculatedValue,
  right: CalculatedValue
): CalculatedValue {
  // Convert numbers with units to quantities
  const leftQuantity = left;
  const rightQuantity = right;

  // Handle dimensionless numbers
  if (leftQuantity.type === "number" && rightQuantity.type === "number") {
    if (isZero(rightQuantity.value)) {
      throw new Error("Division by zero");
    }
    return {
      type: "number",
      value: divide(leftQuantity.value, rightQuantity.value),
    };
  }

  // Handle mixed quantity/number
  if (leftQuantity.type === "quantity" && rightQuantity.type === "number") {
    if (isZero(rightQuantity.value)) {
      throw new Error("Division by zero");
    }
    return {
      type: "quantity",
      value: divide(leftQuantity.value, rightQuantity.value),
      dimensions: leftQuantity.dimensions,
    };
  }

  if (leftQuantity.type === "number" && rightQuantity.type === "quantity") {
    if (isZero(rightQuantity.value)) {
      throw new Error("Division by zero");
    }
    const newDimensions = divideDimensions({}, rightQuantity.dimensions);

    // Check if result is dimensionless
    if (isDimensionless(newDimensions)) {
      return {
        type: "number",
        value: divide(leftQuantity.value, rightQuantity.value),
      };
    }

    return {
      type: "quantity",
      value: divide(leftQuantity.value, rightQuantity.value),
      dimensions: newDimensions,
    };
  }

  // Both are quantities
  if (leftQuantity.type === "quantity" && rightQuantity.type === "quantity") {
    if (isZero(rightQuantity.value)) {
      throw new Error("Division by zero");
    }

    // Before dividing, we need to handle unit conversions for matching dimensions
    const leftValue = leftQuantity.value;
    let rightValue = rightQuantity.value;

    // Check each dimension that appears in both quantities
    const allDims = new Set([
      ...Object.keys(leftQuantity.dimensions),
      ...Object.keys(rightQuantity.dimensions),
    ]) as Set<keyof DimensionMap>;

    for (const dim of allDims) {
      const leftDim = leftQuantity.dimensions[dim];
      const rightDim = rightQuantity.dimensions[dim];

      if (
        leftDim &&
        rightDim &&
        "unit" in leftDim &&
        "unit" in rightDim &&
        leftDim.unit &&
        rightDim.unit &&
        leftDim.unit !== rightDim.unit
      ) {
        // Same dimension with different units - convert right to left's unit
        const conversionFactor = convertUnits(
          new Decimal(1),
          rightDim.unit,
          leftDim.unit
        );
        rightValue = multiply(
          rightValue,
          power(conversionFactor, toDecimal(rightDim.exponent))
        );
      }
    }

    const newDimensions = divideDimensions(
      leftQuantity.dimensions,
      rightQuantity.dimensions
    );

    // Check if result is dimensionless
    if (isDimensionless(newDimensions)) {
      return {
        type: "number",
        value: divide(leftValue, rightValue),
      };
    }

    return {
      type: "quantity",
      value: divide(leftValue, rightValue),
      dimensions: newDimensions,
    };
  }

  throw new Error(
    `Cannot divide ${leftQuantity.type} by ${rightQuantity.type}`
  );
}

// Power operation for quantities
export function powerQuantity(
  base: CalculatedValue,
  exponent: CalculatedValue
): CalculatedValue {
  // Convert numbers with units to quantities
  const baseQuantity = base;

  // Exponent must be a dimensionless number
  if (exponent.type !== "number") {
    throw new Error("Exponent must be a dimensionless number");
  }

  if (baseQuantity.type === "number") {
    return {
      type: "number",
      value: power(baseQuantity.value, exponent.value),
    };
  }

  if (baseQuantity.type === "quantity") {
    const newDimensions = powerDimensions(
      baseQuantity.dimensions,
      fromDecimal(exponent.value)
    );

    // Check if result is dimensionless
    if (isDimensionless(newDimensions)) {
      return {
        type: "number",
        value: power(baseQuantity.value, exponent.value),
      };
    }

    return {
      type: "quantity",
      value: power(baseQuantity.value, exponent.value),
      dimensions: newDimensions,
    };
  }

  throw new Error(`Cannot raise ${baseQuantity.type} to a power`);
}

// Convert quantity to target unit/dimensions
export function convertQuantity(
  value: CalculatedValue,
  targetUnit: string
): CalculatedValue {
  // Only handle quantities
  if (value.type === "quantity") {
    try {
      // Check if this is a compound unit expression
      const targetDimensions =
        targetUnit.includes("*") || targetUnit.includes("^")
          ? parseUnit(targetUnit)
          : createDimensionFromUnit(targetUnit);

      if (!areDimensionsCompatible(value.dimensions, targetDimensions)) {
        throw new Error("Incompatible dimensions for conversion");
      }

      const converted = convertCompoundUnit(
        value.value,
        value.dimensions,
        targetDimensions
      );

      return {
        type: "quantity",
        value: converted,
        dimensions: targetDimensions,
      };
    } catch (e) {
      throw new Error(
        `Cannot convert to ${targetUnit}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  throw new Error(`Cannot convert ${value.type} to ${targetUnit}`);
}

// Helper to check if two dimension maps have different units
export function hasUnitDifference(a: DimensionMap, b: DimensionMap): boolean {
  for (const dim of Object.keys(a) as (keyof DimensionMap)[]) {
    const infoA = a[dim];
    const infoB = b[dim];
    if (infoA && infoB) {
      if (dim === "currency") {
        const currencyA = infoA as { exponent: number; code: string };
        const currencyB = infoB as { exponent: number; code: string };
        if (currencyA.code !== currencyB.code) {
          return true;
        }
      } else if (
        "unit" in infoA &&
        "unit" in infoB &&
        infoA.unit !== infoB.unit
      ) {
        return true;
      }
    }
  }
  return false;
}
