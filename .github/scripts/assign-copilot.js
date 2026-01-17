#!/usr/bin/env node

/**
 * Assign Copilot to GitHub Issues
 *
 * This script handles automatic assignment of GitHub Copilot to issues
 * based on priority labels and various constraints.
 */

/**
 * Check if an issue should be skipped for assignment
 * @param {Object} issue - Issue object from GitHub GraphQL API
 * @param {boolean} issue.isAssigned - Whether issue already has assignees
 * @param {boolean} issue.hasSubIssues - Whether issue has tracked sub-issues
 * @param {boolean} issue.isRefactorIssue - Whether issue has refactor label
 * @returns {Object} - {shouldSkip: boolean, reason: string}
 */
function shouldSkipIssue(issue) {
  if (issue.isAssigned) {
    return { shouldSkip: true, reason: "already assigned" };
  }
  if (issue.hasSubIssues) {
    return { shouldSkip: true, reason: "has sub-issues" };
  }
  if (issue.isRefactorIssue) {
    return { shouldSkip: true, reason: "is a refactor issue" };
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
    isAssigned: issue.assignees.nodes.length > 0,
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
 * @param {Array} issues - Array of issue objects
 * @returns {Object|null} - First assignable issue or null
 */
function findAssignableIssue(issues) {
  for (const issue of issues) {
    const parsed = parseIssueData(issue);
    const { shouldSkip } = shouldSkipIssue(parsed);

    if (!shouldSkip) {
      return parsed;
    }
  }
  return null;
}

/**
 * Check if an issue has sub-issues using REST API
 * @param {Object} github - GitHub REST API client (octokit)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number to check
 * @returns {Promise<boolean>} - True if issue has sub-issues
 */
async function hasSubIssuesViaREST(github, owner, repo, issueNumber) {
  try {
    const response = await github.rest.issues.listSubIssues({
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 1, // Only need to check if any exist
    });
    return response.data.length > 0;
  } catch (error) {
    // If endpoint doesn't exist or fails, fall back to assuming no sub-issues
    // This can happen if the REST API endpoint is not available
    console.log(
      `Warning: Could not check sub-issues for #${issueNumber}: ${error.message}`,
    );
    return false;
  }
}

/**
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
    let { shouldSkip, reason } = shouldSkipIssue(parsed);

    // If GraphQL says no sub-issues, double-check with REST API
    // This is needed because GraphQL trackedIssues can be unreliable
    if (!shouldSkip && !parsed.hasSubIssues) {
      const hasSubIssues = await hasSubIssuesViaREST(
        github,
        owner,
        repo,
        parsed.number,
      );
      if (hasSubIssues) {
        console.log(
          `  Issue #${parsed.number}: GraphQL reported no sub-issues, but REST API found sub-issues. Skipping.`,
        );
        shouldSkip = true;
        reason = "has sub-issues (detected via REST API)";
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
};
