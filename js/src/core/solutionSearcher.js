import { LLMClient } from '../llm/llmClient.js';
import { GitHubClient } from '../github/githubClient.js';
import chalk from 'chalk';

export class SolutionSearcher {
  constructor({ githubClient, llmClient }) {
    this.llm = llmClient || new LLMClient();
    this.github = githubClient || new GitHubClient();
  }

  async searchAndCreateSolutionPR(issue, testCode) {
    try {
      console.log(chalk.gray('  🤖 Generating solution code...'));
      const solutionCode = await this.llm.generateSolution(issue.description, testCode);
      
      console.log(chalk.gray('  📝 Creating solution PR...'));
      const pr = await this.github.createPullRequest(
        `Solution for #${issue.number}`,
        `solution-${issue.number}`,
        solutionCode,
        issue.number
      );
      
      return {
        prNumber: pr.prNumber,
        content: solutionCode,
        url: pr.url
      };
    } catch (error) {
      console.error(chalk.red('  ❌ Error in searchAndCreateSolutionPR:'), error.message);
      throw error;
    }
  }
} 