# Configuration

The calculator stores its configuration in `~/.config/boomi/config.yaml`. The file is created automatically on first run with default values.

## Available Options

- **precision**: Number of decimal places for results (default: 2, range: 0-20)

## Example config.yaml

```yaml
# Boosted Calculator Configuration
# precision: Number of decimal places for results (default: 2)

precision: 4
```

## File Locations

- Configuration: `~/.config/boomi/config.yaml`
- Currency cache: `~/.config/boomi/currency_cache.json`

The calculator will automatically create these directories and files on first run if they don't exist.