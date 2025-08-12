# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript/TSX sources
  - `cli.tsx`: CLI entry; Ink app bootstrap
  - `ui/`: TUI components (React/Ink)
  - `parser/`, `evaluator/`: tokenizer/AST and execution engine
  - `utils/`: config, currency, decimals, dates, hotkeys
- `tests/`: Bun tests (`*.test.ts`)
- `docs/`: User/architecture docs
- `dist/`: Build output (bundled by tsup)

## Build, Test, and Development Commands
- Install: `bun install`
- Dev (hot reload): `bun dev` or `bun run src/cli.tsx`
- Build: `bun run build` (tsup → `dist/`)
- Tests: `bun test` (use `--watch` for TDD)
- Type check: `bun run typecheck`
- Lint/format: `bun run lint`, `bun run format`

## Coding Style & Naming Conventions
- Language: TypeScript (ESM), React/Ink for UI.
- Indentation: 2 spaces; avoid overly long lines and one-letter names.
- Files: components `PascalCase.tsx` (e.g., `Calculator.tsx`), modules/utilities `kebab-case.ts` (e.g., `input-line.tsx`).
- Tests: `kebab-case.test.ts` under `tests/` with descriptive suite names.
- Tools: Biome + Ultracite for lint/format; run before PRs.

## Testing Guidelines
- Framework: Bun test runner.
- Place new tests in `tests/` mirroring feature scope; aim for deterministic, unit-first tests.
- Config behavior: in tests (`NODE_ENV=test`) config loads legacy path if present and resets defaults; keep tests hermetic (do not depend on user config).
- Currency: network calls are not required; loader has fallback—prefer stubbing update triggers in integration tests.

## Commit & Pull Request Guidelines
- Commits: small, focused, imperative subject lines (e.g., "Add unit formatter for binary/hex").
- Branches: `feat/...`, `fix/...`, `chore/...`.
- PRs: include clear description, rationale, screenshots/terminal output when UI/CLI changes affect UX, and tests/docs for new behavior. Link related issues.

## Security & Configuration Tips
- App config: `~/.config/calc/config.yaml`; currency cache: `~/.config/calc/currencies.json` (legacy `~/.config/boomi` auto-migrates).
- Do not commit secrets or local paths from home directories.
- Keep network usage optional; CLI should work offline with cached data.

