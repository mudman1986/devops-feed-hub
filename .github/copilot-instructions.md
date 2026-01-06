# Copilot Instructions for Mudman1986 Repository

## Code Quality Standards

### Optimization and Refactoring
- **Always review and optimize**: With each change you make to the codebase, look for opportunities to optimize and refactor existing code
- **Code review mindset**: Before adding new code, check if existing code can be improved or simplified
- **Performance considerations**: Consider the performance implications of your changes

### DRY (Don't Repeat Yourself) and Modularity
- **Keep code DRY**: Avoid code duplication by extracting common functionality into reusable functions or modules
- **Modular design**: Break down complex functionality into smaller, focused, and reusable modules
- **Single responsibility**: Each function/module should have a single, well-defined purpose
- **Reusability**: Design components to be reusable across different parts of the codebase

### Scripts over Inline Code
- **Prefer scripts**: Use separate script files instead of inline code in workflows and actions
- **Maintainability**: Scripts are easier to test, debug, and maintain than inline code
- **Testing**: Separate scripts enable better unit testing and validation
- **Version control**: Scripts provide better visibility of changes through git diffs

### Testing Requirements
- **Add unit tests**: Create unit tests for all new functionality you develop
- **Test coverage**: Ensure critical paths and edge cases are covered
- **Test maintenance**: Update existing tests when modifying functionality
- **Test-driven approach**: Consider writing tests before implementing features when appropriate

## Workflow and Action Development

### Best Practices
- Use composite actions for reusable workflow components
- Keep workflows focused and single-purpose
- Document all inputs, outputs, and environment variables
- Handle errors gracefully with appropriate error messages
- Use secrets and variables appropriately (never hardcode sensitive data)

### Python Development
- Follow PEP 8 style guidelines
- Use type hints for function parameters and return values
- Include docstrings for all functions and modules
- Handle exceptions appropriately with specific error messages
- Use context managers (with statements) for file operations

### RSS Feed Workflow
- The RSS feed collector workflow runs on schedule and manual dispatch
- Output should be stored in formats suitable for both automation and GitHub Pages
- Maintain backward compatibility with existing outputs and summaries
- Keep the JSON output structure stable for consumers

## GitHub Pages

### Structure
- Use the `docs/` directory for GitHub Pages content
- Generate static HTML from dynamic data
- Ensure responsive design for mobile devices
- Include proper metadata and SEO tags

### Content Updates
- Automate content generation through GitHub Actions
- Commit generated content back to the repository when appropriate
- Use proper permissions for GitHub Actions to write to the repository
