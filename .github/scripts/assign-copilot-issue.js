#!/usr/bin/env node

/**
 * Script to assign issues to Copilot bot
 * Can be used for both weekly refactor and regular issue assignment
 *
 * Usage:
 *   node assign-copilot-issue.js --mode=refactor
 *   node assign-copilot-issue.js --mode=auto --label=bug --force
 */

module.exports = async ({ github, context, core }) => {
  // Parse command line arguments or use defaults
  const args = process.argv.slice(2);
  const mode =
    args.find((a) => a.startsWith("--mode="))?.split("=")[1] || "auto";
  const labelOverride =
    args.find((a) => a.startsWith("--label="))?.split("=")[1] || null;
  const force = args.includes("--force");

  console.log(
    `Running in ${mode} mode, force=${force}, labelOverride=${labelOverride}`,
  );

  // Step 1: Get repo ID, Copilot bot ID
  const repoInfo = await github.graphql(
    `
		query($owner: String!, $repo: String!) {
			repository(owner: $owner, name: $repo) {
				id
				suggestedActors(capabilities: [CAN_BE_ASSIGNED], first: 100) {
					nodes { login __typename ... on Bot { id } ... on User { id } }
				}
			}
		}
	`,
    {
      owner: context.repo.owner,
      repo: context.repo.repo,
    },
  );

  const repoId = repoInfo.repository.id;
  const copilotBot = repoInfo.repository.suggestedActors.nodes.find(
    (n) => n.login === "copilot-swe-agent" && n.__typename === "Bot",
  );
  if (!copilotBot) {
    console.log("Actors found:");
    repoInfo.repository.suggestedActors.nodes.forEach((n) =>
      console.log(JSON.stringify(n)),
    );
    throw new Error("Copilot bot agent not found in suggestedActors");
  }
  const copilotBotId = copilotBot.id;

  // Step 2: Check if Copilot is already assigned to an issue (unless force is true)
  if (!force) {
    const assignedIssues = await github.graphql(
      `
			query($owner: String!, $repo: String!) {
				repository(owner: $owner, name: $repo) {
					issues(first: 100, states: OPEN, filterBy: { assignee: "copilot-swe-agent" }) {
						nodes {
							number
							title
							url
							labels(first: 10) {
								nodes { name }
							}
						}
					}
				}
			}
		`,
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
      },
    );

    if (assignedIssues.repository.issues.nodes.length > 0) {
      console.log("Copilot is already assigned to the following issues:");
      assignedIssues.repository.issues.nodes.forEach((issue) => {
        console.log(`  - #${issue.number}: ${issue.title} (${issue.url})`);
      });
      console.log("Skipping assignment. Use --force to override.");
      return;
    }
  }

  // Step 3: Handle different modes
  if (mode === "refactor") {
    return await createRefactorIssue(github, context, repoId, copilotBotId);
  } else if (mode === "auto") {
    return await assignNextIssue(
      github,
      context,
      repoId,
      copilotBotId,
      labelOverride,
    );
  } else {
    throw new Error(`Unknown mode: ${mode}`);
  }
};

/**
 * Create a weekly refactor issue
 */
async function createRefactorIssue(github, context, repoId, copilotBotId) {
  // Get refactor label ID
  const labelInfo = await github.graphql(
    `
		query($owner: String!, $repo: String!) {
			repository(owner: $owner, name: $repo) {
				label(name: "refactor") {
					id
				}
			}
		}
	`,
    {
      owner: context.repo.owner,
      repo: context.repo.repo,
    },
  );

  if (!labelInfo.repository.label) {
    throw new Error("Refactor label not found in repository.");
  }
  const refactorLabelId = labelInfo.repository.label.id;

  // Create and assign issue to Copilot
  const res = await github.graphql(
    `
		mutation($repositoryId: ID!, $title: String!, $body: String!, $assigneeIds: [ID!]) {
			createIssue(
				input: {
					repositoryId: $repositoryId,
					title: $title,
					body: $body,
					assigneeIds: $assigneeIds
				}
			) {
				issue {
					id
					url
					title
					assignees(first: 10) { nodes { login } }
				}
			}
		}
	`,
    {
      repositoryId: repoId,
      title: `Weekly Refactor - ${new Date().toISOString()}`,
      body: [
        "Review the codebase and make improvements:",
        "",
        "- Fix failing tests (superlinter, ci, ui tests)",
        "- Refactor duplicate code",
        "- Address security vulnerabilities",
        "- Improve code maintainability and performance",
        "- Enhance UI accessibility",
        "- Increase test coverage",
        "",
        "**Rules:**",
        "- Assign tasks to all available specialized agents in the repository (e.g., UI/UX Specialist, Test Runner, Code Review, etc.)",
        "- Make minimal surgical changes, run all linters/tests before completing.",
      ].join("\n"),
      assigneeIds: [copilotBotId],
    },
  );

  console.log(`Created Copilot-assigned issue: ${res.createIssue.issue.url}`);

  // Add refactor label to the issue
  const issueId = res.createIssue.issue.id;
  try {
    await github.graphql(
      `
			mutation($issueId: ID!, $labelIds: [ID!]!) {
				addLabelsToLabelable(
					input: {
						labelableId: $issueId,
						labelIds: $labelIds
					}
				) {
					labelable {
						... on Issue {
							labels(first: 10) {
								nodes {
									name
								}
							}
						}
					}
				}
			}
		`,
      {
        issueId,
        labelIds: [refactorLabelId],
      },
    );

    console.log(`Added 'refactor' label to issue`);
  } catch (error) {
    console.error(`Failed to add refactor label: ${error.message}`);
    console.error(
      "Issue was created successfully but label could not be added.",
    );
    // Don't throw - issue was created successfully
  }
}

/**
 * Assign Copilot to the next available issue based on priority
 */
async function assignNextIssue(
  github,
  context,
  repoId,
  copilotBotId,
  labelOverride,
) {
  // Define label priority
  const labelPriority = labelOverride
    ? [labelOverride]
    : ["bug", "documentation", "enhancement"];

  let issueToAssign = null;

  // Try to find an issue by priority
  for (const label of labelPriority) {
    console.log(`Searching for issues with label: ${label}`);

    const issues = await github.graphql(
      `
			query($owner: String!, $repo: String!, $label: String!) {
				repository(owner: $owner, name: $repo) {
					issues(first: 50, states: OPEN, labels: [$label], orderBy: {field: CREATED_AT, direction: ASC}) {
						nodes {
							id
							number
							title
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
						}
					}
				}
			}
		`,
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
        label: label,
      },
    );

    // Find first unassigned issue without sub-issues and without refactor label
    for (const issue of issues.repository.issues.nodes) {
      const hasSubIssues = issue.trackedIssues.totalCount > 0;
      const isRefactorIssue = issue.labels.nodes.some(
        (l) => l.name === "refactor",
      );
      const isAssigned = issue.assignees.nodes.length > 0;

      console.log(`  Issue #${issue.number}: ${issue.title}`);
      console.log(
        `    - Assigned: ${isAssigned}, SubIssues: ${hasSubIssues}, Refactor: ${isRefactorIssue}`,
      );

      if (!isAssigned && !hasSubIssues && !isRefactorIssue) {
        issueToAssign = issue;
        break;
      }
    }

    if (issueToAssign) {
      console.log(`Found issue to assign: #${issueToAssign.number}`);
      break;
    }
  }

  // If no issue with priority labels, try other open issues
  if (!issueToAssign && !labelOverride) {
    console.log("Searching for any open unassigned issue...");

    const allIssues = await github.graphql(
      `
			query($owner: String!, $repo: String!) {
				repository(owner: $owner, name: $repo) {
					issues(first: 100, states: OPEN, orderBy: {field: CREATED_AT, direction: ASC}) {
						nodes {
							id
							number
							title
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
						}
					}
				}
			}
		`,
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
      },
    );

    for (const issue of allIssues.repository.issues.nodes) {
      const hasSubIssues = issue.trackedIssues.totalCount > 0;
      const isRefactorIssue = issue.labels.nodes.some(
        (l) => l.name === "refactor",
      );
      const isAssigned = issue.assignees.nodes.length > 0;
      const hasPriorityLabel = issue.labels.nodes.some((l) =>
        labelPriority.includes(l.name),
      );

      // Skip issues already checked or priority issues (already checked above)
      if (
        !isAssigned &&
        !hasSubIssues &&
        !isRefactorIssue &&
        !hasPriorityLabel
      ) {
        issueToAssign = issue;
        break;
      }
    }
  }

  if (!issueToAssign) {
    console.log("No suitable issue found to assign to Copilot.");
    return;
  }

  // Assign the issue to Copilot
  console.log(`Assigning issue #${issueToAssign.number} to Copilot...`);

  await github.graphql(
    `
		mutation($issueId: ID!, $assigneeIds: [ID!]!) {
			addAssigneesToAssignable(
				input: {
					assignableId: $issueId,
					assigneeIds: $assigneeIds
				}
			) {
				assignable {
					... on Issue {
						assignees(first: 10) {
							nodes { login }
						}
					}
				}
			}
		}
	`,
    {
      issueId: issueToAssign.id,
      assigneeIds: [copilotBotId],
    },
  );

  console.log(
    `✓ Successfully assigned issue #${issueToAssign.number} to Copilot`,
  );
  console.log(`  Title: ${issueToAssign.title}`);
  console.log(`  URL: ${issueToAssign.url}`);
}
