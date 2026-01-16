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
});
