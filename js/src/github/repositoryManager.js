import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import { randomUUID } from 'crypto';

export class RepositoryManager {
  constructor() {
    this.octokit = new Octokit({ 
      auth: process.env.GITHUB_TOKEN,
      baseUrl: process.env.GITHUB_API_BASE_URL || 'https://api.github.com'
    });
    
    this.testRepoOwner = process.env.TEST_REPO_OWNER || 'konard';
    this.testRepoPrefix = process.env.TEST_REPO_PREFIX || 'problem-solving-test-';
    this.deleteOnSuccess = process.env.TEST_REPO_DELETE_ON_SUCCESS === 'true';
  }

  /**
   * Generate a sortable UUID (version 7) for repository naming
   * Format: 2024-01-15T10:30:45.123Z-abc1234-def5-6789-ghij-klmnopqrstuv
   */
  generateSortableUUID() {
    const timestamp = new Date().toISOString();
    const uuid = randomUUID();
    return `${timestamp}-${uuid}`;
  }

  /**
   * Create a test repository with a unique name
   */
  async createTestRepository(description = 'Test repository for problem solving automation') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uuid = randomUUID().split('-')[0]; // Use first part of UUID for brevity
      const repoName = `${this.testRepoPrefix}${timestamp}-${uuid}`;
      
      console.log(chalk.blue(`  📦 Creating test repository: ${repoName}`));
      
      const repo = await this.octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: description,
        private: true, // Keep test repos private
        auto_init: true, // Initialize with README
        gitignore_template: 'Node',
        license_template: 'mit'
      });
      
      console.log(chalk.green(`  ✅ Test repository created: ${repo.data.html_url}`));
      
      return {
        name: repoName,
        fullName: repo.data.full_name,
        url: repo.data.html_url,
        cloneUrl: repo.data.clone_url,
        sshUrl: repo.data.ssh_url,
        id: repo.data.id
      };
    } catch (error) {
      console.error(chalk.red('  ❌ Error creating test repository:'), error.message);
      throw error;
    }
  }

  /**
   * Delete a test repository
   */
  async deleteTestRepository(repoName) {
    try {
      console.log(chalk.yellow(`  🗑️  Deleting test repository: ${repoName}`));
      
      await this.octokit.repos.delete({
        owner: this.testRepoOwner,
        repo: repoName
      });
      
      console.log(chalk.green(`  ✅ Test repository deleted: ${repoName}`));
    } catch (error) {
      console.error(chalk.red(`  ❌ Error deleting test repository ${repoName}:`), error.message);
      throw error;
    }
  }

  /**
   * Check if a repository exists
   */
  async repositoryExists(repoName) {
    try {
      await this.octokit.repos.get({
        owner: this.testRepoOwner,
        repo: repoName
      });
      return true;
    } catch (error) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * List all test repositories (for cleanup purposes)
   */
  async listTestRepositories() {
    try {
      const repos = await this.octokit.repos.listForAuthenticatedUser({
        type: 'owner',
        sort: 'created',
        direction: 'desc',
        per_page: 100
      });
      
      return repos.data.filter(repo => 
        repo.name.startsWith(this.testRepoPrefix) && 
        repo.owner.login === this.testRepoOwner
      );
    } catch (error) {
      console.error(chalk.red('  ❌ Error listing test repositories:'), error.message);
      throw error;
    }
  }

  /**
   * Clean up old test repositories (older than specified days)
   */
  async cleanupOldTestRepositories(daysOld = 7) {
    try {
      console.log(chalk.blue(`  🧹 Cleaning up test repositories older than ${daysOld} days`));
      
      const repos = await this.listTestRepositories();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let deletedCount = 0;
      
      for (const repo of repos) {
        const createdAt = new Date(repo.created_at);
        if (createdAt < cutoffDate) {
          try {
            await this.deleteTestRepository(repo.name);
            deletedCount++;
          } catch (error) {
            console.error(chalk.red(`  ❌ Failed to delete ${repo.name}:`), error.message);
          }
        }
      }
      
      console.log(chalk.green(`  ✅ Cleaned up ${deletedCount} old test repositories`));
      return deletedCount;
    } catch (error) {
      console.error(chalk.red('  ❌ Error during cleanup:'), error.message);
      throw error;
    }
  }
} 