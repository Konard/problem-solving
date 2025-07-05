import { test, expect, describe, beforeEach } from "bun:test";
import { UniversalAlgorithm } from "../src/orchestrator.js";

describe("Universal Algorithm Orchestrator", () => {
  let ua;
  
  beforeEach(() => {
    // Create a new instance for each test with dry-run mode
    ua = new UniversalAlgorithm({
      debug: false,
    });
    
    // Set dry-run mode for tests
    process.env.UA_DRY_RUN = "true";
    process.env.GITHUB_OWNER = "test-owner";
    process.env.GITHUB_REPO = "test-repo";
  });

  test("should initialize with default state", () => {
    expect(ua.currentTask).toBeNull();
    expect(ua.workflowState.phase).toBe("idle");
    expect(ua.workflowState.subIssues).toEqual([]);
    expect(ua.workflowState.tests).toEqual([]);
    expect(ua.workflowState.solutions).toEqual([]);
  });

  test("should calculate progress correctly", () => {
    // Initial state
    expect(ua.calculateProgress()).toBe(0);
    
    // Set different phases
    ua.workflowState.phase = "decomposition";
    expect(ua.calculateProgress()).toBe(0);
    
    ua.workflowState.phase = "issue_creation";
    expect(ua.calculateProgress()).toBe(20);
    
    ua.workflowState.phase = "completed";
    expect(ua.calculateProgress()).toBe(100);
  });

  test("should get status correctly", () => {
    ua.currentTask = "Test task";
    ua.workflowState.phase = "decomposition";
    ua.workflowState.startTime = new Date().toISOString();
    
    const status = ua.getStatus();
    
    expect(status.phase).toBe("decomposition");
    expect(status.task).toBe("Test task");
    expect(status.progress).toBe(0);
    expect(status.startTime).toBeDefined();
  });

  test("should pause and resume workflow", () => {
    ua.pause();
    expect(ua.workflowState.paused).toBe(true);
    expect(ua.workflowState.pausedAt).toBeDefined();
    
    ua.resume();
    expect(ua.workflowState.paused).toBe(false);
    expect(ua.workflowState.resumedAt).toBeDefined();
  });

  test("should reset workflow state", () => {
    // Set some state
    ua.currentTask = "Test task";
    ua.workflowState.phase = "decomposition";
    ua.workflowState.subIssues = [{ id: 1 }];
    
    // Reset
    ua.reset();
    
    expect(ua.currentTask).toBeNull();
    expect(ua.workflowState.phase).toBe("idle");
    expect(ua.workflowState.subIssues).toEqual([]);
  });

  test("should calculate workflow duration", () => {
    const now = new Date();
    const start = new Date(now.getTime() - 65000); // 1 minute 5 seconds ago
    
    ua.workflowState.startTime = start.toISOString();
    ua.workflowState.endTime = now.toISOString();
    
    const duration = ua.calculateWorkflowDuration();
    expect(duration).toBe("1m 5s");
  });

  test("should calculate average complexity", () => {
    ua.workflowState.decomposition = {
      subtasks: [
        { estimatedComplexity: 3 },
        { estimatedComplexity: 5 },
        { estimatedComplexity: 7 },
      ],
    };
    
    const avgComplexity = ua.calculateAverageComplexity();
    expect(avgComplexity).toBe(5); // (3 + 5 + 7) / 3 = 5
  });

  test("should create main issue body correctly", () => {
    const decomposition = {
      originalTask: "Test task",
      subtasks: [
        {
          title: "Subtask 1",
          description: "First subtask",
          priority: "high",
          estimatedComplexity: 5,
          dependencies: [],
          acceptanceCriteria: ["Criterion 1", "Criterion 2"],
        },
      ],
      metadata: {
        estimatedTotalComplexity: 5,
        decompositionReasoning: "Test reasoning",
      },
    };
    
    ua.currentTask = "Test task";
    const body = ua.createMainIssueBody(decomposition);
    
    expect(body).toContain("Test task");
    expect(body).toContain("Subtask 1");
    expect(body).toContain("First subtask");
    expect(body).toContain("Priority: high");
    expect(body).toContain("Criterion 1");
    expect(body).toContain("Criterion 2");
  });

  test("should create sub-issue body correctly", () => {
    const subtask = {
      title: "Test Subtask",
      description: "Test description",
      priority: "medium",
      estimatedComplexity: 6,
      dependencies: ["dep1", "dep2"],
      acceptanceCriteria: ["AC1", "AC2"],
    };
    
    const body = ua.createSubIssueBody(subtask);
    
    expect(body).toContain("Test Subtask");
    expect(body).toContain("Test description");
    expect(body).toContain("medium");
    expect(body).toContain("6/10");
    expect(body).toContain("dep1");
    expect(body).toContain("dep2");
    expect(body).toContain("AC1");
    expect(body).toContain("AC2");
  });

  test("should execute decomposition phase", async () => {
    const taskDescription = "Build a simple calculator";
    
    await ua.executeDecomposition(taskDescription);
    
    expect(ua.workflowState.phase).toBe("decomposition");
    expect(ua.workflowState.decomposition).toBeDefined();
    expect(ua.workflowState.decomposition.originalTask).toBe(taskDescription);
    expect(ua.workflowState.decomposition.subtasks).toBeDefined();
    expect(Array.isArray(ua.workflowState.decomposition.subtasks)).toBe(true);
  });

  test("should generate workflow summary", () => {
    // Setup mock state
    ua.currentTask = "Test task";
    ua.workflowState.startTime = new Date(Date.now() - 60000).toISOString();
    ua.workflowState.endTime = new Date().toISOString();
    ua.workflowState.decomposition = {
      subtasks: [
        { estimatedComplexity: 5 },
        { estimatedComplexity: 3 },
      ],
    };
    ua.workflowState.subIssues = [{ number: 1 }, { number: 2 }];
    ua.workflowState.tests = [{ id: 1 }];
    ua.workflowState.solutions = [{ id: 1 }];
    ua.workflowState.mainIssue = { number: 100 };
    
    const summary = ua.generateWorkflowSummary();
    
    expect(summary.taskDescription).toBe("Test task");
    expect(summary.duration).toBeDefined();
    expect(summary.statistics.subtasksTotal).toBe(2);
    expect(summary.statistics.testsGenerated).toBe(1);
    expect(summary.statistics.solutionsFound).toBe(1);
    expect(summary.statistics.successRate).toBe(50); // 1/2 * 100
    expect(summary.artifacts.mainIssue).toBe(100);
    expect(summary.artifacts.subIssues).toEqual([1, 2]);
  });
}); 