import { Decomposer } from "../src/core/decomposer.js";

describe("Decomposer", () => {
  it("should decompose tasks and create GitHub issues", async () => {
    const decomposer = new Decomposer();
    const result = await decomposer.decomposeAndCreateIssues("Test task");
    expect(result.mainIssue).toBeDefined();
    expect(result.subtasks.length).toBeGreaterThan(0);
  });
});
