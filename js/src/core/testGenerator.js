import { LLMClient } from '../llm/llmClient.js';
import { GitHubClient } from '../github/githubClient.js';
import chalk from 'chalk';

export class TestGenerator {
  constructor({ githubClient, llmClient }) {
    this.llm = llmClient || new LLMClient();
    this.github = githubClient || new GitHubClient();
  }

  async generateAndCreateTestPR(issue) {
    try {
      console.log(chalk.gray('  🤖 Generating test code...'));
      const testCode = await this.llm.generateTest(issue.description);
      
      console.log(chalk.gray('  📝 Creating test PR...'));
      const pr = await this.github.createPullRequest(
        `Test for #${issue.number}`,
        `test-${issue.number}`,
        testCode,
        issue.number
      );
      
      return {
        prNumber: pr.prNumber,
        content: testCode,
        url: pr.url
      };
    } catch (error) {
      console.error(chalk.red('  ❌ Error in generateAndCreateTestPR:'), error.message);
      throw error;
    }
  }

  async generateTest(taskDescription) {
    try {
      return await this.llm.generateTest(taskDescription);
    } catch (error) {
      console.error(chalk.red('  ❌ Error in generateTest:'), error.message);
      throw error;
    }
  }
} 