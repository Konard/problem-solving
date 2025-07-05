import { Orchestrator } from "../src/orchestrator.js";

describe("Orchestrator", () => {
  it("should execute the full workflow", async () => {
    const orchestrator = new Orchestrator();
    await expect(orchestrator.execute("Test task")).resolves.not.toThrow();
  });
});