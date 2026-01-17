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

module.exports = {
  shouldSkipIssue,
  shouldAssignNewIssue,
  parseIssueData,
  findAssignableIssue,
  normalizeIssueLabels,
};
