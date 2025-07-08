import { LLMClient } from '../llm/llmClient.js';
import { GitHubClient } from '../github/githubClient.js';
import chalk from 'chalk';

export class Composer {
  constructor({ githubClient, llmClient }) {
    this.llm = llmClient || new LLMClient();
    this.github = githubClient || new GitHubClient();
  }

  async composeAndCreateFinalPR(mainIssue, subtaskSolutions) {
    try {
      console.log(chalk.gray('  🤖 Composing final solution...'));
      const composedSolution = await this.llm.composeSolutions(subtaskSolutions);
      
      console.log(chalk.gray('  📝 Creating final solution PR...'));
      const pr = await this.github.createPullRequest(
        `Final solution for #${mainIssue}`,
        `solution-main`,
        composedSolution,
        mainIssue
      );
      
      return {
        prNumber: pr.prNumber,
        content: composedSolution,
        url: pr.url
      };
    } catch (error) {
      console.error(chalk.red('  ❌ Error in composeAndCreateFinalPR:'), error.message);
      throw error;
    }
  }
} 