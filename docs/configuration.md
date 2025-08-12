# Configuration

The calculator stores its configuration in `~/.config/calc/config.yaml`. The file is created automatically on first run with default values.

## Available Options

- **precision**: Number of decimal places for results (default: 2, range: 0-20)
- **markdownSupport**: Enable markdown rendering for invalid expressions (default: true, v1.5.3)

## Example config.yaml

```yaml
# Boosted Calculator Configuration
# precision: Number of decimal places for results (default: 2)
# markdownSupport: Enable markdown rendering for invalid expressions (default: true)

precision: 4
markdownSupport: true
```

## File Locations

- Configuration: `~/.config/calc/config.yaml`
- Currency cache: `~/.config/calc/currencies.json`

The calculator will automatically create these directories and files on first run if they don't exist.
