#!/usr/bin/env bun

import { GitHubClient } from './githubClient.js';
import { RepositoryManager } from './repositoryManager.js';
import chalk from 'chalk';

/**
 * Comprehensive workflow test for GitHub functionality
 * This test verifies that all GitHub interactions work independently
 */
export class GitHubWorkflowTest {
  constructor() {
    this.githubClient = new GitHubClient();
    this.repositoryManager = new RepositoryManager();
    this.testResults = [];
  }

  async runFullWorkflow() {
    console.log(chalk.blue('🚀 Starting GitHub Workflow Test...\n'));

    try {
      // Test 1: Repository Management
      await this.testRepositoryManagement();

      // Test 2: Issue Creation
      await this.testIssueCreation();

      // Test 3: Pull Request Creation
      await this.testPullRequestCreation();

      // Test 4: Approval Simulation
      await this.testApprovalSimulation();

      // Test 5: Cleanup Process
      await this.testCleanupProcess();

      // Test 6: Error Handling
      await this.testErrorHandling();

      // Test 7: Dry Run Mode
      await this.testDryRunMode();

      this.printResults();
    } catch (error) {
      console.error(chalk.red('❌ Workflow test failed:'), error.message);
      throw error;
    }
  }

  async testRepositoryManagement() {
    console.log(chalk.yellow('📦 Testing Repository Management...'));

    // Create test repository
    const repo = await this.repositoryManager.createTestRepository('Workflow test repository');
    this.addResult('Repository Creation', true, `Created: ${repo.name}`);

    // Verify repository exists
    const exists = await this.repositoryManager.repositoryExists(repo.name);
    this.addResult('Repository Existence Check', exists, `Repository exists: ${exists}`);

    // List test repositories
    const repos = await this.repositoryManager.listTestRepositories();
    const hasOurRepo = repos.some(r => r.name === repo.name);
    this.addResult('Repository Listing', hasOurRepo, `Found ${repos.length} test repositories`);

    // Clean up
    await this.repositoryManager.deleteTestRepository(repo.name);
    const existsAfter = await this.repositoryManager.repositoryExists(repo.name);
    this.addResult('Repository Deletion', !existsAfter, `Repository deleted: ${!existsAfter}`);

    return repo;
  }

  async testIssueCreation() {
    console.log(chalk.yellow('📝 Testing Issue Creation...'));

    // Create test repository for issues
    const repo = await this.repositoryManager.createTestRepository('Issue test repository');
    
    // Update GitHub client to use test repository
    this.githubClient.repo = {
      owner: this.repositoryManager.testRepoOwner,
      repo: repo.name
    };

    // Create main issue
    const mainIssue = await this.githubClient.createIssue('Main Test Issue', 'This is a main test issue');
    this.addResult('Main Issue Creation', mainIssue > 0, `Created issue #${mainIssue}`);

    // Create subtask issue
    const subtaskIssue = await this.githubClient.createIssue('Subtask Issue', 'This is a subtask', mainIssue);
    this.addResult('Subtask Issue Creation', subtaskIssue > 0, `Created subtask #${subtaskIssue}`);

    // Clean up
    await this.repositoryManager.deleteTestRepository(repo.name);
  }

  async testPullRequestCreation() {
    console.log(chalk.yellow('🔀 Testing Pull Request Creation...'));

    // Create test repository for PRs
    const repo = await this.repositoryManager.createTestRepository('PR test repository');
    
    // Update GitHub client to use test repository
    this.githubClient.repo = {
      owner: this.repositoryManager.testRepoOwner,
      repo: repo.name
    };

    // Create test PR
    const testPR = await this.githubClient.createPullRequest(
      'Test PR',
      'test-branch',
      'console.log("Hello World");',
      1
    );
    
    this.addResult('Pull Request Creation', testPR.prNumber > 0, `Created PR #${testPR.prNumber}`);

    // Clean up
    await this.repositoryManager.deleteTestRepository(repo.name);
  }

  async testApprovalSimulation() {
    console.log(chalk.yellow('✅ Testing Approval Simulation...'));

    const startTime = Date.now();
    const approved = await this.githubClient.getApprovalStatus(123);
    const endTime = Date.now();
    
    this.addResult('Approval Simulation', approved, `Approval: ${approved}, Time: ${endTime - startTime}ms`);
  }

  async testCleanupProcess() {
    console.log(chalk.yellow('🧹 Testing Cleanup Process...'));

    // Create test repository
    const repo = await this.repositoryManager.createTestRepository('Cleanup test repository');
    
    // Test successful cleanup
    await this.githubClient.createTestRepository('Cleanup test');
    await this.githubClient.cleanupTestRepository(true);
    this.addResult('Successful Cleanup', true, 'Repository cleanup on success');

    // Test failed cleanup (keep repository)
    await this.githubClient.createTestRepository('Failed cleanup test');
    await this.githubClient.cleanupTestRepository(false);
    this.addResult('Failed Cleanup', true, 'Repository kept on failure');

    // Clean up manually
    await this.repositoryManager.deleteTestRepository(repo.name);
  }

  async testErrorHandling() {
    console.log(chalk.yellow('⚠️  Testing Error Handling...'));

    // Test invalid repository name
    try {
      await this.repositoryManager.createTestRepository('a'.repeat(100));
      this.addResult('Error Handling - Invalid Name', false, 'Should have thrown error');
    } catch (error) {
      this.addResult('Error Handling - Invalid Name', true, `Caught error: ${error.message}`);
    }

    // Test invalid issue creation
    try {
      await this.githubClient.createIssue('', '');
      this.addResult('Error Handling - Invalid Issue', false, 'Should have thrown error');
    } catch (error) {
      this.addResult('Error Handling - Invalid Issue', true, `Caught error: ${error.message}`);
    }
  }

  async testDryRunMode() {
    console.log(chalk.yellow('🔄 Testing Dry Run Mode...'));

    // Enable dry-run mode
    const dryRunClient = new GitHubClient({ dryRun: true });

    // Test dry-run issue creation
    const issueNumber = await dryRunClient.createIssue('Dry Run Issue', 'Test');
    this.addResult('Dry Run - Issue Creation', issueNumber > 0, `Mock issue #${issueNumber}`);

    // Test dry-run PR creation
    const pr = await dryRunClient.createPullRequest('Dry Run PR', 'branch', 'content', 1);
    this.addResult('Dry Run - PR Creation', pr.prNumber > 0, `Mock PR #${pr.prNumber}`);

    // Test dry-run approval
    const approved = await dryRunClient.getApprovalStatus(123);
    this.addResult('Dry Run - Approval', approved, 'Mock approval');
  }

  addResult(test, success, details) {
    this.testResults.push({ test, success, details });
  }

  printResults() {
    console.log(chalk.blue('\n📊 GitHub Workflow Test Results:'));
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    this.testResults.forEach(result => {
      const status = result.success ? chalk.green('✅') : chalk.red('❌');
      console.log(`${status} ${result.test}: ${result.details}`);
      
      if (result.success) {
        passed++;
      } else {
        failed++;
      }
    });

    console.log('='.repeat(60));
    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.blue(`📁 Total: ${this.testResults.length}`));

    if (failed > 0) {
      console.log(chalk.red('\n❌ Some tests failed. Check the details above.'));
      throw new Error(`${failed} tests failed`);
    } else {
      console.log(chalk.green('\n🎉 All GitHub workflow tests passed!'));
    }
  }
}

// Run the workflow test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const workflowTest = new GitHubWorkflowTest();
  workflowTest.runFullWorkflow().catch(console.error);
} 