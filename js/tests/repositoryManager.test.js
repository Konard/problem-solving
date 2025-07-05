import { test, describe } from 'node:test';
import assert from 'node:assert';
import { RepositoryManager } from '../src/github/repositoryManager.js';

describe('RepositoryManager', () => {
  test('should be instantiable', () => {
    const repoManager = new RepositoryManager();
    assert.ok(repoManager);
    assert.ok(repoManager.testRepoOwner);
    assert.ok(repoManager.testRepoPrefix);
    assert.strictEqual(typeof repoManager.deleteOnSuccess, 'boolean');
  });

  test('should generate sortable UUID', () => {
    const repoManager = new RepositoryManager();
    const uuid = repoManager.generateSortableUUID();
    assert.ok(uuid);
    assert.ok(uuid.includes('-'));
    assert.ok(uuid.length > 20);
  });

  test('should have createTestRepository method', () => {
    const repoManager = new RepositoryManager();
    assert.strictEqual(typeof repoManager.createTestRepository, 'function');
  });

  test('should have deleteTestRepository method', () => {
    const repoManager = new RepositoryManager();
    assert.strictEqual(typeof repoManager.deleteTestRepository, 'function');
  });

  test('should have repositoryExists method', () => {
    const repoManager = new RepositoryManager();
    assert.strictEqual(typeof repoManager.repositoryExists, 'function');
  });

  test('should have listTestRepositories method', () => {
    const repoManager = new RepositoryManager();
    assert.strictEqual(typeof repoManager.listTestRepositories, 'function');
  });

  test('should have cleanupOldTestRepositories method', () => {
    const repoManager = new RepositoryManager();
    assert.strictEqual(typeof repoManager.cleanupOldTestRepositories, 'function');
  });
}); 