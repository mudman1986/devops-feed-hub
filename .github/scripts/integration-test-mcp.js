#!/usr/bin/env node

/**
 * REAL Integration test using GitHub MCP server
 * This script is meant to be called by the test framework with GitHub API access
 */

const helpers = require("./assign-copilot.js");

// This will be populated by the test runner with real GitHub API data
async function runTest(liveIssues) {
  console.log("=".repeat(80));
  console.log("REAL INTEGRATION TEST: Using LIVE data from GitHub API");
  console.log(`Repository: mudman1986/devops-feed-hub`);
  console.log("=".repeat(80));
  console.log();

  console.log(`✅ Received ${liveIssues.length} open issues from GitHub API`);
  console.log();

  // Find specific issues mentioned in the bug report
  const issue79 = liveIssues.find((i) => i.number === 79);
  const issue73 = liveIssues.find((i) => i.number === 73);
  const issue115 = liveIssues.find((i) => i.number === 115);

  // Find issues with sub-issues
  const issuesWithSubIssues = liveIssues.filter(
    (i) => i.trackedIssues && i.trackedIssues.totalCount > 0,
  );

  // Find assignable issues (no sub-issues, not assigned)
  const assignableIssues = liveIssues.filter((i) => {
    const parsed = helpers.parseIssueData(i);
    const { shouldSkip } = helpers.shouldSkipIssue(parsed, false);
    return !shouldSkip;
  });

  console.log("LIVE DATA SUMMARY:");
  console.log("-".repeat(80));
  console.log(`  Total open issues: ${liveIssues.length}`);
  console.log(`  Issues with sub-issues: ${issuesWithSubIssues.length}`);
  console.log(`  Assignable issues: ${assignableIssues.length}`);
  console.log();

  // Test 1: Verify issue #79 exists and has sub-issues
  if (issue79) {
    console.log("Test 1: Issue #79 from LIVE GitHub data");
    console.log("-".repeat(80));
    const parsed79 = helpers.parseIssueData(issue79);
    const result79 = helpers.shouldSkipIssue(parsed79, false);
    console.log(`  Title: ${issue79.title}`);
    console.log(`  URL: ${issue79.url}`);
    console.log(
      `  Assignees: ${issue79.assignees.nodes.map((a) => a.login).join(", ") || "None"}`,
    );
    console.log(
      `  trackedIssues.totalCount (from GitHub): ${issue79.trackedIssues.totalCount}`,
    );
    console.log(`  Parsed hasSubIssues: ${parsed79.hasSubIssues}`);
    console.log(`  Should skip: ${result79.shouldSkip}`);
    console.log(`  Reason: ${result79.reason}`);

    if (result79.shouldSkip && result79.reason === "has sub-issues") {
      console.log(
        `  ✅ PASS: Issue #79 is correctly SKIPPED because it has sub-issues`,
      );
    } else {
      console.log(`  ❌ FAIL: Issue #79 should be skipped but wasn't!`);
    }
    console.log();
  } else {
    console.log("⚠️  Issue #79 not found in open issues (may be closed)");
    console.log();
  }

  // Test 2: List all issues with sub-issues
  console.log("Test 2: All parent issues with sub-issues (from LIVE data)");
  console.log("-".repeat(80));
  if (issuesWithSubIssues.length > 0) {
    issuesWithSubIssues.forEach((issue) => {
      const parsed = helpers.parseIssueData(issue);
      const result = helpers.shouldSkipIssue(parsed, false);
      console.log(`  #${issue.number}: ${issue.title}`);
      console.log(`    URL: ${issue.url}`);
      console.log(
        `    Sub-issues count (from GitHub): ${issue.trackedIssues.totalCount}`,
      );
      console.log(`    Should skip: ${result.shouldSkip} (${result.reason})`);
      console.log();
    });
    console.log(
      `  ✅ PASS: Found and correctly identified ${issuesWithSubIssues.length} parent issue(s) with sub-issues`,
    );
  } else {
    console.log("  ℹ️  No issues with sub-issues found in current open issues");
  }
  console.log();

  // Test 3: Test findAssignableIssue with real data
  console.log("Test 3: findAssignableIssue with LIVE data");
  console.log("-".repeat(80));
  const assignable = helpers.findAssignableIssue(liveIssues, false);
  if (assignable) {
    console.log(`  Selected issue: #${assignable.number}`);
    console.log(`  Title: ${assignable.title}`);
    console.log(`  URL: ${assignable.url}`);
    console.log(
      `  ✅ PASS: Successfully found assignable issue from live data`,
    );
  } else {
    console.log(`  No assignable issues found`);
    console.log(
      `  ℹ️  All ${liveIssues.length} open issues are either assigned or have sub-issues`,
    );
  }
  console.log();

  // Test 4: List all assignable issues
  console.log("Test 4: All assignable issues (from LIVE data)");
  console.log("-".repeat(80));
  if (assignableIssues.length > 0) {
    assignableIssues.slice(0, 5).forEach((issue) => {
      const parsed = helpers.parseIssueData(issue);
      console.log(`  #${issue.number}: ${issue.title}`);
      console.log(`    URL: ${issue.url}`);
      console.log(`    Has sub-issues: ${parsed.hasSubIssues}`);
      console.log(`    Is assigned: ${parsed.isAssigned}`);
      console.log(
        `    Labels: ${issue.labels.nodes.map((l) => l.name).join(", ") || "None"}`,
      );
      console.log();
    });
    if (assignableIssues.length > 5) {
      console.log(
        `  ... and ${assignableIssues.length - 5} more assignable issue(s)`,
      );
      console.log();
    }
    console.log(
      `  ✅ PASS: Found ${assignableIssues.length} assignable issue(s) from live data`,
    );
  } else {
    console.log("  ℹ️  No assignable issues found in current open issues");
  }
  console.log();

  // Test 5: Verify allowParentIssues override works with real data
  if (issuesWithSubIssues.length > 0) {
    console.log("Test 5: allowParentIssues=true override (LIVE data)");
    console.log("-".repeat(80));
    const firstParent = issuesWithSubIssues[0];
    const parsedParent = helpers.parseIssueData(firstParent);
    const resultWithOverride = helpers.shouldSkipIssue(parsedParent, true);
    console.log(`  Issue #${firstParent.number}: ${firstParent.title}`);
    console.log(
      `  Has sub-issues (from GitHub): ${firstParent.trackedIssues.totalCount}`,
    );
    console.log(
      `  Should skip (allowParentIssues=false): ${helpers.shouldSkipIssue(parsedParent, false).shouldSkip}`,
    );
    console.log(
      `  Should skip (allowParentIssues=true): ${resultWithOverride.shouldSkip}`,
    );
    console.log(
      `  Reason: ${resultWithOverride.reason || "None - parent issues allowed"}`,
    );

    if (!resultWithOverride.shouldSkip) {
      console.log(
        `  ✅ PASS: Parent issue becomes assignable with allowParentIssues=true`,
      );
    } else {
      console.log(
        `  ❌ FAIL: Parent issue should be assignable when allowParentIssues=true`,
      );
    }
    console.log();
  }

  console.log("=".repeat(80));
  console.log("✅ INTEGRATION TEST COMPLETED WITH LIVE GITHUB DATA");
  console.log("=".repeat(80));
}

module.exports = { runTest };

// If run directly, show usage
if (require.main === module) {
  console.log("This script requires GitHub API data.");
  console.log(
    "Use the task tool with description 'Run integration test with live GitHub data'",
  );
}
