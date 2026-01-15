# Copilot Issue Assignment Workflow

This document describes the `assign-copilot-issues.yml` workflow that automatically assigns issues to the Copilot bot.

## Overview

The workflow handles both weekly refactor tasks and daily issue assignment in a unified manner. It ensures that Copilot always has work to do while prioritizing refactor tasks over regular issues.

## Triggers

### 1. Scheduled Triggers

- **Daily at 10 AM UTC (Tuesday-Friday)**: Automatically assigns the next available issue to Copilot
- **Weekly on Monday at 9 AM UTC**: Creates a weekly refactor issue and assigns it to Copilot

**Note**: Auto-assignment is skipped on weekends (Saturday and Sunday) to ensure Copilot is available for Monday's refactor task.

### 2. Issue Closure

When an issue is closed, the workflow waits for 5 minutes (grace period) before attempting to assign the next issue. This allows manual assignment if needed.

**Important**: If an issue is closed on Saturday or Sunday, auto-assignment is skipped to preserve Copilot's availability for the Monday refactor task.

### 3. Manual Dispatch

The workflow can be triggered manually with the following options:

- **mode**: Choose between `auto` (assign next issue) or `refactor` (create refactor issue)
- **label**: Override the default priority and only search for issues with a specific label (`bug`, `documentation`, or `enhancement`)
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
   - Schedule at 9 AM on Monday: Use refactor mode
   - Schedule at 10 AM any day: Use auto mode
   - Issue closure: Use auto mode
3. **Check Existing Assignment**:
   - **Refactor mode**: If Copilot has a non-refactor issue, unassign it to make room for the refactor issue
   - **Auto mode**: Skip if Copilot already has an issue (unless forced)
4. **Assign Issue**:
   - **Refactor mode**: Create a new refactor issue with predefined tasks
   - **Auto mode**: Find and assign the next available issue by priority

## Conflict Resolution

The workflow prevents conflicts between weekly refactor and regular issue assignment by:

1. **Weekend blackout period**: Auto-assignment is skipped on weekends (both scheduled and issue-closure triggers) to ensure Copilot is available for Monday's refactor
2. **Scheduled separation**:
   - Refactor runs Monday at 9 AM UTC
   - Auto-assignment runs Tuesday-Friday at 10 AM UTC
3. **Refactor priority**: If Copilot is busy on Monday morning, the refactor issue creation is skipped (will try again next week)
4. **Refactor label distinction**: Weekly refactor issues are labeled with `refactor`
5. **Auto mode skips refactor issues**: Auto mode skips issues with the `refactor` label
6. **Sequential execution**: Only one assignment happens at a time (no parallel assignments)

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
