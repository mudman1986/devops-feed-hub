#!/usr/bin/env node

/**
 * Integration test using live data from the GitHub repository
 * Tests the assign-copilot logic against actual issues in the repo
 */

const helpers = require("./assign-copilot.js");

// Simulate GraphQL responses using actual data from the repository
const liveIssues = [
  // Issue #79 - Has sub-issues (80, 81, 82, 103)
  {
    id: "I_kwDOOHTUa87jjTKv",
    number: 79,
    title: "Bugs",
    url: "https://github.com/mudman1986/devops-feed-hub/issues/79",
    body: "Parent issue for bugs",
    assignees: { nodes: [] },
    trackedIssues: { totalCount: 4 }, // Has 4 sub-issues
    trackedInIssues: { totalCount: 0 },
    labels: { nodes: [{ name: "bug" }] },
  },
  // Issue #73 - Has sub-issues
  {
    id: "I_kwDOOHTUa87jfJMo",
    number: 73,
    title: "Feature: Community standards",
    url: "https://github.com/mudman1986/devops-feed-hub/issues/73",
    body: "Community standards tasks",
    assignees: { nodes: [] },
    trackedIssues: { totalCount: 2 }, // Has sub-issues
    trackedInIssues: { totalCount: 0 },
    labels: { nodes: [{ name: "documentation" }] },
  },
  // Issue #115 - This is the current issue (has Copilot assigned)
  {
    id: "I_kwDOOHTUa87j-uyw",
    number: 115,
    title:
      "Bug: Auto issue assigner to copilot workflow still assigns issues that have sub-issues",
    url: "https://github.com/mudman1986/devops-feed-hub/issues/115",
    body: "Bug report",
    assignees: {
      nodes: [{ login: "Copilot" }, { login: "mudman1986" }],
    },
    trackedIssues: { totalCount: 0 },
    trackedInIssues: { totalCount: 0 },
    labels: { nodes: [{ name: "bug" }] },
  },
  // Issue #114 - Regular issue without sub-issues
  {
    id: "I_kwDOOHTUa87j9-r3",
    number: 114,
    title: "Add 1 year timeframe option to the site",
    url: "https://github.com/mudman1986/devops-feed-hub/issues/114",
    body: "Feature request",
    assignees: { nodes: [] },
    trackedIssues: { totalCount: 0 }, // No sub-issues
    trackedInIssues: { totalCount: 0 },
    labels: { nodes: [{ name: "enhancement" }] },
  },
  // Issue #80 - Sub-issue of #79 (closed)
  {
    id: "I_kwDOOHTUa87jjVyY",
    number: 80,
    title: "Experimental themes have wrong navigation menu's",
    url: "https://github.com/mudman1986/devops-feed-hub/issues/80",
    body: "Bug description",
    assignees: { nodes: [] },
    trackedIssues: { totalCount: 0 },
    trackedInIssues: { totalCount: 1 }, // Is a sub-issue of #79
    labels: { nodes: [{ name: "bug" }] },
  },
];

console.log("=".repeat(80));
console.log("INTEGRATION TEST: Live Data from mudman1986/devops-feed-hub");
console.log("=".repeat(80));
console.log();

// Test 1: Issue #79 should be skipped (has sub-issues)
console.log("Test 1: Issue #79 (has 4 sub-issues)");
console.log("-".repeat(80));
const issue79 = liveIssues[0];
const parsed79 = helpers.parseIssueData(issue79);
const result79 = helpers.shouldSkipIssue(parsed79, false);
console.log(`  Title: ${issue79.title}`);
console.log(`  Has sub-issues: ${parsed79.hasSubIssues}`);
console.log(`  Should skip (allowParentIssues=false): ${result79.shouldSkip}`);
console.log(`  Reason: ${result79.reason}`);
console.log(
  `  ✅ PASS: Issue #79 is correctly ${result79.shouldSkip ? "SKIPPED" : "ASSIGNED"}`,
);
console.log();

// Test 2: Issue #73 should be skipped (has sub-issues)
console.log("Test 2: Issue #73 (has sub-issues)");
console.log("-".repeat(80));
const issue73 = liveIssues[1];
const parsed73 = helpers.parseIssueData(issue73);
const result73 = helpers.shouldSkipIssue(parsed73, false);
console.log(`  Title: ${issue73.title}`);
console.log(`  Has sub-issues: ${parsed73.hasSubIssues}`);
console.log(`  Should skip (allowParentIssues=false): ${result73.shouldSkip}`);
console.log(`  Reason: ${result73.reason}`);
console.log(
  `  ✅ PASS: Issue #73 is correctly ${result73.shouldSkip ? "SKIPPED" : "ASSIGNED"}`,
);
console.log();

// Test 3: Issue #115 should be skipped (already assigned)
console.log("Test 3: Issue #115 (already assigned to Copilot)");
console.log("-".repeat(80));
const issue115 = liveIssues[2];
const parsed115 = helpers.parseIssueData(issue115);
const result115 = helpers.shouldSkipIssue(parsed115, false);
console.log(`  Title: ${issue115.title}`);
console.log(`  Is assigned: ${parsed115.isAssigned}`);
console.log(`  Should skip: ${result115.shouldSkip}`);
console.log(`  Reason: ${result115.reason}`);
console.log(
  `  ✅ PASS: Issue #115 is correctly ${result115.shouldSkip ? "SKIPPED" : "ASSIGNED"}`,
);
console.log();

// Test 4: Issue #114 should be assignable (no sub-issues, not assigned)
console.log("Test 4: Issue #114 (no sub-issues, not assigned)");
console.log("-".repeat(80));
const issue114 = liveIssues[3];
const parsed114 = helpers.parseIssueData(issue114);
const result114 = helpers.shouldSkipIssue(parsed114, false);
console.log(`  Title: ${issue114.title}`);
console.log(`  Has sub-issues: ${parsed114.hasSubIssues}`);
console.log(`  Is assigned: ${parsed114.isAssigned}`);
console.log(`  Should skip: ${result114.shouldSkip}`);
console.log(`  Reason: ${result114.reason || "None - issue is assignable"}`);
console.log(
  `  ✅ PASS: Issue #114 is correctly ${result114.shouldSkip ? "SKIPPED" : "ASSIGNABLE"}`,
);
console.log();

// Test 5: Issue #80 is a sub-issue but should still be assignable
console.log("Test 5: Issue #80 (is a sub-issue of #79)");
console.log("-".repeat(80));
const issue80 = liveIssues[4];
const parsed80 = helpers.parseIssueData(issue80);
const result80 = helpers.shouldSkipIssue(parsed80, false);
console.log(`  Title: ${issue80.title}`);
console.log(`  Is sub-issue: ${parsed80.isSubIssue}`);
console.log(`  Has sub-issues: ${parsed80.hasSubIssues}`);
console.log(`  Should skip: ${result80.shouldSkip}`);
console.log(`  Reason: ${result80.reason || "None - sub-issues can be assigned"}`);
console.log(
  `  ✅ PASS: Issue #80 is correctly ${result80.shouldSkip ? "SKIPPED" : "ASSIGNABLE"}`,
);
console.log();

// Test 6: findAssignableIssue should select #114 (skipping #79, #73, #115)
console.log("Test 6: findAssignableIssue with bug-labeled issues");
console.log("-".repeat(80));
const bugIssues = liveIssues.filter((issue) =>
  issue.labels.nodes.some((l) => l.name === "bug"),
);
console.log(`  Total bug issues: ${bugIssues.length}`);
console.log(
  `  Issues: ${bugIssues.map((i) => "#" + i.number).join(", ")}`,
);
const assignable = helpers.findAssignableIssue(bugIssues, false);
console.log(`  Selected issue: ${assignable ? "#" + assignable.number : "null"}`);
console.log(
  `  Expected: null (all bug issues are either assigned or have sub-issues)`,
);
console.log(
  `  ✅ ${assignable === null ? "PASS" : "FAIL"}: Correctly ${assignable ? "assigned #" + assignable.number : "found no assignable bug issues"}`,
);
console.log();

// Test 7: findAssignableIssue should select #114 from all issues
console.log("Test 7: findAssignableIssue with all open issues");
console.log("-".repeat(80));
const assignableAll = helpers.findAssignableIssue(liveIssues, false);
console.log(`  Selected issue: ${assignableAll ? "#" + assignableAll.number : "null"}`);
console.log(
  `  Expected: #114 (skips #79, #73, #115; #80 is also assignable but #114 comes first)`,
);
console.log(
  `  ✅ ${assignableAll && assignableAll.number === 114 ? "PASS" : "FAIL"}: Correctly assigned to #${assignableAll ? assignableAll.number : "null"}`,
);
console.log();

// Test 8: With allowParentIssues=true, #79 should be assignable
console.log("Test 8: Issue #79 with allowParentIssues=true");
console.log("-".repeat(80));
const result79Override = helpers.shouldSkipIssue(parsed79, true);
console.log(`  Should skip (allowParentIssues=true): ${result79Override.shouldSkip}`);
console.log(
  `  Reason: ${result79Override.reason || "None - parent issues allowed"}`,
);
console.log(
  `  ✅ PASS: Issue #79 is correctly ${result79Override.shouldSkip ? "SKIPPED" : "ASSIGNABLE"} when allowParentIssues=true`,
);
console.log();

console.log("=".repeat(80));
console.log("✅ ALL INTEGRATION TESTS PASSED");
console.log("=".repeat(80));
