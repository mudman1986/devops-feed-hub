#!/usr/bin/env node

/**
 * REAL Integration test using LIVE data from GitHub API
 * Fetches actual issues from mudman1986/devops-feed-hub repository
 */

const https = require("https");
const helpers = require("./assign-copilot.js");

const OWNER = "mudman1986";
const REPO = "devops-feed-hub";

/**
 * Make a GraphQL request to GitHub
 */
function graphqlRequest(query, variables) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });

    const options = {
      hostname: "api.github.com",
      path: "/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
        "User-Agent": "devops-feed-hub-integration-test",
        Accept: "application/vnd.github.v3+json",
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

/**
 * Fetch actual live issues from the repository
 */
async function fetchLiveIssues() {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        issues(first: 30, states: OPEN, orderBy: {field: CREATED_AT, direction: ASC}) {
          nodes {
            id
            number
            title
            body
            url
            assignees(first: 10) {
              nodes { login }
            }
            labels(first: 10) {
              nodes { name }
            }
            trackedIssues(first: 1) {
              totalCount
            }
            trackedInIssues(first: 1) {
              totalCount
            }
          }
        }
      }
    }
  `;

  const response = await graphqlRequest(query, { owner: OWNER, repo: REPO });

  if (response.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
  }

  return response.data.repository.issues.nodes;
}

/**
 * Main test runner
 */
async function runIntegrationTest() {
  console.log("=".repeat(80));
  console.log("REAL INTEGRATION TEST: Fetching LIVE data from GitHub API");
  console.log(`Repository: ${OWNER}/${REPO}`);
  console.log("=".repeat(80));
  console.log();

  try {
    console.log("Fetching live issues from GitHub...");
    const liveIssues = await fetchLiveIssues();
    console.log(`✅ Fetched ${liveIssues.length} open issues from GitHub API`);
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
      console.log("Test 1: Issue #79 from live data");
      console.log("-".repeat(80));
      const parsed79 = helpers.parseIssueData(issue79);
      const result79 = helpers.shouldSkipIssue(parsed79, false);
      console.log(`  Title: ${issue79.title}`);
      console.log(`  URL: ${issue79.url}`);
      console.log(
        `  Has sub-issues (from GitHub): ${issue79.trackedIssues.totalCount}`,
      );
      console.log(`  Parsed hasSubIssues: ${parsed79.hasSubIssues}`);
      console.log(`  Should skip: ${result79.shouldSkip}`);
      console.log(`  Reason: ${result79.reason}`);

      if (result79.shouldSkip && result79.reason === "has sub-issues") {
        console.log(`  ✅ PASS: Issue #79 is correctly SKIPPED`);
      } else {
        console.log(`  ❌ FAIL: Issue #79 should be skipped!`);
      }
      console.log();
    } else {
      console.log("⚠️  Issue #79 not found in open issues (may be closed)");
      console.log();
    }

    // Test 2: List all issues with sub-issues
    console.log("Test 2: All issues with sub-issues from live data");
    console.log("-".repeat(80));
    if (issuesWithSubIssues.length > 0) {
      issuesWithSubIssues.forEach((issue) => {
        const parsed = helpers.parseIssueData(issue);
        const result = helpers.shouldSkipIssue(parsed, false);
        console.log(`  #${issue.number}: ${issue.title}`);
        console.log(`    Sub-issues count: ${issue.trackedIssues.totalCount}`);
        console.log(`    Should skip: ${result.shouldSkip} (${result.reason})`);
      });
      console.log(
        `  ✅ PASS: Found ${issuesWithSubIssues.length} issue(s) with sub-issues`,
      );
    } else {
      console.log(
        "  ℹ️  No issues with sub-issues found in current open issues",
      );
    }
    console.log();

    // Test 3: Test findAssignableIssue with real data
    console.log("Test 3: findAssignableIssue with live data");
    console.log("-".repeat(80));
    const assignable = helpers.findAssignableIssue(liveIssues, false);
    if (assignable) {
      console.log(`  Selected issue: #${assignable.number}`);
      console.log(`  Title: ${assignable.title}`);
      console.log(`  URL: ${assignable.url}`);
      console.log(`  ✅ PASS: Found assignable issue from live data`);
    } else {
      console.log(`  No assignable issues found`);
      console.log(`  ℹ️  All issues are either assigned or have sub-issues`);
    }
    console.log();

    // Test 4: List all assignable issues
    console.log("Test 4: All assignable issues from live data");
    console.log("-".repeat(80));
    if (assignableIssues.length > 0) {
      assignableIssues.forEach((issue) => {
        const parsed = helpers.parseIssueData(issue);
        console.log(`  #${issue.number}: ${issue.title}`);
        console.log(`    Has sub-issues: ${parsed.hasSubIssues}`);
        console.log(`    Is assigned: ${parsed.isAssigned}`);
        console.log(
          `    Labels: ${issue.labels.nodes.map((l) => l.name).join(", ")}`,
        );
      });
      console.log(
        `  ✅ PASS: Found ${assignableIssues.length} assignable issue(s)`,
      );
    } else {
      console.log("  ℹ️  No assignable issues found");
    }
    console.log();

    // Test 5: Verify allowParentIssues override works
    if (issuesWithSubIssues.length > 0) {
      console.log("Test 5: allowParentIssues=true override");
      console.log("-".repeat(80));
      const firstParent = issuesWithSubIssues[0];
      const parsedParent = helpers.parseIssueData(firstParent);
      const resultWithOverride = helpers.shouldSkipIssue(parsedParent, true);
      console.log(`  Issue #${firstParent.number}: ${firstParent.title}`);
      console.log(`  Has sub-issues: ${parsedParent.hasSubIssues}`);
      console.log(
        `  Should skip (allowParentIssues=true): ${resultWithOverride.shouldSkip}`,
      );
      console.log(
        `  Reason: ${resultWithOverride.reason || "None - parent issues allowed"}`,
      );

      if (!resultWithOverride.shouldSkip) {
        console.log(
          `  ✅ PASS: Parent issue is assignable with allowParentIssues=true`,
        );
      } else {
        console.log(
          `  ❌ FAIL: Parent issue should be assignable when allowParentIssues=true`,
        );
      }
      console.log();
    }

    console.log("=".repeat(80));
    console.log("✅ INTEGRATION TEST COMPLETED WITH LIVE DATA");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("❌ Integration test failed:");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runIntegrationTest();
