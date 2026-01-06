# Copilot Instructions for Mudman1986 Repository

## Code Quality Standards

### Continuous Refactoring
- **Always refactor and improve**: With each change to the codebase, actively look for opportunities to refactor and improve existing code
- **Avoid patch-over-patch mentality**: Don't just add patches on top of existing code; take time to refactor and improve the underlying structure
- **Code review mindset**: Before adding new code, evaluate if existing code can be simplified or improved
- **Clean code principles**: Favor clean, maintainable solutions over quick fixes
- **Technical debt**: Address technical debt proactively rather than accumulating it

### Use Open Source Packages
- **Check for existing solutions**: Before writing custom code, always check if there are open source packages that solve the problem
- **Package quality standards**: When selecting open source packages, ensure they meet these criteria:
  - **Open source license**: Package must have a proper open source license (MIT, Apache, GPL, etc.)
  - **Active maintenance**: Regularly updated with recent commits and releases
  - **Community adoption**: Widely used with good download statistics and GitHub stars
  - **Good documentation**: Clear documentation and examples
  - **Security**: No known critical vulnerabilities, actively maintained security patches
  - **Compatibility**: Works with our technology stack and versions
- **Avoid reinventing the wheel**: Use battle-tested solutions instead of custom implementations when possible
- **Balance**: Custom code is acceptable when no suitable package exists or when packages add unnecessary complexity

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

### Documentation Guidelines
- **Prefer compact documentation**: Use inline comments and concise documentation over extensive README files
- **Inline comments**: Document complex logic directly in code with clear, concise comments
- **Minimal README files**: Keep README files brief and focused on essential information
- **Self-documenting code**: Write clear, readable code that minimizes the need for extensive documentation
- **Code over docs**: Prioritize writing clear code over writing extensive documentation

## Workflow and Action Development

### Best Practices
- Use composite actions for reusable workflow components
- Keep workflows focused and single-purpose
- Document all inputs, outputs, and environment variables
- Handle errors gracefully with appropriate error messages
- Use secrets and variables appropriately (never hardcode sensitive data)
- **Always verify workflows**: After making any changes, verify that all affected workflows still execute successfully

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
