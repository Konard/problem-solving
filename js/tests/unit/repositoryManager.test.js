import { test, describe, beforeEach, afterEach } from 'bun:test';
import assert from 'assert';
import { RepositoryManager } from '../../src/github/repositoryManager.js';
import { GitHubClient } from '../../src/github/githubClient.js';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';

describe('RepositoryManager', () => {
  let repoManager;
  let mockOctokit;

  beforeEach(() => {
    // Mock environment variables
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.TEST_REPO_OWNER = 'test-owner';
    process.env.TEST_REPO_PREFIX = 'test-prefix-';
    process.env.TEST_REPO_DELETE_ON_SUCCESS = 'true';

    // Create mock Octokit
    mockOctokit = {
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
        listForAuthenticatedUser: async () => ({
          data: [
            {
              name: 'test-prefix-2024-01-15T10-30-45-123Z-abc1234',
              owner: { login: 'test-owner' },
              created_at: '2024-01-15T10:30:45Z'
            },
            {
              name: 'test-prefix-2024-01-10T10-30-45-123Z-def5678',
              owner: { login: 'test-owner' },
              created_at: '2024-01-10T10:30:45Z'
            },
            {
              name: 'other-repo',
              owner: { login: 'test-owner' },
              created_at: '2024-01-15T10:30:45Z'
            }
          ]
        })
      }
    };

    // Create repository manager with mocked Octokit
    repoManager = new RepositoryManager();
    repoManager.octokit = mockOctokit;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GITHUB_TOKEN;
    delete process.env.TEST_REPO_OWNER;
    delete process.env.TEST_REPO_PREFIX;
    delete process.env.TEST_REPO_DELETE_ON_SUCCESS;
  });

  test('should be instantiable', () => {
    assert.ok(repoManager);
    assert.ok(repoManager.octokit);
    assert.strictEqual(repoManager.testRepoOwner, 'test-owner');
    assert.strictEqual(repoManager.testRepoPrefix, 'test-prefix-');
    assert.strictEqual(repoManager.deleteOnSuccess, true);
  });

  test('should use default values when env vars not set', () => {
    delete process.env.TEST_REPO_OWNER;
    delete process.env.TEST_REPO_PREFIX;
    delete process.env.TEST_REPO_DELETE_ON_SUCCESS;

    const defaultRepoManager = new RepositoryManager();
    assert.strictEqual(defaultRepoManager.testRepoOwner, 'konard');
    assert.strictEqual(defaultRepoManager.testRepoPrefix, 'problem-solving-test-');
    assert.strictEqual(defaultRepoManager.deleteOnSuccess, false);
  });

  describe('generateSortableUUID', () => {
    test('should generate sortable UUID', () => {
      const uuid = repoManager.generateSortableUUID();
      assert.ok(uuid);
      assert.ok(uuid.includes('-'));
      assert.ok(uuid.length > 20);
      
      // Should contain timestamp
      const parts = uuid.split('-');
      assert.ok(parts.length >= 2);
    });

    test('should generate unique UUIDs', () => {
      const uuid1 = repoManager.generateSortableUUID();
      const uuid2 = repoManager.generateSortableUUID();
      assert.notStrictEqual(uuid1, uuid2);
    });
  });

  describe('createTestRepository', () => {
    test('should create test repository successfully', async () => {
      const repo = await repoManager.createTestRepository('Test description');

      assert.ok(repo);
      assert.ok(repo.name.startsWith('test-prefix-'));
      assert.strictEqual(repo.fullName, 'test-owner/test-repo-name');
      assert.strictEqual(repo.url, 'https://github.com/test-owner/test-repo-name');
    });

    test('should create repository with default description', async () => {
      const repo = await repoManager.createTestRepository();

      assert.ok(repo);
      assert.ok(repo.name.startsWith('test-prefix-'));
      assert.strictEqual(repo.fullName, 'test-owner/test-repo-name');
      assert.strictEqual(repo.url, 'https://github.com/test-owner/test-repo-name');
    });

    test('should generate unique repository name', async () => {
      // Mock the timestamp generation to be predictable
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super('2024-01-15T10:30:45.123Z');
        }
        toISOString() {
          return '2024-01-15T10:30:45.123Z';
        }
      };

      const repo = await repoManager.createTestRepository();
      assert.ok(repo.name.startsWith('test-prefix-2024-01-15T10-30-45-123Z-'));
      
      global.Date = originalDate;
    });

    test('should handle errors in repository creation', async () => {
      mockOctokit.repos.createForAuthenticatedUser = async () => {
        throw new Error('Repository creation failed');
      };

      try {
        await repoManager.createTestRepository('Test description');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Repository creation failed');
      }
    });
  });

  describe('deleteTestRepository', () => {
    test('should delete repository successfully', async () => {
      await repoManager.deleteTestRepository('test-repo-name');
      // Should not throw error
    });

    test('should handle errors in repository deletion', async () => {
      mockOctokit.repos.delete = async () => {
        throw new Error('Repository deletion failed');
      };

      try {
        await repoManager.deleteTestRepository('test-repo-name');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Repository deletion failed');
      }
    });
  });

  describe('repositoryExists', () => {
    test('should return true when repository exists', async () => {
      const exists = await repoManager.repositoryExists('test-repo-name');
      assert.strictEqual(exists, true);
    });

    test('should return false when repository does not exist', async () => {
      mockOctokit.repos.get = async () => {
        const error = new Error('Not Found');
        error.status = 404;
        throw error;
      };

      const exists = await repoManager.repositoryExists('non-existent-repo');
      assert.strictEqual(exists, false);
    });

    test('should throw error for other API errors', async () => {
      mockOctokit.repos.get = async () => {
        throw new Error('API Error');
      };

      try {
        await repoManager.repositoryExists('test-repo-name');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'API Error');
      }
    });
  });

  describe('listTestRepositories', () => {
    test('should list test repositories successfully', async () => {
      const repos = await repoManager.listTestRepositories();
      
      assert.ok(Array.isArray(repos));
      assert.strictEqual(repos.length, 2); // Only test-prefix repos
      
      // Check that only test repositories are returned
      repos.forEach(repo => {
        assert.ok(repo.name.startsWith('test-prefix-'));
        assert.strictEqual(repo.owner.login, 'test-owner');
      });
    });

    test('should handle errors in listing repositories', async () => {
      mockOctokit.repos.listForAuthenticatedUser = async () => {
        throw new Error('List repositories failed');
      };

      try {
        await repoManager.listTestRepositories();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'List repositories failed');
      }
    });

    test('should filter repositories correctly', async () => {
      // Mock with different owner
      mockOctokit.repos.listForAuthenticatedUser = async () => ({
        data: [
          {
            name: 'test-prefix-repo',
            owner: { login: 'different-owner' },
            created_at: '2024-01-15T10:30:45Z'
          },
          {
            name: 'test-prefix-repo',
            owner: { login: 'test-owner' },
            created_at: '2024-01-15T10:30:45Z'
          }
        ]
      });

      const repos = await repoManager.listTestRepositories();
      assert.strictEqual(repos.length, 1); // Only the one with correct owner
      assert.strictEqual(repos[0].owner.login, 'test-owner');
    });
  });

  describe('cleanupOldTestRepositories', () => {
    test('should cleanup old repositories successfully', async () => {
      const deletedCount = await repoManager.cleanupOldTestRepositories(1);
      assert.strictEqual(deletedCount, 2); // Two repos older than 1 day
    });

    test('should handle errors during cleanup', async () => {
      mockOctokit.repos.listForAuthenticatedUser = async () => {
        throw new Error('List failed');
      };

      try {
        await repoManager.cleanupOldTestRepositories(7);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'List failed');
      }
    });

    test('should handle deletion errors gracefully', async () => {
      mockOctokit.repos.delete = async () => {
        throw new Error('Delete failed');
      };

      const deletedCount = await repoManager.cleanupOldTestRepositories(1);
      assert.strictEqual(deletedCount, 0); // No successful deletions
    });

    test('should use default days parameter', async () => {
      const deletedCount = await repoManager.cleanupOldTestRepositories();
      assert.strictEqual(typeof deletedCount, 'number');
    });

    test('should not delete recent repositories', async () => {
      // Mock with recent repositories
      mockOctokit.repos.listForAuthenticatedUser = async () => ({
        data: [
          {
            name: 'test-prefix-recent',
            owner: { login: 'test-owner' },
            created_at: new Date().toISOString() // Recent
          }
        ]
      });

      const deletedCount = await repoManager.cleanupOldTestRepositories(7);
      assert.strictEqual(deletedCount, 0); // No old repos to delete
    });
  });
}); 