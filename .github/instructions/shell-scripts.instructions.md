---
applyTo: "{.github/workflows/scripts/**/*.sh,scripts/**/*.sh}"
---

# Shell Script Development

## Code Style

- Use tabs for indentation (SHELL_SHFMT requirement)
- Quote all variables: `"$VAR"` not `$VAR`
- Include shebang: `#!/usr/bin/env bash`
- Set strict mode: `set -euo pipefail`

## Testing

- Write BATS tests in `scripts/test/test_*.bats`
- Test error conditions and edge cases
- Run: `bats scripts/test/test_*.bats`

## Best Practices

- Use functions for reusable code
- Validate inputs with clear error messages
- Exit with appropriate status codes
