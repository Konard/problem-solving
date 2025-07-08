import { test, describe, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test';
import assert from 'assert';
import { Orchestrator } from '../../src/orchestrator.js';
import { GitHubClient } from '../../src/github/githubClient.js';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';

const ALGORITHM_NAME = 'Universal Algorithm for Square Root (Decomposition + Composition)';

describe('Universal Algorithm for Square Root (Decomposition + Composition) Integration Test', () => {
  let orchestrator;
  let testRepository;
  let githubClient;

  beforeAll(async () => {
    // Create one test repository for the entire test file run
    githubClient = new GitHubClient();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = Math.random().toString(36).substring(2, 8);
    testRepository = await githubClient.createTestRepository(`${ALGORITHM_NAME} Integration Test ${timestamp}-${uniqueId}`);
    console.log(`\n📦 Created test repository for all tests: ${testRepository.url}`);
  });

  afterAll(async () => {
    if (testRepository) {
      try {
        // Respect the environment variable for deletion
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
  });

  test('should complete full Universal Algorithm pipeline for square root function', async () => {
    const mainTask = 'Implement a function to calculate the square root of a number';
    console.log(`\n🎯 Starting ${ALGORITHM_NAME} pipeline for square root function...`);
    
    // Execute the complete pipeline with the real orchestrator using the pre-created repository
    await Promise.race([
      orchestrator.execute(mainTask, testRepository),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Pipeline timed out after 60 seconds')), 60000)
      )
    ]);
    
    // Verify that real issues and PRs were created
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    
    // Use the correct repository information from the test repository
    const repoOwner = testRepository.fullName.split('/')[0];
    const repoName = testRepository.fullName.split('/')[1];
    
    // Check that issues were created
    const { data: issues } = await octokit.issues.listForRepo({
      owner: repoOwner,
      repo: repoName,
      state: 'open'
    });
    
    console.log(`\n📋 Found ${issues.length} issues in repository:`);
    issues.forEach(issue => {
      console.log(`  - #${issue.number}: ${issue.title}`);
    });
    
    // Check that PRs were created
    const { data: pullRequests } = await octokit.pulls.list({
      owner: repoOwner,
      repo: repoName,
      state: 'open'
    });
    
    console.log(`\n🔗 Found ${pullRequests.length} pull requests in repository:`);
    pullRequests.forEach(pr => {
      console.log(`  - #${pr.number}: ${pr.title}`);
    });
    
    // Verify we have the expected content
    assert.ok(issues.length >= 3, 'Should have at least main issue + 2 subtask issues');
    assert.ok(pullRequests.length >= 5, 'Should have at least 2 test PRs + 2 solution PRs + 1 final PR');
    
    // Check that the generated repository README contains the algorithm name
    const { data: readmeData } = await octokit.repos.getContent({
      owner: repoOwner,
      repo: repoName,
      path: 'README.md',
    });
    const readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
    assert.ok(readmeContent.includes(ALGORITHM_NAME), 'README should mention the algorithm name');
    
    console.log(`\n✅ ${ALGORITHM_NAME} pipeline completed successfully!`);
    console.log(`\n🔗 Repository: ${testRepository.url}`);
  }, 120000); // 2 minute timeout

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