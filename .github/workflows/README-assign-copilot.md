# Copilot Issue Assignment Workflow

This document describes the `assign-copilot-issues.yml` workflow that automatically assigns issues to the Copilot bot.

## Overview

The workflow handles both weekly refactor tasks and daily issue assignment in a unified manner. It ensures that Copilot always has work to do while prioritizing refactor tasks over regular issues.

## Triggers

### 1. Issue Closure

When an issue is closed, the workflow waits for 5 minutes (grace period) before automatically assigning the next issue or creating a refactor issue.

**Refactor Scheduling**: The workflow uses the closed issue number to determine whether to create a refactor issue or assign a regular issue:

- If the issue number ends in **0 or 5** (e.g., #10, #15, #20, #25, #30): Creates a refactor issue
- Otherwise: Auto-assigns the next available regular issue

This ensures approximately every 5th issue triggers a refactor, maintaining a good balance between regular work and refactoring.

### 2. Manual Dispatch

The workflow can be triggered manually with the following options:

- **mode**: Choose between `auto` (assign next issue) or `refactor` (create refactor issue)
- **label**: Override the default priority and only search for issues with a specific label
- **force**: Force assignment even if Copilot is already assigned to an issue

## Issue Priority

Issues are assigned based on the following priority order:

1. **bug** - Highest priority
2. **documentation** - Second priority
3. **enhancement** - Third priority
4. **Other labels** - Issues without the above labels are considered last

## Assignment Rules

The workflow will **NOT** assign an issue if:

- Copilot is already assigned to another open issue (unless `force` is enabled)
- The issue has sub-issues (tracked issues)
- The issue is labeled with `refactor` (in auto mode, to avoid conflicts with weekly refactor)
- The issue is already assigned to someone else

## Workflow Logic

1. **Grace Period** (on issue closure): Wait 5 minutes to allow manual assignment
2. **Determine Mode**:
   - Manual dispatch: Use the specified mode
   - Issue closure: Check if issue number ends in 0 or 5
     - If yes: Use refactor mode (create refactor issue)
     - If no: Use auto mode (assign next regular issue)
3. **Check Existing Assignment**:
   - **Refactor mode**: If Copilot is busy (has any assigned issue), skip refactor creation to avoid disruption - will try with the next qualifying issue number
   - **Auto mode**: Skip if Copilot already has an issue (unless forced)
4. **Assign Issue**:
   - **Refactor mode**: Create a new refactor issue with predefined tasks
   - **Auto mode**: Find and assign the next available issue by priority

## Conflict Resolution

The workflow prevents conflicts between refactor and regular issue assignment using a simple, elegant approach:

1. **Issue number-based scheduling**: Refactor issues are created when a closed issue number ends in 0 or 5 (approximately every 5 issues)
2. **No disruption**: If Copilot is busy when it's time for a refactor, the refactor creation is skipped - it will be attempted again at the next qualifying issue number
3. **Refactor label distinction**: Refactor issues are labeled with `refactor`
4. **Auto mode skips refactor issues**: Auto mode skips issues with the `refactor` label to prevent circular assignment
5. **Sequential execution**: Only one assignment happens at a time (no parallel assignments)

This approach ensures a healthy mix of regular work and refactoring without complex scheduling or disrupting ongoing work.

## Required Secrets

- `COPILOT_ASSIGN_PAT`: Personal Access Token with permissions to assign issues to the Copilot bot

## Usage Examples

### Manually Trigger Weekly Refactor

```bash
gh workflow run assign-copilot-issues.yml -f mode=refactor
```

### Manually Assign a Bug Issue

```bash
gh workflow run assign-copilot-issues.yml -f mode=auto -f label=bug
```

### Force Assignment Even If Copilot Has an Issue

```bash
gh workflow run assign-copilot-issues.yml -f mode=auto -f force=true
```

## Migration from weekly-refactor.yml

The `weekly-refactor.yml` workflow has been integrated into `assign-copilot-issues.yml`. The old workflow is kept for backward compatibility but its schedule trigger is disabled. All functionality is now handled by the unified workflow.

## Troubleshooting

### Issue: Copilot is not being assigned

**Possible causes:**

1. Copilot is already assigned to another issue
2. No suitable issues are available (all are assigned, have sub-issues, or are refactor issues)
3. The PAT token lacks necessary permissions

**Solution:** Check the workflow logs for detailed information about why the assignment was skipped.

### Issue: Grace period is too short/long

The grace period is set to 5 minutes in the `wait-grace-period` job. To change this, modify the `sleep` duration in the workflow file:

```yaml
- name: Wait 5 minutes for manual assignment
  run: sleep 300 # Change 300 to desired seconds
```

## Related Files

- `.github/workflows/assign-copilot-issues.yml` - Main workflow file
- `.github/scripts/assign-copilot-issue.js` - Helper script (for potential future use)
- `.github/workflows/weekly-refactor.yml` - Legacy workflow (schedule disabled)
