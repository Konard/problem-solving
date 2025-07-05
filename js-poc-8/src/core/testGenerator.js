import { GitHubClient } from "../github/githubClient.js";
import { LLMClient } from "../llm/llmClient.js";

export class TestGenerator {
  constructor() {
    this.ghClient = new GitHubClient(process.env.GITHUB_TOKEN);
    this.llmClient = new LLMClient();
  }

  async generateTestsForIssue(issueId) {
    const subtasks = await this.ghClient.getSubTasks(issueId);
    
    for (const task of subtasks) {
      const testCode = await this.llmClient.generateTest(task.title);
      await this.ghClient.createPullRequest(
        `Test for: ${task.title}`,
        `test-${task.title}`,
        testCode
      );
    }
  }
} 