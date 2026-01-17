/**
 * Tests for assign-copilot.js
 *
 * Validates the logic for auto-assigning GitHub issues to Copilot bot,
 * including checks for existing assignments, sub-issues detection,
 * and issue filtering based on labels and state.
 */

const {
  shouldSkipIssue,
  shouldAssignNewIssue,
  parseIssueData,
  findAssignableIssue,
} = require("./assign-copilot.js");

describe("shouldSkipIssue", () => {
  test("should skip already assigned issues", () => {
    const issue = {
      isAssigned: true,
      hasSubIssues: false,
      isSubIssue: false,
      isRefactorIssue: false,
    };
    const result = shouldSkipIssue(issue);
    expect(result.shouldSkip).toBe(true);
    expect(result.reason).toBe("already assigned");
  });

  test("should skip issues with sub-issues", () => {
    const issue = {
      isAssigned: false,
      hasSubIssues: true,
      isRefactorIssue: false,
    };
    const result = shouldSkipIssue(issue);
    expect(result.shouldSkip).toBe(true);
    expect(result.reason).toBe("has sub-issues");
  });

  test("should not skip issues that are sub-issues themselves", () => {
    // Sub-issues (issues tracked by parent issues) CAN be assigned
    const issue = {
      isAssigned: false,
      hasSubIssues: false,
      isRefactorIssue: false,
    };
    const result = shouldSkipIssue(issue);
    expect(result.shouldSkip).toBe(false);
    expect(result.reason).toBeNull();
  });

  test("should skip refactor issues", () => {
    const issue = {
      isAssigned: false,
      hasSubIssues: false,
      isRefactorIssue: true,
    };
    const result = shouldSkipIssue(issue);
    expect(result.shouldSkip).toBe(true);
    expect(result.reason).toBe("is a refactor issue");
  });

  test("should not skip valid unassigned issues", () => {
    const issue = {
      isAssigned: false,
      hasSubIssues: false,
      isRefactorIssue: false,
    };
    const result = shouldSkipIssue(issue);
    expect(result.shouldSkip).toBe(false);
    expect(result.reason).toBeNull();
  });

  test("should prioritize checks in correct order", () => {
    // Multiple reasons to skip - should return first one checked
    const issue = {
      isAssigned: true,
      hasSubIssues: true,
      isRefactorIssue: true,
    };
    const result = shouldSkipIssue(issue);
    expect(result.shouldSkip).toBe(true);
    expect(result.reason).toBe("already assigned");
  });
});

describe("shouldAssignNewIssue", () => {
  test("should assign when Copilot has no issues", () => {
    const result = shouldAssignNewIssue([], "auto", false);
    expect(result.shouldAssign).toBe(true);
    expect(result.reason).toBe("Copilot has no assigned issues");
  });

  test("should not assign in auto mode when Copilot has issues and force=false", () => {
    const assignedIssues = [{ labels: [{ name: "bug" }] }];
    const result = shouldAssignNewIssue(assignedIssues, "auto", false);
    expect(result.shouldAssign).toBe(false);
    expect(result.reason).toBe(
      "Copilot already has assigned issues and force=false",
    );
  });

  test("should assign in auto mode when force=true even if Copilot has issues", () => {
    const assignedIssues = [{ labels: [{ name: "bug" }] }];
    const result = shouldAssignNewIssue(assignedIssues, "auto", true);
    expect(result.shouldAssign).toBe(true);
    expect(result.reason).toBe("Force flag is set");
  });

  test("should not assign refactor when Copilot already has refactor issue", () => {
    const assignedIssues = [{ labels: [{ name: "refactor" }] }];
    const result = shouldAssignNewIssue(assignedIssues, "refactor", false);
    expect(result.shouldAssign).toBe(false);
    expect(result.reason).toBe("Copilot already has a refactor issue assigned");
  });

  test("should not assign refactor when Copilot has other issues", () => {
    const assignedIssues = [{ labels: [{ name: "bug" }] }];
    const result = shouldAssignNewIssue(assignedIssues, "refactor", false);
    expect(result.shouldAssign).toBe(false);
    expect(result.reason).toBe(
      "Copilot is working on other issues, skipping refactor creation",
    );
  });

  test("should assign refactor when no issues assigned", () => {
    const result = shouldAssignNewIssue([], "refactor", false);
    expect(result.shouldAssign).toBe(true);
    expect(result.reason).toBe("Copilot has no assigned issues");
  });
});

describe("parseIssueData", () => {
  test("should correctly parse issue with no flags set", () => {
    const rawIssue = {
      id: "issue-1",
      number: 100,
      title: "Test Issue",
      url: "https://github.com/test/repo/issues/100",
      assignees: { nodes: [] },
      trackedIssues: { totalCount: 0 },
      trackedInIssues: { totalCount: 0 },
      labels: { nodes: [] },
    };
    const parsed = parseIssueData(rawIssue);
    expect(parsed.id).toBe("issue-1");
    expect(parsed.number).toBe(100);
    expect(parsed.title).toBe("Test Issue");
    expect(parsed.url).toBe("https://github.com/test/repo/issues/100");
    expect(parsed.isAssigned).toBe(false);
    expect(parsed.hasSubIssues).toBe(false);
    expect(parsed.isSubIssue).toBe(false);
    expect(parsed.isRefactorIssue).toBe(false);
  });

  test("should detect assigned issues", () => {
    const rawIssue = {
      id: "issue-1",
      number: 100,
      title: "Test Issue",
      url: "https://github.com/test/repo/issues/100",
      assignees: { nodes: [{ login: "copilot-swe-agent" }] },
      trackedIssues: { totalCount: 0 },
      trackedInIssues: { totalCount: 0 },
      labels: { nodes: [] },
    };
    const parsed = parseIssueData(rawIssue);
    expect(parsed.isAssigned).toBe(true);
  });

  test("should detect issues with sub-issues (trackedIssues)", () => {
    const rawIssue = {
      id: "issue-1",
      number: 79,
      title: "Parent Issue",
      url: "https://github.com/test/repo/issues/79",
      assignees: { nodes: [] },
      trackedIssues: { totalCount: 3 },
      trackedInIssues: { totalCount: 0 },
      labels: { nodes: [{ name: "bug" }] },
    };
    const parsed = parseIssueData(rawIssue);
    expect(parsed.hasSubIssues).toBe(true);
    expect(parsed.isSubIssue).toBe(false);
  });

  test("should detect issues that are sub-issues (trackedInIssues)", () => {
    const rawIssue = {
      id: "issue-1",
      number: 101,
      title: "Sub Issue",
      url: "https://github.com/test/repo/issues/101",
      assignees: { nodes: [] },
      trackedIssues: { totalCount: 0 },
      trackedInIssues: { totalCount: 1 },
      labels: { nodes: [{ name: "bug" }] },
    };
    const parsed = parseIssueData(rawIssue);
    expect(parsed.hasSubIssues).toBe(false);
    expect(parsed.isSubIssue).toBe(true);
  });

  test("should detect refactor issues", () => {
    const rawIssue = {
      id: "issue-1",
      number: 100,
      title: "Refactor Issue",
      url: "https://github.com/test/repo/issues/100",
      assignees: { nodes: [] },
      trackedIssues: { totalCount: 0 },
      trackedInIssues: { totalCount: 0 },
      labels: { nodes: [{ name: "refactor" }, { name: "enhancement" }] },
    };
    const parsed = parseIssueData(rawIssue);
    expect(parsed.isRefactorIssue).toBe(true);
  });

  test("should handle missing trackedIssues field", () => {
    const rawIssue = {
      id: "issue-1",
      number: 100,
      title: "Test Issue",
      url: "https://github.com/test/repo/issues/100",
      assignees: { nodes: [] },
      labels: { nodes: [] },
    };
    const parsed = parseIssueData(rawIssue);
    expect(parsed.hasSubIssues).toBe(false);
    expect(parsed.isSubIssue).toBe(false);
  });
});

describe("findAssignableIssue", () => {
  test("should return null when no issues provided", () => {
    const result = findAssignableIssue([]);
    expect(result).toBeNull();
  });

  test("should return first assignable issue", () => {
    const issues = [
      {
        id: "issue-1",
        number: 100,
        title: "Assigned Issue",
        url: "https://github.com/test/repo/issues/100",
        assignees: { nodes: [{ login: "user" }] },
        trackedIssues: { totalCount: 0 },
        trackedInIssues: { totalCount: 0 },
        labels: { nodes: [{ name: "bug" }] },
      },
      {
        id: "issue-2",
        number: 101,
        title: "Valid Issue",
        url: "https://github.com/test/repo/issues/101",
        assignees: { nodes: [] },
        trackedIssues: { totalCount: 0 },
        trackedInIssues: { totalCount: 0 },
        labels: { nodes: [{ name: "bug" }] },
      },
    ];
    const result = findAssignableIssue(issues);
    expect(result).not.toBeNull();
    expect(result.number).toBe(101);
  });

  test("should skip issues with sub-issues", () => {
    const issues = [
      {
        id: "issue-1",
        number: 79,
        title: "Parent Issue with Sub-issues",
        url: "https://github.com/test/repo/issues/79",
        assignees: { nodes: [] },
        trackedIssues: { totalCount: 2 },
        trackedInIssues: { totalCount: 0 },
        labels: { nodes: [{ name: "bug" }] },
      },
      {
        id: "issue-2",
        number: 102,
        title: "Valid Issue",
        url: "https://github.com/test/repo/issues/102",
        assignees: { nodes: [] },
        trackedIssues: { totalCount: 0 },
        trackedInIssues: { totalCount: 0 },
        labels: { nodes: [{ name: "bug" }] },
      },
    ];
    const result = findAssignableIssue(issues);
    expect(result).not.toBeNull();
    expect(result.number).toBe(102);
  });

  test("should not skip issues that are sub-issues themselves", () => {
    // Sub-issues CAN be assigned - only parent issues with sub-issues are skipped
    const issues = [
      {
        id: "issue-1",
        number: 103,
        title: "Sub-issue",
        url: "https://github.com/test/repo/issues/103",
        assignees: { nodes: [] },
        trackedIssues: { totalCount: 0 },
        trackedInIssues: { totalCount: 1 },
        labels: { nodes: [{ name: "bug" }] },
      },
      {
        id: "issue-2",
        number: 104,
        title: "Another Valid Issue",
        url: "https://github.com/test/repo/issues/104",
        assignees: { nodes: [] },
        trackedIssues: { totalCount: 0 },
        trackedInIssues: { totalCount: 0 },
        labels: { nodes: [{ name: "enhancement" }] },
      },
    ];
    const result = findAssignableIssue(issues);
    expect(result).not.toBeNull();
    // Should return the first issue (103) which is a sub-issue but still assignable
    expect(result.number).toBe(103);
  });

  test("should return null when all issues are skipped", () => {
    const issues = [
      {
        id: "issue-1",
        number: 100,
        title: "Assigned Issue",
        url: "https://github.com/test/repo/issues/100",
        assignees: { nodes: [{ login: "user" }] },
        trackedIssues: { totalCount: 0 },
        trackedInIssues: { totalCount: 0 },
        labels: { nodes: [{ name: "bug" }] },
      },
      {
        id: "issue-2",
        number: 79,
        title: "Has Sub-issues",
        url: "https://github.com/test/repo/issues/79",
        assignees: { nodes: [] },
        trackedIssues: { totalCount: 2 },
        trackedInIssues: { totalCount: 0 },
        labels: { nodes: [{ name: "bug" }] },
      },
    ];
    const result = findAssignableIssue(issues);
    expect(result).toBeNull();
  });
});

describe("Bug reproduction tests", () => {
  test("Bug #1: Issue 79 with sub-issues should be skipped", () => {
    // Issue 79 had sub-issues but was assigned anyway
    const issue79 = {
      id: "issue-79",
      number: 79,
      title: "Bugs",
      url: "https://github.com/mudman1986/devops-feed-hub/issues/79",
      assignees: { nodes: [] },
      trackedIssues: { totalCount: 3 }, // Has 3 sub-issues
      trackedInIssues: { totalCount: 0 },
      labels: { nodes: [{ name: "bug" }] },
    };

    const parsed = parseIssueData(issue79);
    const result = shouldSkipIssue(parsed);

    expect(parsed.hasSubIssues).toBe(true);
    expect(result.shouldSkip).toBe(true);
    expect(result.reason).toBe("has sub-issues");
  });

  test("Bug #2: Should not assign when Copilot already has issue 96", () => {
    // Issue 96 was already assigned to Copilot
    const assignedIssues = [
      {
        number: 96,
        labels: [{ name: "bug" }],
      },
    ];

    const result = shouldAssignNewIssue(assignedIssues, "auto", false);

    expect(result.shouldAssign).toBe(false);
    expect(result.reason).toBe(
      "Copilot already has assigned issues and force=false",
    );
  });

  test("Bug #3: GraphQL trackedIssues returns 0 but REST API shows sub-issues exist", async () => {
    // Issue 79 has sub-issues but GraphQL trackedIssues.totalCount is 0
    const issue79 = {
      id: "issue-79",
      number: 79,
      title: "Bugs",
      url: "https://github.com/mudman1986/devops-feed-hub/issues/79",
      assignees: { nodes: [] },
      trackedIssues: { totalCount: 0 }, // GraphQL reports 0
      trackedInIssues: { totalCount: 0 },
      labels: { nodes: [{ name: "bug" }] },
    };

    // Mock GitHub REST API
    const mockGithub = {
      rest: {
        issues: {
          listSubIssues: jest.fn().mockResolvedValue({
            data: [
              { number: 80, title: "Sub-issue 1" },
              { number: 81, title: "Sub-issue 2" },
              { number: 82, title: "Sub-issue 3" },
              { number: 103, title: "Sub-issue 4" },
            ],
          }),
        },
      },
    };

    const {
      hasSubIssuesViaREST,
      findAssignableIssueWithRESTCheck,
    } = require("./assign-copilot.js");

    // Test hasSubIssuesViaREST
    const hasSubIssues = await hasSubIssuesViaREST(
      mockGithub,
      "mudman1986",
      "devops-feed-hub",
      79,
    );
    expect(hasSubIssues).toBe(true);

    // Test findAssignableIssueWithRESTCheck
    const result = await findAssignableIssueWithRESTCheck(
      [issue79],
      mockGithub,
      "mudman1986",
      "devops-feed-hub",
    );
    expect(result).toBeNull(); // Should skip issue 79 even though GraphQL says totalCount: 0

    // Verify the REST API was called
    expect(mockGithub.rest.issues.listSubIssues).toHaveBeenCalledWith({
      owner: "mudman1986",
      repo: "devops-feed-hub",
      issue_number: 79,
      per_page: 1,
    });
  });
});

describe("normalizeIssueLabels", () => {
  const { normalizeIssueLabels } = require("./assign-copilot.js");

  test("should handle GraphQL structure with labels.nodes", () => {
    const issue = {
      labels: {
        nodes: [{ name: "bug" }, { name: "refactor" }],
      },
    };
    const normalized = normalizeIssueLabels(issue);
    expect(normalized).toEqual([{ name: "bug" }, { name: "refactor" }]);
  });

  test("should handle flattened array structure", () => {
    const issue = {
      labels: [{ name: "bug" }, { name: "enhancement" }],
    };
    const normalized = normalizeIssueLabels(issue);
    expect(normalized).toEqual([{ name: "bug" }, { name: "enhancement" }]);
  });

  test("should handle missing labels", () => {
    const issue = {};
    const normalized = normalizeIssueLabels(issue);
    expect(normalized).toEqual([]);
  });

  test("should handle empty labels.nodes", () => {
    const issue = {
      labels: {
        nodes: [],
      },
    };
    const normalized = normalizeIssueLabels(issue);
    expect(normalized).toEqual([]);
  });

  test("should handle empty labels array", () => {
    const issue = {
      labels: [],
    };
    const normalized = normalizeIssueLabels(issue);
    expect(normalized).toEqual([]);
  });
});

describe("shouldAssignNewIssue with GraphQL structure", () => {
  test("should handle GraphQL structure for refactor detection", () => {
    const assignedIssues = [
      {
        labels: {
          nodes: [{ name: "refactor" }],
        },
      },
    ];
    const result = shouldAssignNewIssue(assignedIssues, "refactor", false);
    expect(result.shouldAssign).toBe(false);
    expect(result.reason).toBe("Copilot already has a refactor issue assigned");
  });

  test("should handle GraphQL structure for non-refactor issues", () => {
    const assignedIssues = [
      {
        labels: {
          nodes: [{ name: "bug" }],
        },
      },
    ];
    const result = shouldAssignNewIssue(assignedIssues, "refactor", false);
    expect(result.shouldAssign).toBe(false);
    expect(result.reason).toBe(
      "Copilot is working on other issues, skipping refactor creation",
    );
  });

  test("should handle mixed label structures", () => {
    const assignedIssues = [
      {
        labels: {
          nodes: [{ name: "bug" }],
        },
      },
      {
        labels: [{ name: "enhancement" }],
      },
    ];
    const result = shouldAssignNewIssue(assignedIssues, "auto", false);
    expect(result.shouldAssign).toBe(false);
    expect(result.reason).toBe(
      "Copilot already has assigned issues and force=false",
    );
  });
});

describe("hasSubIssuesViaREST", () => {
  const { hasSubIssuesViaREST } = require("./assign-copilot.js");

  test("should return true when issue has sub-issues", async () => {
    const mockGithub = {
      rest: {
        issues: {
          listSubIssues: jest.fn().mockResolvedValue({
            data: [{ number: 80 }],
          }),
        },
      },
    };

    const result = await hasSubIssuesViaREST(mockGithub, "owner", "repo", 79);
    expect(result).toBe(true);
    expect(mockGithub.rest.issues.listSubIssues).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 79,
      per_page: 1,
    });
  });

  test("should return false when issue has no sub-issues", async () => {
    const mockGithub = {
      rest: {
        issues: {
          listSubIssues: jest.fn().mockResolvedValue({
            data: [],
          }),
        },
      },
    };

    const result = await hasSubIssuesViaREST(mockGithub, "owner", "repo", 100);
    expect(result).toBe(false);
  });

  test("should return false when REST API call fails", async () => {
    const mockGithub = {
      rest: {
        issues: {
          listSubIssues: jest
            .fn()
            .mockRejectedValue(new Error("API endpoint not found")),
        },
      },
    };

    // Suppress console.log for this test
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const result = await hasSubIssuesViaREST(mockGithub, "owner", "repo", 100);
    expect(result).toBe(false);

    consoleSpy.mockRestore();
  });
});

describe("findAssignableIssueWithRESTCheck", () => {
  const { findAssignableIssueWithRESTCheck } = require("./assign-copilot.js");

  test("should return issue when it has no sub-issues (GraphQL and REST agree)", async () => {
    const issue = {
      id: "issue-1",
      number: 100,
      title: "Valid Issue",
      url: "https://github.com/test/repo/issues/100",
      assignees: { nodes: [] },
      trackedIssues: { totalCount: 0 },
      trackedInIssues: { totalCount: 0 },
      labels: { nodes: [{ name: "bug" }] },
    };

    const mockGithub = {
      rest: {
        issues: {
          listSubIssues: jest.fn().mockResolvedValue({ data: [] }),
        },
      },
    };

    const result = await findAssignableIssueWithRESTCheck(
      [issue],
      mockGithub,
      "test",
      "repo",
    );

    expect(result).not.toBeNull();
    expect(result.number).toBe(100);
  });

  test("should skip issue when GraphQL says no sub-issues but REST API finds them", async () => {
    const issue = {
      id: "issue-79",
      number: 79,
      title: "Bugs",
      url: "https://github.com/test/repo/issues/79",
      assignees: { nodes: [] },
      trackedIssues: { totalCount: 0 }, // GraphQL says 0
      trackedInIssues: { totalCount: 0 },
      labels: { nodes: [{ name: "bug" }] },
    };

    const mockGithub = {
      rest: {
        issues: {
          listSubIssues: jest.fn().mockResolvedValue({
            data: [
              { number: 80 },
              { number: 81 },
              { number: 82 },
              { number: 103 },
            ],
          }),
        },
      },
    };

    // Suppress console.log for this test
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const result = await findAssignableIssueWithRESTCheck(
      [issue],
      mockGithub,
      "test",
      "repo",
    );

    expect(result).toBeNull();
    expect(mockGithub.rest.issues.listSubIssues).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("should skip issue when GraphQL already detected sub-issues", async () => {
    const issue = {
      id: "issue-79",
      number: 79,
      title: "Bugs",
      url: "https://github.com/test/repo/issues/79",
      assignees: { nodes: [] },
      trackedIssues: { totalCount: 4 }, // GraphQL correctly reports 4
      trackedInIssues: { totalCount: 0 },
      labels: { nodes: [{ name: "bug" }] },
    };

    const mockGithub = {
      rest: {
        issues: {
          listSubIssues: jest.fn().mockResolvedValue({ data: [] }),
        },
      },
    };

    const result = await findAssignableIssueWithRESTCheck(
      [issue],
      mockGithub,
      "test",
      "repo",
    );

    expect(result).toBeNull();
    // REST API should NOT be called since GraphQL already detected sub-issues
    expect(mockGithub.rest.issues.listSubIssues).not.toHaveBeenCalled();
  });

  test("should find first assignable issue after skipping ones with sub-issues", async () => {
    const issues = [
      {
        id: "issue-79",
        number: 79,
        title: "Has Sub-issues",
        url: "https://github.com/test/repo/issues/79",
        assignees: { nodes: [] },
        trackedIssues: { totalCount: 0 },
        trackedInIssues: { totalCount: 0 },
        labels: { nodes: [{ name: "bug" }] },
      },
      {
        id: "issue-100",
        number: 100,
        title: "Valid Issue",
        url: "https://github.com/test/repo/issues/100",
        assignees: { nodes: [] },
        trackedIssues: { totalCount: 0 },
        trackedInIssues: { totalCount: 0 },
        labels: { nodes: [{ name: "bug" }] },
      },
    ];

    const mockGithub = {
      rest: {
        issues: {
          listSubIssues: jest.fn().mockImplementation(({ issue_number }) => {
            if (issue_number === 79) {
              return Promise.resolve({ data: [{ number: 80 }] });
            }
            return Promise.resolve({ data: [] });
          }),
        },
      },
    };

    // Suppress console.log for this test
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const result = await findAssignableIssueWithRESTCheck(
      issues,
      mockGithub,
      "test",
      "repo",
    );

    expect(result).not.toBeNull();
    expect(result.number).toBe(100); // Should skip 79 and return 100
    expect(mockGithub.rest.issues.listSubIssues).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });
});

