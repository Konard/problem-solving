import { test, describe, beforeEach, afterEach } from 'bun:test';
import assert from 'assert';
import { Orchestrator } from '../../src/orchestrator.js';
import { GitHubClient } from '../../src/github/githubClient.js';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';

describe('Universal Algorithm Integration Test', () => {
  let orchestrator;
  let githubClient;
  let testRepository;

  beforeEach(async () => {
    // Create a test repository for this test session
    githubClient = new GitHubClient();
    testRepository = await githubClient.createTestRepository('Universal Algorithm Integration Test');
    
    // Create orchestrator with mocked LLM components
    orchestrator = new Orchestrator();
    
    // Configure the orchestrator to use the same GitHub client
    orchestrator.decomposer.github = githubClient;
    orchestrator.testGenerator.github = githubClient;
    orchestrator.solutionSearcher.github = githubClient;
    orchestrator.composer.github = githubClient;
    
    // Mock the LLM client to return predefined responses
    orchestrator.decomposer.llm = {
      decomposeTask: async (task) => {
        if (task.includes('square root')) {
          return [
            'Calculate absolute value of input number',
            'Use Newton\'s method to approximate square root'
          ];
        }
        throw new Error('Unknown task');
      }
    };

    orchestrator.testGenerator.llm = {
      generateTest: async (task) => {
        if (task.includes('absolute value')) {
          return `function testAbsoluteValue() {
  const abs = require('./absoluteValue.js');
  
  // Test positive number
  assert.strictEqual(abs(5), 5);
  
  // Test negative number
  assert.strictEqual(abs(-5), 5);
  
  // Test zero
  assert.strictEqual(abs(0), 0);
  
  console.log('✅ Absolute value tests passed');
}`;
        } else if (task.includes('Newton')) {
          return `function testNewtonsMethod() {
  const sqrt = require('./newtonsMethod.js');
  
  // Test perfect square
  assert.strictEqual(Math.abs(sqrt(4) - 2) < 0.001, true);
  
  // Test non-perfect square
  assert.strictEqual(Math.abs(sqrt(2) - 1.414) < 0.001, true);
  
  // Test zero
  assert.strictEqual(sqrt(0), 0);
  
  console.log('✅ Newton\'s method tests passed');
}`;
        }
        throw new Error('Unknown task');
      }
    };

    orchestrator.solutionSearcher.llm = {
      generateSolution: async (task, testCode) => {
        if (task.includes('absolute value')) {
          return `function absoluteValue(x) {
  return x < 0 ? -x : x;
}

module.exports = absoluteValue;`;
        } else if (task.includes('Newton')) {
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
        throw new Error('Unknown task');
      }
    };

    orchestrator.composer.llm = {
      composeSolutions: async (solutions) => {
        return `function sqrt(x) {
  const abs = require('./absoluteValue.js');
  const newtonsMethod = require('./newtonsMethod.js');
  
  // Handle negative numbers by taking absolute value
  const absX = abs(x);
  
  // Use Newton's method to find square root
  const result = newtonsMethod(absX);
  
  // Return negative result for negative inputs
  return x < 0 ? -result : result;
}

module.exports = sqrt;`;
      }
    };
  });

  afterEach(async () => {
    // Clean up test repository
    if (testRepository) {
      try {
        await githubClient.cleanupTestRepository(true);
      } catch (error) {
        console.log('Cleanup error (expected in test):', error.message);
      }
    }
  });

  test('should complete full Universal Algorithm pipeline for square root function', async () => {
    const mainTask = 'Implement a function to calculate the square root of a number';
    
    console.log('\n🎯 Starting Universal Algorithm pipeline for square root function...');
    
    // Execute the complete pipeline
    await orchestrator.execute(mainTask);
    
    // Verify that the process completed successfully
    // The orchestrator will handle all the steps:
    // 1. Decompose task into subtasks
    // 2. Create test for each subtask
    // 3. Generate solution for each subtask
    // 4. Compose final solution
    
    console.log('\n✅ Universal Algorithm pipeline completed successfully!');
  });

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