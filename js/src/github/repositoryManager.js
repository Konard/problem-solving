import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import { randomUUID } from 'crypto';

export class RepositoryManager {
  constructor({
    repository = {
      owner: 'konard',
      name: 'problem-solving-test-',
    },
    deleteOnSuccess = false,
    octokit,
  }) {
    this.octokit = octokit || new Octokit({ 
      auth: process.env.GITHUB_TOKEN,
      baseUrl: process.env.GITHUB_API_BASE_URL || 'https://api.github.com',
      log: {
        error: (...args) => {
          if (!this.suppressGlobalOctokitErrors) {
            console.error(...args);
          }
        }
      }
    });
    
    this.repository = repository;
    this.repo = {
      owner: repository.owner,
      repo: repository.name,
    };
    this.deleteOnSuccess = deleteOnSuccess;
    this.suppressGlobalOctokitErrors = false;
  }

  /**
   * Handle rate limiting by waiting for the reset time
   */
  async handleRateLimit(error) {
    if (error.status === 429 && error.message.includes('rate limit')) {
      const resetTime = error.response?.headers?.['x-ratelimit-reset'];
      if (resetTime) {
        const waitTime = Math.max(0, (parseInt(resetTime) * 1000) - Date.now()) + 1000; // Add 1 second buffer
        console.log(chalk.yellow(`  ⏳ Rate limit hit, waiting ${Math.ceil(waitTime / 1000)} seconds until reset...`));
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return true; // Indicates we handled the rate limit
      }
    }
    return false; // Indicates we didn't handle the rate limit
  }

  /**
   * Execute a GitHub API call with rate limit handling
   */
  async executeWithRateLimit(apiCall) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.status === 403 && error.message.includes('rate limit')) {
          const handled = await this.handleRateLimit(error);
          if (handled && attempt < maxRetries) {
            console.log(chalk.blue(`  🔄 Retrying API call (attempt ${attempt + 1}/${maxRetries})...`));
            continue;
          }
        }
        throw error;
      }
    }
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
   * Create a repository with a unique name
   */
  async createRepository(description = 'Test repository for problem solving automation') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uuid = randomUUID().split('-')[0]; // Use first part of UUID for brevity
      const repoName = `${this.repository.name}${timestamp}-${uuid}`;
      
      console.log(chalk.blue(`  📦 Creating repository: ${repoName}`));
      
      const repo = await this.executeWithRateLimit(async () => {
        return await this.octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description: description,
          private: true, // Keep repos private
          auto_init: true, // Initialize with README
          gitignore_template: 'Node',
          license_template: 'unlicense'
        });
      });
      
      console.log(chalk.green(`  ✅ Repository created: ${repo.data.html_url}`));
      
      return {
        name: repoName,
        fullName: repo.data.full_name,
        url: repo.data.html_url,
        cloneUrl: repo.data.clone_url,
        sshUrl: repo.data.ssh_url,
        id: repo.data.id
      };
    } catch (error) {
      console.error(chalk.red('  ❌ Error creating repository:'), error.message);
      throw error;
    }
  }

  /**
   * Delete a repository
   */
  async deleteRepository(repoName) {
    try {
      console.log(chalk.yellow(`  🗑️  Deleting repository: ${repoName}`));
      
      await this.executeWithRateLimit(async () => {
        return await this.octokit.repos.delete({
          owner: this.repository.owner,
          repo: repoName
        });
      });
      
      console.log(chalk.green(`  ✅ Repository deleted: ${repoName}`));
    } catch (error) {
      console.error(chalk.red(`  ❌ Error deleting repository ${repoName}:`), error.message);
      throw error;
    }
  }

  /**
   * Check if a repository exists (suppress 404 error logging only for this check)
   */
  async repositoryExists(repoName) {
    // Suppress Octokit error logging globally for this check
    const prev = this.suppressGlobalOctokitErrors;
    this.suppressGlobalOctokitErrors = true;
    try {
      await this.executeWithRateLimit(async () => {
        return await this.octokit.repos.get(this.repo);
      });
      return true;
    } catch (error) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    } finally {
      this.suppressGlobalOctokitErrors = prev;
    }
  }

  /**
   * List all repositories (for cleanup purposes)
   */
  async listRepositories() {
    try {
      const repos = await this.executeWithRateLimit(async () => {
        return await this.octokit.repos.listForAuthenticatedUser({
          type: 'owner',
          sort: 'created',
          direction: 'desc',
          per_page: 100
        });
      });
      
      return repos.data.filter(repo => 
        repo.name.startsWith(this.repository.name) && 
        repo.owner.login === this.repository.owner
      );
    } catch (error) {
      console.error(chalk.red('  ❌ Error listing repositories:'), error.message);
      throw error;
    }
  }

  /**
   * Clean up old repositories (older than specified days)
   */
  async cleanupOldRepositories(daysOld = 7) {
    try {
      console.log(chalk.blue(`  🧹 Cleaning up repositories older than ${daysOld} days`));
      
      const repos = await this.listRepositories();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let deletedCount = 0;
      
      for (const repo of repos) {
        const createdAt = new Date(repo.created_at);
        if (createdAt < cutoffDate) {
          try {
            await this.deleteRepository(repo.name);
            deletedCount++;
          } catch (error) {
            console.error(chalk.red(`  ❌ Failed to delete ${repo.name}:`), error.message);
          }
        }
      }
      
      console.log(chalk.green(`  ✅ Cleaned up ${deletedCount} old repositories`));
      return deletedCount;
    } catch (error) {
      console.error(chalk.red('  ❌ Error during cleanup:'), error.message);
      throw error;
    }
  }
} 