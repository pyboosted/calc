# Plan for v1.5.0 - Arbitrary Precision Arithmetic

## Overview
Version 1.5.0 introduces Decimal.js for arbitrary precision arithmetic throughout the calculator, eliminating floating point errors and supporting calculations with numbers beyond JavaScript's limitations.

## Completed Tasks

### 1. Core Integration
- ✅ Added Decimal.js as a dependency
- ✅ Created decimal-math.ts utility module with all mathematical operations
- ✅ Configured Decimal.js for 40 significant digits of precision

### 2. Type System Updates
- ✅ Updated CalculatedValue types to use Decimal instead of number
- ✅ Modified all numeric types (number, percentage, quantity) to use Decimal values
- ✅ Added fromDecimal() and toDecimal() conversion utilities

### 3. Evaluator Updates
- ✅ Converted all arithmetic operations to use Decimal methods
- ✅ Updated all mathematical functions (sqrt, sin, cos, etc.) to use Decimal.js
- ✅ Modified string interpolation to handle Decimal values
- ✅ Updated type casting operations for Decimal compatibility

### 4. Unit System Updates
- ✅ Modified convertUnits() to accept and return Decimal values
- ✅ Updated all unit conversion calculations to use Decimal arithmetic
- ✅ Preserved precision through temperature conversions
- ✅ Updated currency conversions to maintain precision

### 5. Date/Time Integration
- ✅ Updated date arithmetic to use Decimal for time calculations
- ✅ Modified timezone offset calculations for precision

### 6. Test Suite Updates
- ✅ Updated all tests to work with Decimal values
- ✅ Added specific tests for precision edge cases
- ✅ Fixed test assertions to use fromDecimal() for numeric comparisons
- ✅ All 860 tests passing

### 7. Code Quality
- ✅ Fixed all TypeScript type errors
- ✅ Resolved all linting warnings
- ✅ Cleaned up console output from tests
- ✅ Maintained consistent code style

## Benefits

1. **Accuracy**: No more floating point errors (0.1 + 0.2 = 0.3 exactly)
2. **Large Numbers**: Support for numbers beyond MAX_SAFE_INTEGER
3. **Financial Calculations**: Perfect for currency and percentage calculations
4. **Scientific Computing**: Maintains precision through complex calculations
5. **Unit Conversions**: No precision loss during conversions

## Technical Details

- Internal precision: 40 significant digits
- Display precision: Configurable (default 2 decimal places)
- All operations preserve maximum precision internally
- Formatting only applies when displaying results

## Impact

This is largely a transparent upgrade. Users will notice:
- More accurate results in edge cases
- No unexpected rounding errors
- Better handling of very large or very small numbers
- Consistent precision across all operations