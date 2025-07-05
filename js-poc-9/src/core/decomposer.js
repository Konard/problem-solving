import { LLMClient } from "../llm/llmClient.js";
import { GitHubClient } from "../github/githubClient.js";

export class Decomposer {
  constructor() {
    this.llm = new LLMClient();
    this.github = new GitHubClient();
  }

  async decomposeAndCreateIssues(mainTask) {
    const subtasks = await this.llm.decomposeTask(mainTask);
    const mainIssue = await this.github.createIssue(mainTask, "Main task");
    
    for (const subtask of subtasks) {
      await this.github.createIssue(subtask, "Subtask", mainIssue);
    }
    
    return { mainIssue, subtasks };
  }
} 