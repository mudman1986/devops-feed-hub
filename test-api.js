// Test different API approaches to retrieve sub-issues for issue #79
const { Octokit } = require("@octokit/core");

async function testApis() {
  const octokit = new Octokit({ 
    auth: process.env.GITHUB_TOKEN 
  });
  
  const owner = "mudman1986";
  const repo = "devops-feed-hub";
  const issueNumber = 79;
  
  console.log("=".repeat(80));
  console.log("Testing different API approaches for issue #79");
  console.log("=".repeat(80));
  
  // Test 1: GraphQL trackedIssues with basic query
  console.log("\n1. GraphQL trackedIssues (basic):");
  try {
    const result = await octokit.graphql(`
      query($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            number
            title
            trackedIssues(first: 10) {
              totalCount
            }
          }
        }
      }
    `, { owner, repo, issueNumber });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log("ERROR:", error.message);
  }
  
  // Test 2: GraphQL trackedIssues with nodes expanded
  console.log("\n2. GraphQL trackedIssues (with nodes):");
  try {
    const result = await octokit.graphql(`
      query($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            number
            title
            trackedIssues(first: 10) {
              totalCount
              nodes {
                number
                title
                state
              }
            }
          }
        }
      }
    `, { owner, repo, issueNumber });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log("ERROR:", error.message);
  }
  
  // Test 3: GraphQL trackedInIssues
  console.log("\n3. GraphQL trackedInIssues:");
  try {
    const result = await octokit.graphql(`
      query($owner: String!, $repo: String!, $issueNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issueNumber) {
            number
            title
            trackedInIssues(first: 10) {
              totalCount
              nodes {
                number
                title
              }
            }
          }
        }
      }
    `, { owner, repo, issueNumber });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log("ERROR:", error.message);
  }
  
  // Test 4: REST API - list sub-issues endpoint
  console.log("\n4. REST API - GET /repos/{owner}/{repo}/issues/{issue_number}/sub-issues:");
  try {
    const result = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/sub-issues', {
      owner,
      repo,
      issue_number: issueNumber,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    console.log("Status:", result.status);
    console.log("Data:", JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log("ERROR:", error.status, error.message);
  }
  
  // Test 5: REST API - get parent issue (reverse - testing if #79 is a sub-issue)
  console.log("\n5. REST API - GET /repos/{owner}/{repo}/issues/{issue_number}/parent:");
  try {
    const result = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/parent', {
      owner,
      repo,
      issue_number: issueNumber,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    console.log("Status:", result.status);
    console.log("Data:", JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log("ERROR:", error.status, error.message);
  }
  
  // Test 6: Check a known sub-issue (#115) for its parent
  console.log("\n6. REST API - GET parent for issue #115 (known sub-issue):");
  try {
    const result = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/parent', {
      owner,
      repo,
      issue_number: 115,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    console.log("Status:", result.status);
    console.log("Parent issue:", result.data.number, "-", result.data.title);
  } catch (error) {
    console.log("ERROR:", error.status, error.message);
  }
  
  // Test 7: Get all open issues and analyze their trackedInIssues
  console.log("\n7. GraphQL - All open issues with trackedInIssues expanded:");
  try {
    const result = await octokit.graphql(`
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          issues(first: 20, states: OPEN) {
            nodes {
              number
              title
              trackedInIssues(first: 10) {
                totalCount
                nodes {
                  number
                  title
                }
              }
            }
          }
        }
      }
    `, { owner, repo });
    
    // Build parent map
    const parentMap = {};
    for (const issue of result.repository.issues.nodes) {
      if (issue.trackedInIssues && issue.trackedInIssues.nodes) {
        for (const parent of issue.trackedInIssues.nodes) {
          if (!parentMap[parent.number]) {
            parentMap[parent.number] = [];
          }
          parentMap[parent.number].push(issue.number);
        }
      }
    }
    
    console.log("Parent issues with their sub-issues:");
    for (const [parentNum, subIssues] of Object.entries(parentMap)) {
      console.log(`  Issue #${parentNum} has ${subIssues.length} open sub-issues: ${subIssues.join(', ')}`);
    }
  } catch (error) {
    console.log("ERROR:", error.message);
  }
}

testApis().catch(console.error);
