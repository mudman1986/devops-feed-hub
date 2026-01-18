# Copilot Issue Assignment Workflow

This document describes the `assign-copilot-issues.yml` workflow that automatically assigns issues to the Copilot bot.

## Overview

The workflow handles both weekly refactor tasks and daily issue assignment in a unified manner. It ensures that Copilot always has work to do while prioritizing refactor tasks over regular issues.

## Triggers

### 1. Daily Schedule

Runs daily at 10 AM UTC to ensure Copilot always has work assigned. This acts as a "jumpstart" mechanism:

- If Copilot is already assigned to an issue: Skips (no action)
- If Copilot is not assigned and suitable issues exist: Auto-assigns the next issue by priority
- If Copilot is not assigned and no suitable issues exist: Creates a refactor issue

### 2. Issue Closure

When an issue is closed, the workflow waits for 5 minutes (grace period) before automatically assigning the next issue or creating a refactor issue.

**Refactor Scheduling**: The workflow checks the labels of recently closed issues to maintain a configurable ratio of refactor work:

- Checks the last **N closed issues** (configurable via `refactor_threshold` input, default: 4)
- If **none** of those N issues have the `refactor` label: Triggers refactor mode
- Otherwise: Auto-assigns the next available regular issue

With the default threshold of 4, this ensures approximately 1 out of every 5 issues closed will trigger refactor work (1 in 5 ratio), maintaining a healthy balance between regular development and code maintenance. You can adjust this ratio by changing the `refactor_threshold` parameter when manually triggering the workflow.

**Note**: The `refactor` label must exist in your repository for this workflow to function properly.

### 3. Manual Dispatch

The workflow can be triggered manually with the following options:

- **mode**: Choose between `auto` (assign next issue) or `refactor` (create refactor issue)
- **label**: Override the default priority and only search for issues with a specific label
- **force**: Force assignment even if Copilot is already assigned to an issue
- **dry_run**: Log what would be done without making actual changes (default: false)
- **allow_parent_issues**: Allow assigning issues that have sub-issues (default: false)
- **skip_labels**: Comma-separated list of labels to skip (default: "no-ai,refining")
- **refactor_threshold**: Number of closed issues to check for refactor label (default: 4, means 1 in 5 ratio)

## Issue Priority

Issues are assigned based on the following priority order:

1. **bug** - Highest priority
2. **documentation** - Second priority
3. **refactor** - Third priority
4. **enhancement** - Fourth priority
5. **Other labels** - Issues without the above labels are considered last

## Assignment Rules

The workflow will **NOT** assign an issue if:

- Copilot is already assigned to another open issue (unless `force` is enabled)
- The issue has sub-issues (open or closed), unless `allow_parent_issues` is enabled
  - **Implementation**: Uses GitHub's GraphQL API `trackedIssues.totalCount` to detect any sub-issues
  - **Rationale**: Parent issues should typically be broken down into smaller tasks (sub-issues) which are more appropriate for assignment
  - **Override**: Set `allow_parent_issues=true` to assign parent issues
- The issue is already assigned to someone else

## Workflow Logic

1. **Grace Period** (on issue closure): Wait 5 minutes to allow manual assignment
2. **Determine Mode**:
   - Manual dispatch: Use the specified mode
   - Daily schedule: Use auto mode
   - Issue closure: Check the last N closed issues (N = `refactor_threshold`, default: 4)
     - If none have the `refactor` label: Use refactor mode
     - Otherwise: Use auto mode (assign next regular issue)
3. **Check Existing Assignment**:
   - **Refactor mode**: If Copilot is busy (has any assigned issue), skip to avoid disruption
   - **Auto mode**: Skip if Copilot already has an issue (unless forced)
4. **Assign Issue or Create Refactor**:
   - **Refactor mode**: 
     - First, search for existing open issues with `refactor` label
     - If available refactor issue exists: Assign it to Copilot
     - If no available refactor issues exist: Create a new refactor issue
   - **Auto mode**: Find and assign the next available issue by priority
     - If no suitable issues exist: Fall back to refactor mode (assign existing or create new)

## Conflict Resolution

The workflow prevents conflicts between refactor and regular issue assignment using a label-based approach:

1. **Label-based scheduling**: Refactor work is triggered when the last N closed issues don't have a `refactor` label (N is configurable via `refactor_threshold`, default: 4 for approximately 1 in 5 ratio)
2. **Reuse before create**: When refactor mode is triggered, the workflow first tries to assign existing open refactor issues before creating new ones
3. **No disruption**: If Copilot is busy when refactor mode is triggered, the refactor is skipped - it will be attempted again when the next qualifying condition occurs
4. **Refactor label distinction**: All refactor issues are labeled with `refactor` and assigned with third priority (after bug and documentation)
5. **Sequential execution**: Only one assignment happens at a time (no parallel assignments)

This approach ensures a healthy mix of regular work and refactoring without complex scheduling or disrupting ongoing work.

## Requirements

- **Refactor Label**: The `refactor` label must exist in your repository for the workflow to function properly. The workflow will error if this label is missing when refactor mode is triggered.

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

### Dry Run Mode

Test the workflow without making actual changes:

```bash
gh workflow run assign-copilot-issues.yml -f mode=auto -f dry_run=true
```

### Allow Assigning Parent Issues

Assign issues even if they have sub-issues:

```bash
gh workflow run assign-copilot-issues.yml -f mode=auto -f allow_parent_issues=true
```

### Customize Refactor Threshold

Change the refactor ratio by adjusting how many closed issues are checked (default: 4 for 1-in-5 ratio):

```bash
# Check last 9 closed issues (1-in-10 ratio)
gh workflow run assign-copilot-issues.yml -f refactor_threshold=9

# Check last 2 closed issues (1-in-3 ratio, more frequent refactors)
gh workflow run assign-copilot-issues.yml -f refactor_threshold=2
```

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
