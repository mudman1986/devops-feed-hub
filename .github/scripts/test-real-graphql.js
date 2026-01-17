#!/usr/bin/env node

/**
 * Real integration test that calls GitHub's actual GraphQL API
 * and verifies sub-issue detection matches MCP results
 */

const { Octokit } = require("@octokit/core");

async function testRealGraphQL() {
  console.log("\n=== REAL GITHUB GRAPHQL API INTEGRATION TEST ===\n");

  // Initialize Octokit with GitHub token from environment
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("ERROR: GITHUB_TOKEN environment variable not set");
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });

  const owner = "mudman1986";
  const repo = "devops-feed-hub";

  // Test issue #79 which we know has sub-issues from MCP
  const issueNumber = 79;

  console.log(`Testing issue #${issueNumber}...`);

  try {
    // Execute the EXACT same GraphQL query the workflow uses
    const result = await octokit.graphql(
      `
      query($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            id
            number
            title
            url
            body
            assignees(first: 10) {
              nodes {
                login
              }
            }
            labels(first: 20) {
              nodes {
                name
                color
              }
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
    `,
      {
        owner,
        repo,
        issueNumber,
      },
    );

    const issue = result.repository.issue;
    console.log("\n--- Raw GraphQL Response ---");
    console.log(
      JSON.stringify(
        {
          number: issue.number,
          title: issue.title,
          assignees: issue.assignees.nodes.map((a) => a.login),
          labels: issue.labels.nodes.map((l) => l.name),
          trackedIssues: issue.trackedIssues,
          trackedInIssues: issue.trackedInIssues,
        },
        null,
        2,
      ),
    );

    // Parse using the actual script function
    const helpers = require("./assign-copilot.js");
    const parsed = helpers.parseIssueData(issue);

    console.log("\n--- Parsed Issue Data ---");
    console.log(JSON.stringify(parsed, null, 2));

    console.log("\n--- Sub-Issue Detection ---");
    console.log(`trackedIssues.totalCount: ${issue.trackedIssues.totalCount}`);
    console.log(`hasSubIssues: ${parsed.hasSubIssues}`);
    console.log(`isAssigned: ${parsed.isAssigned}`);

    // Check if it would be skipped
    const { shouldSkip, reason } = helpers.shouldSkipIssue(
      parsed,
      false, // allowParentIssues = false
    );
    console.log(`\nWould be skipped: ${shouldSkip}`);
    if (shouldSkip) {
      console.log(`Reason: ${reason}`);
    }

    // Expected results based on MCP data
    console.log("\n--- Expected Results (from MCP) ---");
    console.log("Issue #79 has 5 sub-issues:");
    console.log("  - #80 (closed)");
    console.log("  - #81 (closed)");
    console.log("  - #82 (closed)");
    console.log("  - #103 (closed)");
    console.log("  - #115 (open)");
    console.log("Expected totalCount: 5");
    console.log("Expected hasSubIssues: true");
    console.log("Expected shouldSkip: true (when allowParentIssues=false)");

    // Validation
    console.log("\n--- VALIDATION ---");
    const tests = [
      {
        name: "trackedIssues.totalCount >= 5",
        actual: issue.trackedIssues.totalCount,
        expected: 5,
        pass: issue.trackedIssues.totalCount >= 5,
      },
      {
        name: "hasSubIssues === true",
        actual: parsed.hasSubIssues,
        expected: true,
        pass: parsed.hasSubIssues === true,
      },
      {
        name: "shouldSkip === true (allowParentIssues=false)",
        actual: shouldSkip,
        expected: true,
        pass: shouldSkip === true,
      },
      {
        name: "reason === 'has sub-issues'",
        actual: reason,
        expected: "has sub-issues",
        pass: reason === "has sub-issues",
      },
    ];

    let allPassed = true;
    tests.forEach((test) => {
      const status = test.pass ? "✅ PASS" : "❌ FAIL";
      console.log(
        `${status}: ${test.name} (actual: ${JSON.stringify(test.actual)}, expected: ${JSON.stringify(test.expected)})`,
      );
      if (!test.pass) allPassed = false;
    });

    if (allPassed) {
      console.log(
        "\n🎉 ALL TESTS PASSED - Script correctly detects sub-issues!",
      );
      process.exit(0);
    } else {
      console.log("\n❌ SOME TESTS FAILED - Sub-issue detection is broken!");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ ERROR during GraphQL query:");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testRealGraphQL();
