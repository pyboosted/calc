# Breaking Changes

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