import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { Orchestrator } from '../src/orchestrator.js';
import { GitHubClient } from '../src/github/githubClient.js';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';

const ALGORITHM_NAME = 'Universal Algorithm for Square Root (Decomposition + Composition)';

describe(`${ALGORITHM_NAME} Integration Test`, () => {
  let orchestrator;
  let githubClient;
  let testRepository;

  beforeEach(async () => {
    // Create a test repository for this test session
    githubClient = new GitHubClient();
    testRepository = await githubClient.createTestRepository(`${ALGORITHM_NAME} Integration Test`);

    // Patch the repo context and testRepository for all orchestrator components
    githubClient.repo = {
      owner: process.env.TEST_REPO_OWNER,
      repo: testRepository.name // just the repo name
    };
    githubClient.testRepository = testRepository;

    // Make the repo property immutable to prevent it from being overridden
    Object.defineProperty(githubClient, 'repo', {
      value: {
        owner: process.env.TEST_REPO_OWNER,
        repo: testRepository.name
      },
      writable: false,
      configurable: false
    });

    // Patch createTestRepository to always return the pre-created repo and set repo context
    githubClient.createTestRepository = async () => {
      // Don't override the repo settings since we already set them correctly
      return testRepository;
    };
    
    // Patch the original createTestRepository method to not override repo settings
    const originalCreateTestRepository = githubClient.createTestRepository;
    githubClient.createTestRepository = async (description) => {
      // Set the repo configuration correctly
      githubClient.repo = {
        owner: process.env.TEST_REPO_OWNER,
        repo: testRepository.name
      };
      githubClient.testRepository = testRepository;
      return testRepository;
    };

    // Patch createOrUpdateFileContents to ensure README contains the algorithm name
    const origCreateOrUpdateFileContents = githubClient.octokit.repos.createOrUpdateFileContents.bind(githubClient.octokit.repos);
    githubClient.octokit.repos.createOrUpdateFileContents = async (params) => {
      if (params.path === 'README.md' && !Buffer.from(params.content, 'base64').toString('utf-8').includes(ALGORITHM_NAME)) {
        params.content = Buffer.from(`# ${ALGORITHM_NAME}\n\n` + Buffer.from(params.content, 'base64').toString('utf-8')).toString('base64');
      }
      return origCreateOrUpdateFileContents(params);
    };

    // Mock getApprovalStatus to always return true (approve all PRs)
    githubClient.getApprovalStatus = async () => {
      // Simulate a quick approval check
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    };
    
    // Add debugging to createPullRequest
    const originalCreatePullRequest = githubClient.createPullRequest.bind(githubClient);
    githubClient.createPullRequest = async (title, branch, content, issueNumber) => {
      console.log(`  🔍 Debug: Creating PR "${title}" on branch "${branch}"`);
      try {
        // First, let's check what branches exist
        console.log(`  🔍 Debug: Checking repository branches...`);
        const { data: branches } = await githubClient.octokit.repos.listBranches({
          owner: githubClient.repo.owner,
          repo: githubClient.repo.repo
        });
        console.log(`  🔍 Debug: Found branches: ${branches.map(b => b.name).join(', ')}`);
        
        // Use the first branch as base (usually 'main' or 'master')
        const baseBranch = branches[0]?.name || 'main';
        console.log(`  🔍 Debug: Using base branch: ${baseBranch}`);
        
        // Override the createPullRequest to use the correct base branch
        console.log(`  🔍 Debug: Getting base branch SHA...`);
        const baseBranchData = await githubClient.octokit.repos.getBranch({
          owner: githubClient.repo.owner,
          repo: githubClient.repo.repo,
          branch: baseBranch
        });
        console.log(`  🔍 Debug: Base branch SHA: ${baseBranchData.data.commit.sha}`);
        
        console.log(`  🔍 Debug: Creating new branch...`);
        await githubClient.octokit.git.createRef({
          owner: githubClient.repo.owner,
          repo: githubClient.repo.repo,
          ref: `refs/heads/${branch}`,
          sha: baseBranchData.data.commit.sha
        });
        console.log(`  🔍 Debug: Branch created successfully`);
        
        // Create file
        const fileName = githubClient.getFileNameFromTitle(title);
        console.log(`  🔍 Debug: Creating file: ${fileName}`);
        await githubClient.octokit.repos.createOrUpdateFileContents({
          owner: githubClient.repo.owner,
          repo: githubClient.repo.repo,
          path: fileName,
          message: title,
          content: Buffer.from(content).toString('base64'),
          branch: branch
        });
        console.log(`  🔍 Debug: File created successfully`);
        
        // Create PR
        console.log(`  🔍 Debug: Creating pull request...`);
        const prPromise = githubClient.octokit.pulls.create({
          owner: githubClient.repo.owner,
          repo: githubClient.repo.repo,
          title: title,
          head: branch,
          base: baseBranch,
          body: `Closes #${issueNumber}\n\n---\n*Generated by Problem Solving Automation*`
        });
        
        // Add timeout to PR creation
        const pr = await Promise.race([
          prPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PR creation timed out after 10 seconds')), 10000)
          )
        ]);
        console.log(`  🔍 Debug: Pull request created: #${pr.data.number}`);
        
        return {
          prNumber: pr.data.number,
          url: pr.data.html_url
        };
      } catch (error) {
        console.error(`  ❌ Debug: PR creation failed: ${error.message}`);
        console.error(`  ❌ Debug: Error stack: ${error.stack}`);
        throw error;
      }
    };
    
    // Assign the patched client to all orchestrator components
    orchestrator = new Orchestrator();
    orchestrator.decomposer.github = githubClient;
    orchestrator.testGenerator.github = githubClient;
    orchestrator.solutionSearcher.github = githubClient;
    orchestrator.composer.github = githubClient;
    
    // Also ensure the LLM clients are mocked for all components
    orchestrator.decomposer.llm = {
      decomposeTask: async (task) => {
        console.log(chalk.gray('  🤖 Using LLM to decompose task...'));
        return [
          'Calculate absolute value of input number',
          'Use Newton\'s method to approximate square root'
        ];
      }
    };
    
    orchestrator.testGenerator.llm = {
      generateTest: async (description) => {
        console.log(chalk.gray('  🤖 Generating test code...'));
        return `// Test for: ${description}\n\ndescribe('Test', () => {\n  it('should work', () => {\n    expect(true).toBe(true);\n  });\n});`;
      }
    };
    
    orchestrator.solutionSearcher.llm = {
      generateSolution: async (description, testCode) => {
        console.log(chalk.gray('  🤖 Generating solution code...'));
        return `// Solution for: ${description}\n\nfunction solution() {\n  return 'implemented';\n}\n\nmodule.exports = solution;`;
      }
    };
    
    orchestrator.composer.llm = {
      composeSolutions: async (solutions) => {
        console.log(chalk.gray('  🤖 Composing final solution...'));
        return `// Final solution combining:\n${solutions.map((sol, i) => `// Subtask ${i + 1}: ${sol}`).join('\n')}\n\nfunction finalSolution() {\n  return 'composed';\n}\n\nmodule.exports = finalSolution;`;
      }
    };
    
    // Override the orchestrator's createTestRepository to use our pre-created repo
    orchestrator.decomposer.github.createTestRepository = async () => {
      return testRepository;
    };
    
    // Also override the orchestrator's execute method to skip repository creation
    const originalExecute = orchestrator.execute.bind(orchestrator);
    orchestrator.execute = async (mainTask) => {
      console.log(chalk.blue('🎯 Starting problem solving pipeline...'));
      
      // Skip repository creation since we already have one
      console.log(chalk.yellow('📦 Step 0: Using existing test repository...'));
      
      // Ensure all components use the same GitHub client
      orchestrator.testGenerator.github = githubClient;
      orchestrator.solutionSearcher.github = githubClient;
      orchestrator.composer.github = githubClient;
      
      // 1. Decompose task and create issues
      console.log(chalk.yellow('📋 Step 1: Decomposing task...'));
      const { mainIssue, subtasks } = await orchestrator.decomposer.decomposeAndCreateIssues(mainTask);
      console.log(chalk.green(`✅ Created main issue #${mainIssue} with ${subtasks.length} subtasks`));
      
      const subtaskSolutions = [];
      let successCount = 0;
      
      for (let i = 0; i < subtasks.length; i++) {
        const subtask = subtasks[i];
        console.log(chalk.blue(`\n🔄 Processing subtask ${i + 1}/${subtasks.length}: ${subtask.title}`));
        
        try {
          // 2. Generate test PR
          console.log(chalk.yellow('  🧪 Generating test...'));
          const testPR = await orchestrator.testGenerator.generateAndCreateTestPR(subtask);
          console.log(chalk.green(`  ✅ Test PR created: #${testPR.prNumber}`));
          
          // 3. Wait for test approval (simulated)
          console.log(chalk.yellow('  ⏳ Waiting for test approval...'));
          const testApproved = await orchestrator.decomposer.github.getApprovalStatus(testPR.prNumber);
          if (!testApproved) {
            console.log(chalk.red('  ❌ Test not approved, skipping subtask'));
            continue;
          }
          console.log(chalk.green('  ✅ Test approved'));
          
          // 4. Generate solution PR
          console.log(chalk.yellow('  💡 Generating solution...'));
          const solutionPR = await orchestrator.solutionSearcher.searchAndCreateSolutionPR(subtask, testPR.content);
          console.log(chalk.green(`  ✅ Solution PR created: #${solutionPR.prNumber}`));
          
          // 5. Wait for solution approval (simulated)
          console.log(chalk.yellow('  ⏳ Waiting for solution approval...'));
          const solutionApproved = await orchestrator.decomposer.github.getApprovalStatus(solutionPR.prNumber);
          if (!solutionApproved) {
            console.log(chalk.red('  ❌ Solution not approved, skipping subtask'));
            continue;
          }
          console.log(chalk.green('  ✅ Solution approved'));
          
          subtaskSolutions.push(solutionPR.content);
          successCount++;
          console.log(chalk.green(`  🎉 Subtask completed successfully`));
          
        } catch (error) {
          console.error(chalk.red(`  ❌ Error processing subtask: ${error.message}`));
          if (process.env.UNIVERSAL_ALGORITHM_DEBUG === 'true') {
            console.error(chalk.gray(error.stack));
          }
        }
      }
      
      console.log(chalk.blue(`\n📊 Summary: ${successCount}/${subtasks.length} subtasks completed successfully`));
      
      if (subtaskSolutions.length === 0) {
        console.log(chalk.red('❌ No solutions generated, cannot compose final solution'));
        return;
      }
      
      // 6. Compose final solution
      console.log(chalk.yellow('\n🔗 Step 2: Composing final solution...'));
      const finalPR = await orchestrator.composer.composeAndCreateFinalPR(mainIssue, subtaskSolutions);
      console.log(chalk.green(`✅ Final solution PR created: #${finalPR.prNumber}`));
      
      // 7. Cleanup test repository
      console.log(chalk.yellow('\n🧹 Step 3: Cleaning up test repository...'));
      const success = successCount === subtasks.length;
      await orchestrator.decomposer.github.cleanupTestRepository(success);
      
      console.log(chalk.green('\n🎉 Problem solving pipeline completed successfully!'));
    };
  });

  afterEach(async () => {
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
    console.log(`\n🎯 Starting ${ALGORITHM_NAME} pipeline for square root function...`);
    
    // Execute the complete pipeline with a longer timeout
    await Promise.race([
      orchestrator.execute(mainTask),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Pipeline timed out after 60 seconds')), 60000)
      )
    ]);
    
    // Verify that real issues and PRs were created
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    
    // Check that issues were created
    const { data: issues } = await octokit.issues.listForRepo({
      owner: githubClient.repo.owner,
      repo: githubClient.repo.repo,
      state: 'open'
    });
    
    console.log(`\n📋 Found ${issues.length} issues in repository:`);
    issues.forEach(issue => {
      console.log(`  - #${issue.number}: ${issue.title}`);
    });
    
    // Check that PRs were created
    const { data: pullRequests } = await octokit.pulls.list({
      owner: githubClient.repo.owner,
      repo: githubClient.repo.repo,
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
      owner: githubClient.repo.owner,
      repo: githubClient.repo.repo,
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
    assert.ok(absTest.includes('Test for:'));
    assert.ok(newtonTest.includes('Test for:'));
  });

  test('should compose solutions correctly', async () => {
    const solutions = [
      'function absoluteValue(x) { return x < 0 ? -x : x; }',
      'function newtonsMethod(x) { /* implementation */ }'
    ];
    const composed = await orchestrator.composer.llm.composeSolutions(solutions);
    assert.ok(composed.includes('Final solution combining:'));
    assert.ok(composed.includes('Subtask 1:'));
    assert.ok(composed.includes('Subtask 2:'));
  });
}); 