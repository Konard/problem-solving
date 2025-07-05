import { GitHubClient } from "../github/githubClient.js";
import { LLMClient } from "../llm/llmClient.js";

export class SolutionSearcher {
  constructor() {
    this.ghClient = new GitHubClient(process.env.GITHUB_TOKEN);
    this.llmClient = new LLMClient();
  }

  async solveSubTasks(mainIssueId) {
    const subtasks = await this.ghClient.getSubTasks(mainIssueId);
    const solutions = [];
    
    for (const task of subtasks) {
      const testCode = await this.llmClient.generateTest(task.title);
      const solutionCode = await this.llmClient.generateSolution(task.title, testCode);
      solutions.push(solutionCode);
      
      await this.ghClient.createPullRequest(
        `Solution for: ${task.title}`,
        `solution-${task.title}`,
        solutionCode
      );
    }
    
    return solutions;
  }
} 