import { GitHubClient } from "../github/githubClient.js";
import { LLMClient } from "../llm/llmClient.js";

export class Decomposer {
  constructor() {
    this.ghClient = new GitHubClient(process.env.GITHUB_TOKEN);
    this.llmClient = new LLMClient();
  }

  async decomposeMainTask(mainTask) {
    const subtasks = await this.llmClient.decomposeTask(mainTask);
    const mainIssue = await this.ghClient.createIssue(mainTask, "Main task");
    
    for (const subtask of subtasks) {
      await this.ghClient.createIssue(subtask, "Subtask", mainIssue.number);
    }
    
    return mainIssue.number;
  }
} 