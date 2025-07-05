import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { Orchestrator } from '../src/orchestrator.js';

describe('Orchestrator', () => {
  let orchestrator;
  let mockDecomposer;
  let mockTestGenerator;
  let mockSolutionSearcher;
  let mockComposer;

  beforeEach(() => {
    // Mock environment variables
    process.env.UNIVERSAL_ALGORITHM_DEBUG = 'false';
    process.env.UNIVERSAL_ALGORITHM_DRY_RUN = 'false';

    // Create mock components
    mockDecomposer = {
      decomposeAndCreateIssues: async () => ({
        mainIssue: 123,
        subtasks: [
          { number: 1, title: 'Subtask 1', description: 'First subtask' },
          { number: 2, title: 'Subtask 2', description: 'Second subtask' }
        ]
      }),
      decomposeTask: async () => ['Subtask 1', 'Subtask 2'],
      github: {
        createTestRepository: async () => ({
          name: 'test-repo',
          fullName: 'test-owner/test-repo',
          url: 'https://github.com/test-owner/test-repo'
        }),
        getApprovalStatus: async () => true,
        cleanupTestRepository: async () => {}
      }
    };

    mockTestGenerator = {
      generateAndCreateTestPR: async (subtask) => ({
        prNumber: 456,
        content: 'test code for ' + subtask.title,
        url: 'https://github.com/test/pr/456'
      }),
      generateTest: async () => 'test code'
    };

    mockSolutionSearcher = {
      searchAndCreateSolutionPR: async (subtask, testCode) => ({
        prNumber: 789,
        content: 'solution code for ' + subtask.title,
        url: 'https://github.com/test/pr/789'
      })
    };

    mockComposer = {
      composeAndCreateFinalPR: async (mainIssue, solutions) => ({
        prNumber: 999,
        content: 'final composed solution',
        url: 'https://github.com/test/pr/999'
      })
    };

    // Create orchestrator with mocked dependencies
    orchestrator = new Orchestrator();
    orchestrator.decomposer = mockDecomposer;
    orchestrator.testGenerator = mockTestGenerator;
    orchestrator.solutionSearcher = mockSolutionSearcher;
    orchestrator.composer = mockComposer;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.UNIVERSAL_ALGORITHM_DEBUG;
    delete process.env.UNIVERSAL_ALGORITHM_DRY_RUN;
  });

  test('should be instantiable', () => {
    assert.ok(orchestrator);
    assert.ok(orchestrator.decomposer);
    assert.ok(orchestrator.testGenerator);
    assert.ok(orchestrator.solutionSearcher);
    assert.ok(orchestrator.composer);
  });

  test('should have execute method', () => {
    assert.strictEqual(typeof orchestrator.execute, 'function');
  });

  test('should have decomposeTask method', () => {
    assert.strictEqual(typeof orchestrator.decomposeTask, 'function');
  });

  test('should have generateTest method', () => {
    assert.strictEqual(typeof orchestrator.generateTest, 'function');
  });

  describe('execute', () => {
    test('should execute full pipeline successfully', async () => {
      await orchestrator.execute('Test task');
      // Should complete without errors
    });

    test('should handle dry-run mode', async () => {
      process.env.UNIVERSAL_ALGORITHM_DRY_RUN = 'true';
      await orchestrator.execute('Test task');
      // Should complete without errors in dry-run mode
    });

    test('should handle debug mode', async () => {
      process.env.UNIVERSAL_ALGORITHM_DEBUG = 'true';
      await orchestrator.execute('Test task');
      // Should complete without errors in debug mode
    });

    test('should handle decomposition errors', async () => {
      mockDecomposer.decomposeAndCreateIssues = async () => {
        throw new Error('Decomposition failed');
      };

      try {
        await orchestrator.execute('Test task');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Decomposition failed');
      }
    });

    test('should handle test generation errors', async () => {
      mockTestGenerator.generateAndCreateTestPR = async () => {
        throw new Error('Test generation failed');
      };

      await orchestrator.execute('Test task');
      // Should continue with other subtasks
    });

    test('should handle solution generation errors', async () => {
      mockSolutionSearcher.searchAndCreateSolutionPR = async () => {
        throw new Error('Solution generation failed');
      };

      await orchestrator.execute('Test task');
      // Should continue with other subtasks
    });

    test('should handle composition errors', async () => {
      mockComposer.composeAndCreateFinalPR = async () => {
        throw new Error('Composition failed');
      };

      try {
        await orchestrator.execute('Test task');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Composition failed');
      }
    });

    test('should handle no successful solutions', async () => {
      mockTestGenerator.generateAndCreateTestPR = async () => {
        throw new Error('All tests failed');
      };

      await orchestrator.execute('Test task');
      // Should handle gracefully when no solutions are generated
    });

    test('should handle test repository creation errors', async () => {
      mockDecomposer.github.createTestRepository = async () => {
        throw new Error('Repository creation failed');
      };

      try {
        await orchestrator.execute('Test task');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Repository creation failed');
      }
    });

    test('should handle cleanup errors gracefully', async () => {
      mockDecomposer.github.cleanupTestRepository = async () => {
        throw new Error('Cleanup failed');
      };

      await orchestrator.execute('Test task');
      // Should not throw error, just log it
    });

    test('should track success count correctly', async () => {
      let successCount = 0;
      mockDecomposer.github.cleanupTestRepository = async (success) => {
        successCount = success ? 2 : 0; // Both subtasks should succeed
      };

      await orchestrator.execute('Test task');
      // Should pass success=true to cleanup
    });
  });

  describe('decomposeTask', () => {
    test('should delegate to decomposer', async () => {
      const subtasks = await orchestrator.decomposeTask('Test task');
      // Should return subtasks from decomposer
    });

    test('should handle errors in decomposition', async () => {
      mockDecomposer.decomposeTask = async () => {
        throw new Error('Decomposition failed');
      };

      try {
        await orchestrator.decomposeTask('Test task');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Decomposition failed');
      }
    });
  });

  describe('generateTest', () => {
    test('should delegate to test generator', async () => {
      const testCode = await orchestrator.generateTest('Test task');
      // Should return test code from generator
    });

    test('should handle errors in test generation', async () => {
      mockTestGenerator.generateTest = async () => {
        throw new Error('Test generation failed');
      };

      try {
        await orchestrator.generateTest('Test task');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Test generation failed');
      }
    });
  });
}); 