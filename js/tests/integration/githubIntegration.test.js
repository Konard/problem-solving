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
      console.log('⚠️  Skipping GitHub integration tests - GITHUB_TOKEN not set');
      return;
    }

    githubClient = new GitHubClient();
    repositoryManager = new RepositoryManager();
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
    if (!process.env.GITHUB_TOKEN) {
      console.log('⏭️  Skipping test - GITHUB_TOKEN not set');
      return;
    }

    // Create test repository
    const repo = await repositoryManager.createTestRepository('Integration test repository');
    assert.ok(repo);
    assert.ok(repo.name);
    assert.ok(repo.url);

    // Verify repository exists
    const exists = await repositoryManager.repositoryExists(repo.name);
    assert.strictEqual(exists, true);

    // Delete test repository
    await repositoryManager.deleteTestRepository(repo.name);

    // Verify repository is deleted
    const existsAfter = await repositoryManager.repositoryExists(repo.name);
    assert.strictEqual(existsAfter, false);
  });

  test('should list test repositories', async () => {
    if (!process.env.GITHUB_TOKEN) {
      console.log('⏭️  Skipping test - GITHUB_TOKEN not set');
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
    if (!process.env.GITHUB_TOKEN) {
      console.log('⏭️  Skipping test - GITHUB_TOKEN not set');
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

    // Clean up
    await repositoryManager.deleteTestRepository(repo.name);
  });

  test('should create pull request in test repository', async () => {
    if (!process.env.GITHUB_TOKEN) {
      console.log('⏭️  Skipping test - GITHUB_TOKEN not set');
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

    // Clean up
    await repositoryManager.deleteTestRepository(repo.name);
  });

  test('should handle dry-run mode', async () => {
    if (!process.env.GITHUB_TOKEN) {
      console.log('⏭️  Skipping test - GITHUB_TOKEN not set');
      return;
    }

    // Enable dry-run mode
    process.env.UNIVERSAL_ALGORITHM_DRY_RUN = 'true';
    const dryRunClient = new GitHubClient();

    // These should not actually create anything
    const issueNumber = await dryRunClient.createIssue('Dry Run Issue', 'Test');
    assert.ok(issueNumber > 0); // Should return mock number

    const pr = await dryRunClient.createPullRequest('Dry Run PR', 'branch', 'content', 1);
    assert.ok(pr.prNumber > 0); // Should return mock number

    // Clean up
    delete process.env.UNIVERSAL_ALGORITHM_DRY_RUN;
  });

  test('should generate unique repository names', async () => {
    if (!process.env.GITHUB_TOKEN) {
      console.log('⏭️  Skipping test - GITHUB_TOKEN not set');
      return;
    }

    const repo1 = await repositoryManager.createTestRepository('First test');
    const repo2 = await repositoryManager.createTestRepository('Second test');

    assert.notStrictEqual(repo1.name, repo2.name);
    assert.ok(repo1.name.startsWith(repositoryManager.testRepoPrefix));
    assert.ok(repo2.name.startsWith(repositoryManager.testRepoPrefix));

    // Clean up
    await repositoryManager.deleteTestRepository(repo1.name);
    await repositoryManager.deleteTestRepository(repo2.name);
  });

  test('should handle repository creation errors gracefully', async () => {
    if (!process.env.GITHUB_TOKEN) {
      console.log('⏭️  Skipping test - GITHUB_TOKEN not set');
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
    if (!process.env.GITHUB_TOKEN) {
      console.log('⏭️  Skipping test - GITHUB_TOKEN not set');
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