# Compound Time Format Implementation

## Overview
Implemented compound time formatting for the calculator to display time durations in a human-readable format like "2h 30min" instead of decimal values like "2.5 hours".

## Behavior
1. **Fractional time values** are displayed in compound format:
   - `2.5 hours` → `2h 30min`
   - `1.5 hours` → `1h 30min`
   - `90.5 minutes` → `1h 30min 30s`

2. **Whole number time values** remain in their original unit:
   - `150 minutes` → `150 minutes`
   - `3600 seconds` → `3600 seconds`
   - `24 hours` → `24 hours`

3. **Time arithmetic** that results in fractional values uses compound format:
   - `2 hours + 30 minutes` → `2h 30min`
   - `1 day + 12 hours + 30 minutes` → `1d 12h 30min`

4. **Explicit conversions** preserve the target unit:
   - `150 minutes to seconds` → `9000 seconds`
   - `150 minutes to hours` → `2h 30min` (fractional result)

## Implementation Details
- Added `formatTimeDuration()` function in `src/evaluator/unit-formatter.ts`
- Modified `formatQuantity()` to use compound format for fractional time values
- Supports days, hours, minutes, and seconds with appropriate precision
- Handles negative durations with proper sign display
- Only shows non-zero components (e.g., `2d 45s` omits hours and minutes)

## Examples
```calc
# Addition with compound format
2 hours + 30 minutes    # 2h 30min

# Fractional hours
1.5 hours               # 1h 30min

# Whole numbers stay as-is
90 minutes              # 90 minutes

# Explicit conversion
150 minutes to seconds  # 9000 seconds

# Complex calculation
x = 2
x * 1 hour + 30 minutes # 2h 30min
```