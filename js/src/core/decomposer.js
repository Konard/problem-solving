import { LLMClient } from '../llm/llmClient.js';
import { GitHubClient } from '../github/githubClient.js';
import chalk from 'chalk';

export class Decomposer {
  constructor({ githubClient, llmClient }) {
    this.llm = llmClient || new LLMClient();
    this.github = githubClient || new GitHubClient();
  }

  async decomposeAndCreateIssues(mainTask) {
    try {
      console.log(chalk.gray('  🤖 Using LLM to decompose task...'));
      const subtaskDescriptions = await this.llm.decomposeTask(mainTask);
      
      console.log(chalk.gray('  📝 Creating main issue...'));
      const mainIssue = await this.github.createIssue(mainTask, "Main task");
      
      const subtasks = [];
      for (const description of subtaskDescriptions) {
        console.log(chalk.gray(`  📝 Creating subtask issue: ${description.substring(0, 50)}...`));
        const issueNumber = await this.github.createIssue(description, "Subtask", mainIssue);
        subtasks.push({
          number: issueNumber,
          title: description,
          description: description
        });
      }
      
      return { mainIssue, subtasks };
    } catch (error) {
      console.error(chalk.red('  ❌ Error in decomposeAndCreateIssues:'), error.message);
      throw error;
    }
  }

  async decomposeTask(taskDescription) {
    try {
      return await this.llm.decomposeTask(taskDescription);
    } catch (error) {
      console.error(chalk.red('  ❌ Error in decomposeTask:'), error.message);
      throw error;
    }
  }
} 