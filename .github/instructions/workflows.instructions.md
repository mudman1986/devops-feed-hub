---
applyTo: ".github/workflows/*.yml,.github/workflows/*.yaml"
---

# GitHub Workflows Development

## Standards

- Keep workflows focused and single-purpose
- Use composite actions for reusability
- Never hardcode sensitive data (use secrets)
- Always verify workflows execute successfully after changes

## Shell Scripts

- Prefer separate script files over inline bash
- Quote all variables: `"$VAR"` not `$VAR`
- Extract complex logic to `.github/scripts/`

## Permissions

- Use minimal required permissions
- Explicitly declare needed permissions
- Use GITHUB_TOKEN for repository operations
