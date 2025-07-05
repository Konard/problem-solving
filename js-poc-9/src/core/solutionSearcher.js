import { LLMClient } from "../llm/llmClient.js";
import { GitHubClient } from "../github/githubClient.js";

export class SolutionSearcher {
  constructor() {
    this.llm = new LLMClient();
    this.github = new GitHubClient();
  }

  async searchAndCreateSolutionPR(issue, testCode) {
    const solutionCode = await this.llm.generateSolution(issue.description, testCode);
    return this.github.createPullRequest(
      `Solution for #${issue.number}`,
      `solution-${issue.number}`,
      solutionCode,
      issue.number
    );
  }
} 