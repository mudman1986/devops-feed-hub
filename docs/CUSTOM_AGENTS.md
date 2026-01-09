# Custom Agents Guide

This guide explains the custom agents available for the DevOps Feed Hub project and how to use them effectively.

## What are Custom Agents?

Custom agents are specialized AI assistants with domain-specific knowledge and instructions. They appear as tools that Copilot can use to delegate specialized tasks.

## Benefits of Custom Agents

1. **Domain Expertise**: Specialized knowledge for specific tasks
2. **Consistency**: Follow established patterns and conventions
3. **Efficiency**: Faster completion of specialized tasks
4. **Quality**: Higher quality results for domain-specific work
5. **Scalability**: Handle complex tasks in their area of expertise

## Available Custom Agents

### 1. Refactoring Agent

**Location**: `.github/agents/refactor.md`

**Specialization**: Code refactoring and quality improvement

**Use When**:
- Simplifying complex code
- Reducing code duplication
- Improving code organization
- Extracting reusable components
- Moving inline code to scripts

**Capabilities**:
- Identify code smells
- Apply DRY principles
- Extract functions and modules
- Improve naming conventions
- Reduce complexity

**Example Usage**:
```
@copilot using the refactor agent, please refactor the collect_feeds.py 
module to reduce complexity and improve readability
```

### 2. Linting and Testing Validation Agent

**Location**: `.github/agents/linting-testing-validation.md`

**Specialization**: Pre-PR validation of linting and tests

**Use When**:
- Before submitting a PR
- After making code changes
- When CI/CD checks fail
- During code review feedback

**Capabilities**:
- Run super-linter locally
- Execute all test suites
- Auto-fix common linting issues
- Verify all checks pass
- Provide validation report

**Example Usage**:
```
@copilot using the linting and testing validation agent, please ensure
all linters and tests pass before I submit this PR
```

### 3. UI/UX Review Agent

**Location**: `.github/agents/ui-ux-review.md`

**Specialization**: User interface and experience review

**Use When**:
- Adding new UI features
- Improving responsive design
- Conducting accessibility audits
- Optimizing user workflows
- Before major releases

**Capabilities**:
- Test responsive design (desktop, tablet, mobile)
- Validate accessibility (WCAG compliance)
- Review visual consistency
- Optimize user interactions
- Capture screenshots
- Update UI tests

**Example Usage**:
```
@copilot using the UI/UX review agent, please review the responsive
design of the new feed filter controls on mobile devices
```

## How to Use Custom Agents

### Delegating to a Custom Agent

When you have a task that matches a custom agent's expertise:

1. **Identify the right agent**: Match task to agent specialization
2. **Provide context**: Give the agent necessary information
3. **Be specific**: Clear instructions lead to better results
4. **Trust the agent**: Let it use its specialized knowledge

### Example Delegation

**Good**:
```
@copilot using the refactor agent, please refactor the generate_summary.py
module. Focus on extracting the HTML generation logic into separate
functions and reducing the complexity of the main function.
```

**Not as good**:
```
@copilot refactor generate_summary.py
```

### When NOT to Use Custom Agents

- When the task is outside the agent's specialization
- When a simple change doesn't need specialized expertise
- When you just need information or advice (agents do the work)

## Agent Selection Guide

| Task | Recommended Agent | Why |
|------|-------------------|-----|
| Simplify complex function | Refactoring | Specialized in code organization |
| Fix linting errors | Linting/Testing | Knows all linter requirements |
| Test responsive design | UI/UX Review | Tests all screen sizes |
| Extract inline scripts | Refactoring | Knows script best practices |
| Validate before PR | Linting/Testing | Runs all validations |
| Improve accessibility | UI/UX Review | Knows WCAG standards |
| Reduce duplication | Refactoring | Applies DRY principles |
| Fix failing tests | Linting/Testing | Runs and debugs tests |
| Review mobile layout | UI/UX Review | Tests mobile devices |

## Creating New Custom Agents

### When to Create a New Agent

Consider creating a custom agent when:

1. **Specialized knowledge**: Task requires domain expertise
2. **Repetitive work**: Same type of task performed frequently
3. **Complex requirements**: Many rules and conventions to follow
4. **Quality critical**: Specialized review improves outcomes
5. **Teachable**: Instructions can be documented clearly

### Agent Creation Process

1. **Define scope**: What does this agent specialize in?
2. **Document expertise**: What knowledge does it need?
3. **Write instructions**: Clear, actionable guidelines
4. **Include examples**: Show best practices
5. **Test the agent**: Verify it works as expected

### Agent Template

```markdown
# [Agent Name] Agent

[Brief description of what this agent does]

## Primary Objectives

1. Objective 1
2. Objective 2
3. Objective 3

## [Agent Specialization] Process

### Step 1: [Phase Name]
- Task 1
- Task 2

### Step 2: [Phase Name]
- Task 1
- Task 2

## Best Practices

- Practice 1
- Practice 2

## Quality Checks

- [ ] Check 1
- [ ] Check 2

## When to Use This Agent

- Scenario 1
- Scenario 2

## Success Criteria

This agent is successful when:
1. Criterion 1
2. Criterion 2
```

### Location

Save custom agents in `.github/agents/[agent-name].md`

## Proposed Future Agents

### 1. End-to-End Testing Agent

**Specialization**: Comprehensive workflow testing

**Would handle**:
- Test complete user workflows
- Validate RSS feed collection process
- Test GitHub Pages deployment
- Verify all integrations work

**Priority**: Medium

### 2. Security Review Agent

**Specialization**: Security vulnerability assessment

**Would handle**:
- CodeQL analysis
- Dependency vulnerability checks
- Secret scanning
- Security best practices validation

**Priority**: High (consider implementing)

### 3. Documentation Agent

**Specialization**: Technical documentation

**Would handle**:
- Update README files
- Generate API documentation
- Write code comments
- Maintain changelog

**Priority**: Low (current docs are minimal by design)

### 4. Performance Optimization Agent

**Specialization**: Code and workflow performance

**Would handle**:
- Identify performance bottlenecks
- Optimize RSS feed fetching
- Improve page load times
- Optimize workflow execution

**Priority**: Low (performance is currently adequate)

## Best Practices

### For Agent Users

1. **Choose the right agent**: Match task to specialization
2. **Provide clear context**: Give agent necessary information
3. **Trust the agent**: Let it apply its expertise
4. **Review results**: Verify agent's work makes sense

### For Agent Creators

1. **Be specific**: Clear, actionable instructions
2. **Include examples**: Show best practices
3. **Define success**: Clear success criteria
4. **Keep updated**: Maintain as project evolves

## Integration with Copilot Instructions

Custom agents complement the main Copilot instructions:

- **Main instructions**: General coding principles and standards
- **Path-specific instructions**: File type specific guidance
- **Custom agents**: Specialized task delegation

All work together to provide comprehensive assistance.

## Maintenance

### Updating Agents

Update agent instructions when:
- New tools or libraries are added
- Best practices change
- Project requirements evolve
- Agent feedback suggests improvements

### Deprecating Agents

Remove agents when:
- Specialization is no longer needed
- Better tools exist
- Maintenance burden is too high
- Project scope changes

## Resources

- [GitHub Custom Agents Documentation](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-custom-agents)
- [Creating Custom Agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- [Configuration Reference](https://docs.github.com/en/copilot/reference/custom-agents-configuration)

## Conclusion

Custom agents provide specialized expertise for common tasks in this project. Use them to improve quality, consistency, and efficiency. The current agents (Refactoring, Linting/Testing, UI/UX) cover the most critical areas.

**Recommendation**: Start using the existing agents consistently before adding new ones. Monitor which tasks benefit most from agent delegation.
