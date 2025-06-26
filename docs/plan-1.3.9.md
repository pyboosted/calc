# Plan for Version 1.3.9: Dimensional Analysis and Compound Units

## Overview

This plan outlines a major enhancement to the calculator's type system to support compound units and dimensional analysis. Instead of having separate types for each dimension (length, weight, etc.), we'll use a unified quantity type with dimensional tracking, enabling scientific calculations like `100m / 10s = 10 m/s`.

## Motivation

1. **Scientific Calculations**: Support velocity, acceleration, force, energy, etc.
2. **Dimensional Analysis**: Automatic unit derivation and validation
3. **Type Safety**: Prevent nonsensical operations at the dimension level
4. **Engineering Support**: Electrical units, pressure, power calculations

## New Type System

### Current System
```typescript
type CalculatedValue =
  | { type: "number"; value: number; unit?: string }
  | { type: "string"; value: string }
  | { type: "date"; value: Date; timezone?: string }
  // ... other types
```

### Proposed System
```typescript
type CalculatedValue =
  | { type: "number"; value: number }  // Dimensionless numbers
  | { type: "quantity"; value: number; dimensions: DimensionMap; displayUnit?: string }
  | { type: "currency"; value: number; unit: string }  // Special case
  | { type: "string"; value: string }
  | { type: "date"; value: Date; timezone?: string }
  // ... other types

// Define unit types for each dimension
type LengthUnit = 'm' | 'km' | 'cm' | 'mm' | 'ft' | 'in' | 'yd' | 'mi';
type MassUnit = 'kg' | 'g' | 'mg' | 'lb' | 'oz' | 't';
type TimeUnit = 's' | 'min' | 'h' | 'day' | 'week' | 'month' | 'year' | 'ms';
type CurrentUnit = 'A' | 'mA' | 'μA';
type TemperatureUnit = 'K' | 'C' | 'F';
type AmountUnit = 'mol';
type LuminosityUnit = 'cd';
type AngleUnit = 'rad' | 'deg' | '°';
type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | string; // extensible

// DimensionMap with proper typing
type DimensionMap = {
  length?: { exponent: number; unit?: LengthUnit };
  mass?: { exponent: number; unit?: MassUnit };
  time?: { exponent: number; unit?: TimeUnit };
  current?: { exponent: number; unit?: CurrentUnit };
  temperature?: { exponent: number; unit?: TemperatureUnit };
  amount?: { exponent: number; unit?: AmountUnit };
  luminosity?: { exponent: number; unit?: LuminosityUnit };
  angle?: { exponent: number; unit?: AngleUnit };
  currency?: { exponent: number; code: CurrencyCode };
}
```

## Examples of Compound Units

### Basic Derived Units
```
# Velocity
100m / 10s = 10 m/s
type: quantity, dimensions: { 
  length: { exponent: 1, unit: 'm' }, 
  time: { exponent: -1, unit: 's' } 
}

# Acceleration  
10 m/s / 10s = 1 m/s²
type: quantity, dimensions: { 
  length: { exponent: 1, unit: 'm' }, 
  time: { exponent: -2, unit: 's' } 
}

# Area
5m * 4m = 20 m²
type: quantity, dimensions: { 
  length: { exponent: 2, unit: 'm' } 
}

# Volume
2m * 3m * 4m = 24 m³
type: quantity, dimensions: { 
  length: { exponent: 3, unit: 'm' } 
}
```

### Physics Units
```
# Force (Newton = kg⋅m/s²)
5kg * 2 m/s² = 10 N
type: quantity, dimensions: { 
  mass: { exponent: 1, unit: 'kg' }, 
  length: { exponent: 1, unit: 'm' }, 
  time: { exponent: -2, unit: 's' } 
}

# Energy (Joule = kg⋅m²/s²)
10N * 5m = 50 J
type: quantity, dimensions: { 
  mass: { exponent: 1, unit: 'kg' }, 
  length: { exponent: 2, unit: 'm' }, 
  time: { exponent: -2, unit: 's' } 
}

# Power (Watt = kg⋅m²/s³)
50J / 10s = 5 W
type: quantity, dimensions: { 
  mass: { exponent: 1, unit: 'kg' }, 
  length: { exponent: 2, unit: 'm' }, 
  time: { exponent: -3, unit: 's' } 
}

# Pressure (Pascal = kg/(m⋅s²))
100N / 0.1m² = 1000 Pa
type: quantity, dimensions: { 
  mass: { exponent: 1, unit: 'kg' }, 
  length: { exponent: -1, unit: 'm' }, 
  time: { exponent: -2, unit: 's' } 
}
```

### Electrical Units
```
# Voltage (Volt = kg⋅m²/(A⋅s³))
10W / 2A = 5 V
type: quantity, dimensions: { mass: 1, length: 2, time: -3, current: -1 }

# Resistance (Ohm = kg⋅m²/(A²⋅s³))
5V / 1A = 5 Ω
type: quantity, dimensions: { mass: 1, length: 2, time: -3, current: -2 }

# Charge (Coulomb = A⋅s)
2A * 5s = 10 C
type: quantity, dimensions: { current: 1, time: 1 }
```

## Benefits of Type-Constrained Units

### 1. Compile-Time Safety
```typescript
// TypeScript catches unit mismatches at compile time
dimensions: {
  length: { exponent: 1, unit: "kg" }, // Error: Type '"kg"' is not assignable to type 'LengthUnit'
}

// Valid assignment
dimensions: {
  length: { exponent: 1, unit: "m" },
  mass: { exponent: 1, unit: "kg" }
}
```

### 2. Better Developer Experience
- Autocomplete suggests valid units for each dimension
- Clear type errors when units are mismatched
- Prevents accidental unit confusion

### 3. Maintainability
- Adding new units is explicit and controlled
- Unit definitions are centralized and typed
- Easier to track which units are supported for each dimension

## Implementation Steps

### 1. Dimension System with Conversion Tables (`src/evaluator/dimensions.ts`)
```typescript
// Conversion structure - how to convert FROM this unit TO base unit
type UnitConversion = {
  coefficient: number;  // Multiplication factor
  exponent?: number;    // Power of 10 (optional, defaults to 0)
  offset?: number;      // For temperature conversions (optional)
};

// All conversions are TO the base unit (meters for length, kg for mass, etc.)
const LENGTH_CONVERSIONS: Record<LengthUnit, UnitConversion> = {
  // Base unit
  'm': { coefficient: 1 },
  // Metric
  'km': { coefficient: 1, exponent: 3 },
  'cm': { coefficient: 1, exponent: -2 },
  'mm': { coefficient: 1, exponent: -3 },
  // Imperial
  'ft': { coefficient: 0.3048 },
  'in': { coefficient: 0.0254 },
  'yd': { coefficient: 0.9144 },
  'mi': { coefficient: 1609.34 },
};

const MASS_CONVERSIONS: Record<MassUnit, UnitConversion> = {
  // Base unit
  'kg': { coefficient: 1 },
  // Metric
  'g': { coefficient: 1, exponent: -3 },
  'mg': { coefficient: 1, exponent: -6 },
  't': { coefficient: 1, exponent: 3 },
  // Imperial
  'lb': { coefficient: 0.453592 },
  'oz': { coefficient: 0.0283495 },
};

const TIME_CONVERSIONS: Record<TimeUnit, UnitConversion> = {
  // Base unit
  's': { coefficient: 1 },
  'ms': { coefficient: 1, exponent: -3 },
  'min': { coefficient: 60 },
  'h': { coefficient: 3600 },
  'day': { coefficient: 86400 },
  'week': { coefficient: 604800 }, // 7 * 86400
  'month': { coefficient: 2629800 }, // Average month in seconds
  'year': { coefficient: 31557600 }, // Average year in seconds
};

const TEMPERATURE_CONVERSIONS: Record<TemperatureUnit, UnitConversion> = {
  // Base unit (Kelvin)
  'K': { coefficient: 1 },
  'C': { coefficient: 1, offset: 273.15 },
  'F': { coefficient: 5/9, offset: 459.67 },
};

const CURRENT_CONVERSIONS: Record<CurrentUnit, UnitConversion> = {
  // Base unit
  'A': { coefficient: 1 },
  'mA': { coefficient: 1, exponent: -3 },
  'μA': { coefficient: 1, exponent: -6 },
};

const ANGLE_CONVERSIONS: Record<AngleUnit, UnitConversion> = {
  // Base unit
  'rad': { coefficient: 1 },
  'deg': { coefficient: Math.PI / 180 },
  '°': { coefficient: Math.PI / 180 },
};

// Base units for each dimension
const BASE_UNITS: Record<keyof DimensionMap, string> = {
  length: 'm',
  mass: 'kg',
  time: 's',
  current: 'A',
  temperature: 'K',
  amount: 'mol',
  luminosity: 'cd',
  angle: 'rad',
  currency: 'USD', // Default base currency
};

// Helper to get conversion table for a dimension
function getConversionTable(dimension: keyof DimensionMap): Record<string, UnitConversion> {
  switch (dimension) {
    case 'length': return LENGTH_CONVERSIONS;
    case 'mass': return MASS_CONVERSIONS;
    case 'time': return TIME_CONVERSIONS;
    case 'current': return CURRENT_CONVERSIONS;
    case 'temperature': return TEMPERATURE_CONVERSIONS;
    case 'angle': return ANGLE_CONVERSIONS;
    case 'amount': return { mol: { coefficient: 1 } }; // Only one unit
    case 'luminosity': return { cd: { coefficient: 1 } }; // Only one unit
    case 'currency': return getCurrencyConversions(); // Dynamic
    default: throw new Error(`Unknown dimension: ${dimension}`);
  }
}

// Currency conversions follow the same pattern but are fetched dynamically
async function getCurrencyConversions(): Promise<Record<CurrencyCode, UnitConversion>> {
  // Use existing CurrencyManager from src/utils/currency-manager.ts
  const currencyManager = CurrencyManager.getInstance();
  const rates = await currencyManager.getRates();
  
  // Build conversion table where USD is the base unit
  const conversions: Record<string, UnitConversion> = {
    'USD': { coefficient: 1 }, // Base currency
  };
  
  // Add all other currencies relative to USD
  // Note: rates are typically "how many units of X per 1 USD"
  for (const [currency, ratePerUSD] of Object.entries(rates)) {
    conversions[currency] = { coefficient: ratePerUSD };
  }
  
  return conversions;
}

// Example currency conversion table (dynamically fetched):
// {
//   'USD': { coefficient: 1 },        // Base
//   'EUR': { coefficient: 0.92 },     // 1 EUR = 1/0.92 USD
//   'GBP': { coefficient: 0.79 },     // 1 GBP = 1/0.79 USD
//   'JPY': { coefficient: 149.5 },    // 1 JPY = 1/149.5 USD
//   'CNY': { coefficient: 7.24 },     // 1 CNY = 1/7.24 USD
//   ...
// }

// Conversion function
function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
  dimension: keyof DimensionMap
): number {
  if (fromUnit === toUnit) return value;
  
  const conversions = getConversionTable(dimension);
  const fromConv = conversions[fromUnit];
  const toConv = conversions[toUnit];
  
  if (!fromConv || !toConv) {
    throw new Error(`Unknown unit: ${!fromConv ? fromUnit : toUnit}`);
  }
  
  // Convert to base unit first
  const { coefficient: fromCoef, exponent: fromExp = 0, offset: fromOffset = 0 } = fromConv;
  const baseValue = (value + fromOffset) * fromCoef * Math.pow(10, fromExp);
  
  // Then convert from base unit to target
  const { coefficient: toCoef, exponent: toExp = 0, offset: toOffset = 0 } = toConv;
  return baseValue / (toCoef * Math.pow(10, toExp)) - toOffset;
}

// Example conversions:
// 1000m to km:
//   to base: 1000 * 1 = 1000m
//   from base: 1000 / (1 * 10^3) = 1 km
// 
// 5mi to km:
//   to base: 5 * 1609.34 = 8046.7m
//   from base: 8046.7 / (1 * 10^3) = 8.0467 km
//
// 32°F to °C:
//   to base: (32 + 459.67) * 5/9 = 273.15K
//   from base: 273.15 / 1 - 273.15 = 0°C
```

### 2. Unit Parser Enhancement (`src/parser/unit-parser.ts`)
- Parse compound unit expressions: `m/s`, `kg*m/s^2`, `kg⋅m⋅s^-2`
- Support exponents: `m^2`, `s^-1`, `m²`, `s⁻¹`
- Handle parentheses: `kg*(m/s)^2`
- Unicode support: `Ω`, `μA`, `m³`

### 3. Dimensional Arithmetic (`src/evaluator/dimensional-arithmetic.ts`)
```typescript
// Multiply dimensions
function multiplyDimensions(a: DimensionMap, b: DimensionMap): DimensionMap {
  const result: DimensionMap = {};
  
  // Copy dimensions from a
  for (const [dim, info] of Object.entries(a)) {
    result[dim] = { ...info };
  }
  
  // Add exponents from b
  for (const [dim, info] of Object.entries(b)) {
    if (result[dim]) {
      result[dim].exponent += info.exponent;
      // Keep the unit from the first operand, or update if not set
      if (!result[dim].unit && info.unit) {
        result[dim].unit = info.unit;
      }
    } else {
      result[dim] = { ...info };
    }
  }
  
  // Remove dimensions with zero exponents
  for (const dim of Object.keys(result)) {
    if (result[dim].exponent === 0) {
      delete result[dim];
    }
  }
  
  return result;
}

// Divide dimensions
function divideDimensions(a: DimensionMap, b: DimensionMap): DimensionMap {
  const result: DimensionMap = {};
  
  // Copy dimensions from a
  for (const [dim, info] of Object.entries(a)) {
    result[dim] = { ...info };
  }
  
  // Subtract exponents from b
  for (const [dim, info] of Object.entries(b)) {
    if (result[dim]) {
      result[dim].exponent -= info.exponent;
    } else {
      result[dim] = { 
        exponent: -info.exponent,
        unit: info.unit
      };
    }
  }
  
  // Remove dimensions with zero exponents
  for (const dim of Object.keys(result)) {
    if (result[dim].exponent === 0) {
      delete result[dim];
    }
  }
  
  return result;
}

// Check if dimensions are compatible (for addition/subtraction)
function areDimensionsCompatible(a: DimensionMap, b: DimensionMap): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  
  if (keysA.length !== keysB.length) return false;
  
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (key !== keysB[i] || a[key].exponent !== b[key].exponent) {
      return false;
    }
  }
  
  return true;
}
```

### 4. Smart Unit Display (`src/evaluator/unit-formatter.ts`)
```typescript
// Find the best unit to display given dimensions
function findBestUnit(dimensions: DimensionMap): string | undefined {
  // Check for exact matches with derived units
  for (const [unit, dims] of Object.entries(DERIVED_UNITS)) {
    if (dimensionsEqual(dimensions, dims)) {
      return unit;
    }
  }
  
  // Build compound unit string
  return buildCompoundUnitString(dimensions);
}

// Format compound units nicely
function buildCompoundUnitString(dimensions: DimensionMap): string {
  const positive: string[] = [];
  const negative: string[] = [];
  
  for (const [dim, exp] of Object.entries(dimensions)) {
    const baseUnit = getBaseUnitSymbol(dim);
    if (exp > 0) {
      positive.push(exp === 1 ? baseUnit : `${baseUnit}^${exp}`);
    } else {
      negative.push(exp === -1 ? baseUnit : `${baseUnit}^${-exp}`);
    }
  }
  
  if (negative.length === 0) {
    return positive.join('⋅');
  } else if (positive.length === 0) {
    return `1/${negative.join('⋅')}`;
  } else {
    return `${positive.join('⋅')}/${negative.join('⋅')}`;
  }
}
```

### 5. Update Evaluator

#### Arithmetic Operations
```typescript
// Multiplication
quantity * quantity → quantity with multiplied dimensions
quantity * number → quantity with same dimensions

// Division  
quantity / quantity → quantity with divided dimensions
quantity / number → quantity with same dimensions

// Addition/Subtraction
quantity + quantity → only if dimensions match (with unit conversion)
quantity + number → error

// Exponentiation
quantity ^ number → quantity with scaled dimensions
```

#### Type Checking Updates
```
10 m/s is velocity → true
10 m/s is quantity → true
10 N is force → true
10 J is energy → true
type(10 m/s) → "velocity" or "quantity"
```

### 6. Conversion System
```typescript
// Convert between units with same dimensions
10 m/s to km/h → 36 km/h
1 kWh to J → 3.6e6 J
1 bar to Pa → 100000 Pa

// Error on incompatible conversions
10 m/s to kg → Error: Cannot convert velocity to mass

// Compound unit conversion algorithm
function convertCompoundUnit(
  value: number,
  fromDimensions: DimensionMap,
  toDimensions: DimensionMap
): number {
  // Check dimension compatibility
  if (!areDimensionsCompatible(fromDimensions, toDimensions)) {
    throw new Error('Incompatible dimensions');
  }
  
  let result = value;
  
  // Convert each dimension
  for (const [dim, fromInfo] of Object.entries(fromDimensions)) {
    const toInfo = toDimensions[dim];
    if (fromInfo.unit && toInfo.unit && fromInfo.unit !== toInfo.unit) {
      // Convert the base unit
      const conversionFactor = convertUnit(1, fromInfo.unit, toInfo.unit, dim);
      // Apply the exponent
      result *= Math.pow(conversionFactor, fromInfo.exponent);
    }
  }
  
  return result;
}

// Example: Convert 10 m/s to km/h
// fromDimensions: { length: { exponent: 1, unit: 'm' }, time: { exponent: -1, unit: 's' } }
// toDimensions: { length: { exponent: 1, unit: 'km' }, time: { exponent: -1, unit: 'h' } }
// Step 1: Convert m to km: 1m = 0.001km, so factor = 0.001^1 = 0.001
// Step 2: Convert s to h: 1s = 1/3600h, so factor = (1/3600)^-1 = 3600
// Result: 10 * 0.001 * 3600 = 36 km/h
```

## New Features

### 1. Unit Expressions in Input
```
# Direct unit math
m/s → creates velocity unit template
kg*m/s^2 → creates force unit template

# Using in calculations
distance = 100m
time = 10s
velocity = distance/time  # 10 m/s

# Unit conversion syntax
10 m/s to km/h
1 kWh to J
```

### 2. Predefined Constants
```
g = 9.81 m/s²  # Standard gravity
c = 299792458 m/s  # Speed of light
h = 6.626e-34 J⋅s  # Planck constant
e = 1.602e-19 C  # Elementary charge
```

### 3. Type Checking for Quantities
```
# New type checks
10 m/s is velocity → true
10 N is force → true
10 J is energy → true
10 W is power → true

# Dimension checking
10 m/s has dimensions length/time → true
10 N has dimensions mass*length/time² → true
```

## Migration Strategy

1. **Backward Compatibility**:
   - Simple units (10m, 5kg) still work
   - Existing calculations unchanged
   - New features are additive

2. **Gradual Rollout**:
   - Phase 1: Basic compound units (m/s, m²)
   - Phase 2: Standard derived units (N, J, W)
   - Phase 3: Full dimensional analysis

3. **Documentation**:
   - Tutorial for scientific calculations
   - Examples of common conversions
   - Dimension reference guide

## Testing Strategy

1. **Dimension Math Tests**:
   - Multiplication/division of dimensions
   - Compatibility checking
   - Edge cases (zero exponents)

2. **Unit Parser Tests**:
   - Complex unit expressions
   - Unicode symbols
   - Error cases

3. **Conversion Tests**:
   - Same-dimension conversions
   - Error on incompatible conversions
   - Precision preservation

4. **Display Tests**:
   - Smart unit selection
   - Compound unit formatting
   - User preferences

## Performance Considerations

1. **Caching**:
   - Cache dimension lookups
   - Memoize unit conversions
   - Precompute common operations

2. **Optimization**:
   - Fast dimension comparison
   - Efficient unit parsing
   - Minimal allocation in hot paths

## Future Extensions

1. **Custom Units**:
   ```
   define mph = miles/hour
   define kph = km/hour
   ```

2. **Unit Aliases**:
   ```
   Newton = N = kg⋅m/s²
   Joule = J = N⋅m = kg⋅m²/s²
   ```

3. **Uncertainty Propagation**:
   ```
   10.0±0.1 m / 2.0±0.05 s = 5.0±0.15 m/s
   ```

4. **Vector Quantities**:
   ```
   velocity = [10, 5, 0] m/s
   force = [0, -9.81, 0] N
   ```

## Success Criteria

1. Compound units work naturally: `100m / 10s = 10 m/s`
2. Dimensional analysis prevents errors: `10m + 5s` → Error
3. Common units recognized: `10 kg⋅m/s²` displays as `10 N`
4. Conversions work across equivalent units
5. Performance remains good (< 10% slowdown)
6. All existing tests pass
7. Clear error messages for dimension mismatches

## Estimated Effort

- Dimension system: 3-4 hours
- Unit parser: 2-3 hours
- Dimensional arithmetic: 2-3 hours
- Smart display: 2 hours
- Evaluator updates: 4-5 hours
- Testing: 3-4 hours
- Documentation: 2 hours
- Total: ~20 hours

## Version Notes

This will be version 1.3.9, building on the type checking features from 1.3.1 and preparing the calculator for scientific and engineering use cases.