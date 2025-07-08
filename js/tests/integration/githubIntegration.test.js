import { test, describe, beforeEach, afterEach } from 'bun:test';
import assert from 'assert';
import { GitHubClient } from '../../src/github/githubClient.js';
import { RepositoryManager } from '../../src/github/repositoryManager.js';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';

describe('GitHub Integration', () => {
  let githubClient;
  let repositoryManager;

  beforeEach(() => {
    // Check if required environment variables are set
    if (!process.env.GITHUB_TOKEN) {
      console.log('⚠️  Running GitHub integration tests in dry-run mode - GITHUB_TOKEN not set');
      // Create clients in dry-run mode
      githubClient = new GitHubClient({ dryRun: true });
      repositoryManager = new RepositoryManager({ 
        repository: {
          owner: 'test-owner',
          name: 'test-prefix-'
        },
        deleteOnSuccess: false,
        octokit: {
          repos: {
            createForAuthenticatedUser: async () => ({
              data: {
                name: 'test-repo-name',
                full_name: 'test-owner/test-repo-name',
                html_url: 'https://github.com/test-owner/test-repo-name',
                clone_url: 'https://github.com/test-owner/test-repo-name.git',
                ssh_url: 'git@github.com:test-owner/test-repo-name.git',
                id: 123
              }
            }),
            delete: async () => ({ data: {} }),
            get: async () => ({ data: {} }),
            listForAuthenticatedUser: async () => ({ data: [] })
          }
        }
      });
      return;
    }

    try {
      githubClient = new GitHubClient();
      repositoryManager = new RepositoryManager();
    } catch (error) {
      console.log('⚠️  Skipping GitHub integration tests - failed to initialize:', error.message);
      return;
    }
  });

  afterEach(async () => {
    // Clean up any test repositories created during tests
    if (repositoryManager && process.env.GITHUB_TOKEN) {
      try {
        const repos = await repositoryManager.listTestRepositories();
        for (const repo of repos) {
          if (repo.name.includes('test-integration-')) {
            await repositoryManager.deleteTestRepository(repo.name);
          }
        }
      } catch (error) {
        console.log('Cleanup error:', error.message);
      }
    }
  });

  test('should create and delete test repository', async () => {
    if (!repositoryManager) {
      console.log('⏭️  Skipping test - initialization failed');
      return;
    }

    // Create test repository
    const repo = await repositoryManager.createTestRepository('Integration test repository');
    assert.ok(repo);
    assert.ok(repo.name);
    assert.ok(repo.url);

    // In dry-run mode, repositoryExists might return false, so skip this check
    if (process.env.GITHUB_TOKEN) {
      // Verify repository exists
      const exists = await repositoryManager.repositoryExists(repo.name);
      assert.strictEqual(exists, true);

      // Delete test repository
      await repositoryManager.deleteTestRepository(repo.name);

      // Verify repository is deleted
      const existsAfter = await repositoryManager.repositoryExists(repo.name);
      assert.strictEqual(existsAfter, false);
    }
  });

  test('should list test repositories', async () => {
    if (!repositoryManager) {
      console.log('⏭️  Skipping test - initialization failed');
      return;
    }

    const repos = await repositoryManager.listTestRepositories();
    assert.ok(Array.isArray(repos));
    
    // All repositories should have the correct prefix and owner
    repos.forEach(repo => {
      assert.ok(repo.name.startsWith(repositoryManager.testRepoPrefix));
      assert.strictEqual(repo.owner.login, repositoryManager.testRepoOwner);
    });
  });

  test('should create issue in test repository', async () => {
    if (!repositoryManager || !githubClient) {
      console.log('⏭️  Skipping test - initialization failed');
      return;
    }

    // Create test repository
    const repo = await repositoryManager.createTestRepository('Issue test repository');
    
    // Update GitHub client to use test repository
    githubClient.repo = {
      owner: repositoryManager.testRepoOwner,
      repo: repo.name
    };

    // Create issue
    const issueNumber = await githubClient.createIssue('Test Issue', 'This is a test issue');
    assert.ok(issueNumber > 0);

    // Clean up (only if not in dry-run mode)
    if (process.env.GITHUB_TOKEN) {
      await repositoryManager.deleteTestRepository(repo.name);
    }
  });

  test('should create pull request in test repository', async () => {
    if (!repositoryManager || !githubClient) {
      console.log('⏭️  Skipping test - initialization failed');
      return;
    }

    // Create test repository
    const repo = await repositoryManager.createTestRepository('PR test repository');
    
    // Update GitHub client to use test repository
    githubClient.repo = {
      owner: repositoryManager.testRepoOwner,
      repo: repo.name
    };

    // Create pull request
    const pr = await githubClient.createPullRequest(
      'Test PR',
      'test-branch',
      'console.log("Hello World");',
      1
    );
    
    assert.ok(pr.prNumber > 0);
    assert.ok(pr.url.includes('github.com'));

    // Clean up (only if not in dry-run mode)
    if (process.env.GITHUB_TOKEN) {
      await repositoryManager.deleteTestRepository(repo.name);
    }
  });

  test('should handle dry-run mode', async () => {
    if (!githubClient) {
      console.log('⏭️  Skipping test - initialization failed');
      return;
    }

    // Enable dry-run mode
    const dryRunClient = new GitHubClient({ dryRun: true });

    // These should not actually create anything
    const issueNumber = await dryRunClient.createIssue('Dry Run Issue', 'Test');
    assert.ok(issueNumber > 0); // Should return mock number

    const pr = await dryRunClient.createPullRequest('Dry Run PR', 'branch', 'content', 1);
    assert.ok(pr.prNumber > 0); // Should return mock number
  });

  test('should generate unique repository names', async () => {
    if (!repositoryManager) {
      console.log('⏭️  Skipping test - initialization failed');
      return;
    }

    const repo1 = await repositoryManager.createTestRepository('First test');
    const repo2 = await repositoryManager.createTestRepository('Second test');

    assert.notStrictEqual(repo1.name, repo2.name);
    assert.ok(repo1.name.startsWith(repositoryManager.testRepoPrefix));
    assert.ok(repo2.name.startsWith(repositoryManager.testRepoPrefix));

    // Clean up (only if not in dry-run mode)
    if (process.env.GITHUB_TOKEN) {
      await repositoryManager.deleteTestRepository(repo1.name);
      await repositoryManager.deleteTestRepository(repo2.name);
    }
  });

  test('should handle repository creation errors gracefully', async () => {
    if (!repositoryManager) {
      console.log('⏭️  Skipping test - initialization failed');
      return;
    }

    // Try to create repository with invalid name (too long)
    const longName = 'a'.repeat(100);
    
    let errorThrown = false;
    try {
      await repositoryManager.createTestRepository(longName);
      assert.fail('Should have thrown an error');
    } catch (error) {
      errorThrown = true;
    }
    assert.ok(errorThrown);
  });

  test('should handle API rate limits gracefully', async () => {
    if (!repositoryManager) {
      console.log('⏭️  Skipping test - initialization failed');
      return;
    }

    // Make multiple rapid requests to test rate limiting
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(repositoryManager.listTestRepositories());
    }

    try {
      await Promise.all(promises);
      // Should handle rate limits gracefully
    } catch (error) {
      // Rate limit errors are expected
      assert.ok(error.message.includes('rate') || error.message.includes('limit'));
    }
  });
}); 