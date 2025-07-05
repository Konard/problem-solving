import { LLMClient } from "../llm/llmClient.js";
import { GitHubClient } from "../github/githubClient.js";

export class TestGenerator {
  constructor() {
    this.llm = new LLMClient();
    this.github = new GitHubClient();
  }

  async generateAndCreateTestPR(issue) {
    const testCode = await this.llm.generateTest(issue.description);
    return this.github.createPullRequest(
      `Test for #${issue.number}`,
      `test-${issue.number}`,
      testCode,
      issue.number
    );
  }
}