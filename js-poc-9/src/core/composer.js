import { LLMClient } from "../llm/llmClient.js";
import { GitHubClient } from "../github/githubClient.js";

export class Composer {
  constructor() {
    this.llm = new LLMClient();
    this.github = new GitHubClient();
  }

  async composeAndCreateFinalPR(mainIssue, subtaskSolutions) {
    const composedSolution = await this.llm.composeSolutions(subtaskSolutions);
    return this.github.createPullRequest(
      `Final solution for #${mainIssue}`,
      `solution-main`,
      composedSolution,
      mainIssue
    );
  }
} 