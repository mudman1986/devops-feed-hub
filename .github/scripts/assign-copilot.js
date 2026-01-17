#!/usr/bin/env node

/**
 * Assign Copilot to GitHub Issues
 *
 * This script handles automatic assignment of GitHub Copilot to issues
 * based on priority labels and various constraints.
 */

/**
 * Check if an issue should be skipped for assignment
 * @param {Object} issue - Issue object from parseIssueData
 * @param {boolean} issue.isAssigned - Whether issue already has assignees
 * @param {boolean} issue.hasSubIssues - Whether issue has any sub-issues (open or closed)
 * @param {boolean} allowParentIssues - Whether to allow assigning issues with sub-issues
 * @returns {Object} - {shouldSkip: boolean, reason: string}
 */
function shouldSkipIssue(issue, allowParentIssues = false) {
  if (issue.isAssigned) {
    return { shouldSkip: true, reason: "already assigned" };
  }
  if (issue.hasSubIssues && !allowParentIssues) {
    return { shouldSkip: true, reason: "has sub-issues" };
  }
  return { shouldSkip: false, reason: null };
}

/**
 * Normalize labels from GraphQL response or flattened structure
 * @param {Object} issue - Issue with potentially different label structures
 * @returns {Array} - Array of label objects with normalized structure
 */
function normalizeIssueLabels(issue) {
  // Handle GraphQL structure: { labels: { nodes: [...] } }
  if (issue.labels && issue.labels.nodes) {
    return issue.labels.nodes;
  }
  // Handle flattened structure: { labels: [...] }
  if (Array.isArray(issue.labels)) {
    return issue.labels;
  }
  // No labels
  return [];
}

/**
 * Check if Copilot should be assigned a new issue
 * @param {Array} assignedIssues - Array of issues currently assigned to Copilot
 * @param {string} mode - Assignment mode ('auto' or 'refactor')
 * @param {boolean} force - Whether to force assignment even if Copilot has work
 * @returns {Object} - {shouldAssign: boolean, reason: string}
 */
function shouldAssignNewIssue(assignedIssues, mode, force) {
  if (assignedIssues.length === 0) {
    return { shouldAssign: true, reason: "Copilot has no assigned issues" };
  }

  if (mode === "refactor") {
    // Check if already working on a refactor issue
    const hasRefactorIssue = assignedIssues.some((issue) => {
      const labels = normalizeIssueLabels(issue);
      return labels.some((label) => label.name === "refactor");
    });
    if (hasRefactorIssue) {
      return {
        shouldAssign: false,
        reason: "Copilot already has a refactor issue assigned",
      };
    }
    // If working on non-refactor issues, skip to avoid disruption
    return {
      shouldAssign: false,
      reason: "Copilot is working on other issues, skipping refactor creation",
    };
  }

  // Auto mode
  if (force) {
    return {
      shouldAssign: true,
      reason: "Force flag is set",
    };
  }

  return {
    shouldAssign: false,
    reason: "Copilot already has assigned issues and force=false",
  };
}

/**
 * Parse issue data from GraphQL response
 * @param {Object} issue - Raw issue object from GraphQL
 * @returns {Object} - Parsed issue with boolean flags
 */
function parseIssueData(issue) {
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    url: issue.url,
    body: issue.body || "",
    isAssigned: issue.assignees.nodes.length > 0,
    // Check for ANY sub-issues (open or closed) - parent issues should not be assigned
    hasSubIssues: !!(issue.trackedIssues && issue.trackedIssues.totalCount > 0),
    isSubIssue: !!(
      issue.trackedInIssues && issue.trackedInIssues.totalCount > 0
    ),
    isRefactorIssue: issue.labels.nodes.some((l) => l.name === "refactor"),
    labels: issue.labels.nodes,
  };
}

/**
 * Find the first assignable issue from a list
 * @param {Array} issues - Array of issue objects from GraphQL
 * @param {boolean} allowParentIssues - Whether to allow assigning issues with sub-issues (open or closed)
 * @returns {Object|null} - First assignable issue or null
 */
function findAssignableIssue(issues, allowParentIssues = false) {
  for (const issue of issues) {
    const parsed = parseIssueData(issue);
    const { shouldSkip } = shouldSkipIssue(parsed, allowParentIssues);

    if (!shouldSkip) {
      return parsed;
    }
  }
  return null;
}

/**
 * @deprecated This function is no longer used. Use GraphQL trackedIssues totalCount instead.
 * Parse issue body for tasklist items that reference other issues
 * @param {string} body - Issue body text
 * @returns {Array<number>} - Array of issue numbers referenced in tasklists
 */
function parseTasklistIssues(body) {
  if (!body) {
    return [];
  }

  // Match task list items: - [ ] #123 or - [x] #123
  // Also match: - [ ] Fixes #123, - [ ] See #123, etc.
  const tasklistPattern = /^[\s]*-[\s]*\[[ xX]\][\s]*.*?#(\d+)/gm;
  const matches = body.matchAll(tasklistPattern);
  const issueNumbers = [];

  for (const match of matches) {
    const issueNum = parseInt(match[1], 10);
    if (!isNaN(issueNum)) {
      issueNumbers.push(issueNum);
    }
  }

  return issueNumbers;
}

/**
 * @deprecated This function is no longer used. Use GraphQL trackedIssues totalCount instead.
 * Check if an issue has sub-issues by parsing issue body for tasklists
 * @param {string} body - Issue body text
 * @returns {boolean} - True if issue has tasklist items with issue references
 */
function hasSubIssuesInBody(body) {
  const tasklistIssues = parseTasklistIssues(body);
  return tasklistIssues.length > 0;
}

/**
 * @deprecated This function is no longer used. Use GraphQL trackedIssues totalCount instead.
 * Check if an issue has sub-issues using REST API
 * @param {Object} github - GitHub Octokit client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number to check
 * @param {string} body - Issue body (optional, for fallback)
 * @returns {Promise<boolean>} - True if issue has sub-issues
 */
async function hasSubIssuesViaREST(github, owner, repo, issueNumber, body) {
  try {
    // Use the REST API endpoint directly since Octokit may not have this method yet
    // GitHub introduced /repos/{owner}/{repo}/issues/{issue_number}/sub-issues in Dec 2024
    // Requires X-GitHub-Api-Version header for versioned endpoint
    const response = await github.request(
      "GET /repos/{owner}/{repo}/issues/{issue_number}/sub-issues",
      {
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 1, // Only need to check if any exist
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
    return response.data && response.data.length > 0;
  } catch (error) {
    // REST API failed - fall back to parsing issue body
    // This handles 404 (endpoint not found/not supported) and other errors

    console.log(
      `Warning: Could not check sub-issues via REST API for ${owner}/${repo}#${issueNumber}: ${error.message}`,
    );

    // Fallback: Parse issue body for tasklist items
    if (body) {
      const hasSubIssues = hasSubIssuesInBody(body);
      if (hasSubIssues) {
        const tasklistIssues = parseTasklistIssues(body);
        console.log(
          `  Issue #${issueNumber}: Found ${tasklistIssues.length} tasklist item(s) referencing issue(s). Treating as parent issue with sub-issues.`,
        );
      } else {
        console.log(
          `  Issue #${issueNumber}: No tasklist items found in body. Treating as assignable.`,
        );
      }
      return hasSubIssues;
    }

    // If no body available, err on the side of caution
    console.log(
      `  Skipping issue #${issueNumber} as a safety measure - cannot verify sub-issue status`,
    );
    return true; // Treat as "has sub-issues" to skip assignment
  }
}

/**
 * @deprecated This function is no longer used. Use findAssignableIssue with allowParentIssues parameter instead.
 * Find the first assignable issue from a list, with REST API sub-issue verification
 * @param {Array} issues - Array of issue objects from GraphQL
 * @param {Object} github - GitHub REST API client (octokit)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object|null>} - First assignable issue or null
 */
async function findAssignableIssueWithRESTCheck(issues, github, owner, repo) {
  for (const issue of issues) {
    const parsed = parseIssueData(issue);

    // First, check using GraphQL data
    const { shouldSkip } = shouldSkipIssue(parsed);

    // If GraphQL says no sub-issues, double-check with REST API
    // This is needed because GraphQL trackedIssues can be unreliable
    if (!shouldSkip && !parsed.hasSubIssues) {
      const hasSubIssues = await hasSubIssuesViaREST(
        github,
        owner,
        repo,
        parsed.number,
        parsed.body,
      );
      if (hasSubIssues) {
        // Skip this issue - it has sub-issues detected via REST API or body parsing
        continue;
      }
    }

    if (!shouldSkip) {
      return parsed;
    }
  }
  return null;
}

module.exports = {
  shouldSkipIssue,
  shouldAssignNewIssue,
  parseIssueData,
  findAssignableIssue,
  findAssignableIssueWithRESTCheck,
  hasSubIssuesViaREST,
  normalizeIssueLabels,
  parseTasklistIssues,
  hasSubIssuesInBody,
};
