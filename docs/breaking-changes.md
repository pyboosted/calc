# Breaking Changes

## Version 1.5.0

### Major Enhancement

- **Arbitrary Precision Arithmetic**: All numeric calculations now use Decimal.js for arbitrary precision
  - No more floating point errors: `0.1 + 0.2` now equals exactly `0.3`
  - Support for numbers beyond JavaScript's MAX_SAFE_INTEGER
  - Precision is preserved through all operations, including unit conversions and currency calculations
  - Internal precision is 40 significant digits
  - Display precision is configurable via config file (default: 2 decimal places)

### Technical Changes

- All numeric values in `CalculatedValue` types now use `Decimal` instead of `number`
- The `fromDecimal()` and `toDecimal()` utilities are used for conversions when needed
- All mathematical operations use Decimal.js methods instead of JavaScript operators
- Unit conversions and currency calculations maintain full precision throughout

### Migration Notes

- This is largely a transparent upgrade - existing calculations will work as before but with better precision
- The only visible change is improved accuracy in calculations that previously suffered from floating point errors
- Display formatting remains the same, controlled by the precision setting in config

## Version 1.4.8 (Upcoming)

### Breaking Changes

- `sum` and `avg`/`average` are no longer aggregate keywords
- These functions now work only as array functions: `sum([1, 2, 3])`
- For aggregate operations over previous results, use the pipe operator with `agg`:
  - Old: `sum` → New: `agg | sum`
  - Old: `avg` or `average` → New: `agg | avg` or `agg | average`

### Migration Guide

If you have calculations that use `sum` or `avg`/`average` as aggregate keywords:

```
# Old syntax (no longer works as aggregate)
10
20
30
sum      # This would now error

# New syntax using pipe operator
10
20
30
agg | sum      # 60
```

The `total` keyword continues to work as before for summing previous results.

### New Features

- **Smart Time Formatting**: Fractional time values now display in compound format
  - `2.5 hours` displays as `2h 30min`
  - `3.5 months` displays as `3mo 15d 5h 15min`
  - Weeks are excluded from compound format unless the base unit is weeks
  - Whole numbers remain in their original unit (e.g., `150 minutes` stays as is)

## Version 1.4.0

- Complete overhaul of the unit system to support dimensional analysis
- Numbers with units now use the `quantity` type with dimensional tracking
- Removed backward compatibility with the old unit system
- All unit operations now perform dimensional analysis and validation

### Migration Guide

The new dimensional analysis system provides more accurate physics calculations and compound unit support. If you have existing calculations that rely on the old unit system:

1. Simple unit conversions still work the same way: `100 cm to m`
2. Compound units now use proper notation: `m/s`, `kg*m/s²`, `W/m²`
3. Unit arithmetic now tracks dimensions: `10 m * 5 m = 50 m²`
4. Invalid operations are now caught: `10 m + 5 kg` will error

See the [examples](examples.md#dimensional-analysis-v140) for detailed usage of the new system.