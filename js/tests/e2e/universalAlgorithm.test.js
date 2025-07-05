import { test, describe, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test';
import assert from 'assert';
import { Orchestrator } from '../../src/orchestrator.js';
import { GitHubClient } from '../../src/github/githubClient.js';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';

describe('Universal Algorithm Integration Test', () => {
  let orchestrator;
  let testRepository;
  let githubClient;

  beforeAll(async () => {
    // Create one test repository for the entire test file run
    githubClient = new GitHubClient();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = Math.random().toString(36).substring(2, 8);
    testRepository = await githubClient.createTestRepository(`Universal Algorithm Integration Test ${timestamp}-${uniqueId}`);
    console.log(`\n📦 Created test repository for all tests: ${testRepository.url}`);
  });

  afterAll(async () => {
    if (testRepository) {
      try {
        const deleteOnSuccess = process.env.TEST_REPO_DELETE_ON_SUCCESS === 'true';
        await githubClient.cleanupTestRepository(deleteOnSuccess);
        if (deleteOnSuccess) {
          console.log(`\n🧹 Cleaned up test repository: ${testRepository.url}`);
        } else {
          console.log(`\n📦 Kept test repository: ${testRepository.url}`);
        }
      } catch (error) {
        console.log('Cleanup error (expected in test):', error.message);
      }
    }
  });

  beforeEach(async () => {
    // Create orchestrator with real components
    orchestrator = new Orchestrator();
    
    // Mock the LLM client for predictable behavior
    const mockLLM = {
      decomposeTask: async (task) => {
        console.log(chalk.gray('  🤖 Using LLM to decompose task...'));
        if (task.includes('square root')) {
          return [
            'Calculate absolute value of input number',
            'Use Newton\'s method to approximate square root'
          ];
        }
        return [task];
      },
      
      generateTest: async (description) => {
        console.log(chalk.gray('  🤖 Generating test code...'));
        if (description.includes('absolute value')) {
          return `function testAbsoluteValue() {
  const abs = require('./absoluteValue.js');
  assert.strictEqual(abs(5), 5);
  assert.strictEqual(abs(-5), 5);
  assert.strictEqual(abs(0), 0);
  console.log('✅ Absolute value tests passed');
}`;
        } else if (description.includes('Newton')) {
          return `function testNewtonsMethod() {
  const sqrt = require('./newtonsMethod.js');
  assert.strictEqual(Math.abs(sqrt(4) - 2) < 0.001, true);
  assert.strictEqual(Math.abs(sqrt(2) - 1.414) < 0.001, true);
  assert.strictEqual(sqrt(0), 0);
  console.log('✅ Newton\'s method tests passed');
}`;
        }
        return `// Test for: ${description}\n\ndescribe('Test', () => {\n  it('should work', () => {\n    expect(true).toBe(true);\n  });\n});`;
      },
      
      generateSolution: async (description, testCode) => {
        console.log(chalk.gray('  🤖 Generating solution code...'));
        if (description.includes('absolute value')) {
          return `function absoluteValue(x) {
  return x < 0 ? -x : x;
}
module.exports = absoluteValue;`;
        } else if (description.includes('Newton')) {
          return `function newtonsMethod(x) {
  if (x === 0) return 0;
  let guess = x / 2;
  const tolerance = 0.001;
  for (let i = 0; i < 10; i++) {
    guess = (guess + x / guess) / 2;
    if (Math.abs(guess * guess - x) < tolerance) {
      break;
    }
  }
  return guess;
}
module.exports = newtonsMethod;`;
        }
        return `// Solution for: ${description}\n\nfunction solution() {\n  return 'implemented';\n}\n\nmodule.exports = solution;`;
      },
      
      composeSolutions: async (solutions) => {
        console.log(chalk.gray('  🤖 Composing final solution...'));
        return `function sqrt(x) {
  const abs = require('./absoluteValue.js');
  const newtonsMethod = require('./newtonsMethod.js');
  const absX = abs(x);
  const result = newtonsMethod(absX);
  return x < 0 ? -result : result;
}
module.exports = sqrt;`;
      }
    };
    
    // Assign the mocked LLM to all components
    orchestrator.decomposer.llm = mockLLM;
    orchestrator.testGenerator.llm = mockLLM;
    orchestrator.solutionSearcher.llm = mockLLM;
    orchestrator.composer.llm = mockLLM;
    
    // Set test mode for faster approvals
    process.env.UNIVERSAL_ALGORITHM_TEST_MODE = 'true';
  });

  test('should complete full Universal Algorithm pipeline for square root function', async () => {
    const mainTask = 'Implement a function to calculate the square root of a number';
    
    console.log('\n🎯 Starting Universal Algorithm pipeline for square root function...');
    
    // Execute the complete pipeline with the pre-created repository
    await Promise.race([
      orchestrator.execute(mainTask, testRepository),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Pipeline timed out after 120 seconds')), 120000)
      )
    ]);
    
    console.log('\n✅ Universal Algorithm pipeline completed successfully!');
  }, 150000); // 2.5 minute timeout

  test('should handle task decomposition correctly', async () => {
    const mainTask = 'Implement a function to calculate the square root of a number';
    const subtasks = await orchestrator.decomposeTask(mainTask);
    assert.strictEqual(subtasks.length, 2);
    assert.ok(subtasks[0].includes('absolute value'));
    assert.ok(subtasks[1].includes('Newton'));
  });

  test('should generate appropriate tests for subtasks', async () => {
    const absTask = 'Calculate absolute value of input number';
    const newtonTask = 'Use Newton\'s method to approximate square root';
    const absTest = await orchestrator.generateTest(absTask);
    const newtonTest = await orchestrator.generateTest(newtonTask);
    assert.ok(absTest.includes('absoluteValue'));
    assert.ok(absTest.includes('assert.strictEqual'));
    assert.ok(newtonTest.includes('newtonsMethod'));
    assert.ok(newtonTest.includes('assert.strictEqual'));
  });

  test('should compose solutions correctly', async () => {
    const solutions = [
      'function absoluteValue(x) { return x < 0 ? -x : x; }',
      'function newtonsMethod(x) { /* implementation */ }'
    ];
    const composed = await orchestrator.composer.llm.composeSolutions(solutions);
    assert.ok(composed.includes('sqrt'));
    assert.ok(composed.includes('absoluteValue'));
    assert.ok(composed.includes('newtonsMethod'));
  });
}); 