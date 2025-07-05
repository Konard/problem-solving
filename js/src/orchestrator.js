import { Decomposer } from './core/decomposer.js';
import { TestGenerator } from './core/testGenerator.js';
import { SolutionSearcher } from './core/solutionSearcher.js';
import { Composer } from './core/composer.js';
import { GitHubClient } from './github/githubClient.js';
import chalk from 'chalk';

export class Orchestrator {
  constructor() {
    // Create a single GitHub client instance to be shared across all components
    this.githubClient = new GitHubClient();
    
    // Create components with the shared GitHub client
    this.decomposer = new Decomposer();
    this.testGenerator = new TestGenerator();
    this.solutionSearcher = new SolutionSearcher();
    this.composer = new Composer();
    
    // Ensure all components use the same GitHub client
    this.decomposer.github = this.githubClient;
    this.testGenerator.github = this.githubClient;
    this.solutionSearcher.github = this.githubClient;
    this.composer.github = this.githubClient;
  }

  async execute(mainTask, existingRepository = null) {
    console.log(chalk.blue('🎯 Starting problem solving pipeline...'));
    
    // 0. Create or use test repository
    if (existingRepository) {
      console.log(chalk.yellow('📦 Step 0: Using existing test repository...'));
      this.githubClient.testRepository = existingRepository;
      
      // Parse the repository name correctly
      if (existingRepository.fullName) {
        // Use the fullName if available (format: owner/repo)
        const repoParts = existingRepository.fullName.split('/');
        this.githubClient.repo = {
          owner: repoParts[0],
          repo: repoParts[1]
        };
      } else {
        // Fallback: use the name as repo and get owner from environment
        this.githubClient.repo = {
          owner: process.env.TEST_REPO_OWNER || 'deep-assistant-team',
          repo: existingRepository.name
        };
      }
    } else {
      console.log(chalk.yellow('📦 Step 0: Creating test repository...'));
      await this.githubClient.createTestRepository(`Test repository for: ${mainTask}`);
    }
    
    // 1. Decompose task and create issues
    console.log(chalk.yellow('📋 Step 1: Decomposing task...'));
    const { mainIssue, subtasks } = await this.decomposer.decomposeAndCreateIssues(mainTask);
    console.log(chalk.green(`✅ Created main issue #${mainIssue} with ${subtasks.length} subtasks`));
    
    const subtaskSolutions = [];
    let successCount = 0;
    
    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i];
      console.log(chalk.blue(`\n🔄 Processing subtask ${i + 1}/${subtasks.length}: ${subtask.title}`));
      
      try {
        // 2. Generate test PR
        console.log(chalk.yellow('  🧪 Generating test...'));
        const testPR = await this.testGenerator.generateAndCreateTestPR(subtask);
        console.log(chalk.green(`  ✅ Test PR created: #${testPR.prNumber}`));
        
        // 3. Wait for test approval (simulated)
        if (process.env.UNIVERSAL_ALGORITHM_DRY_RUN === 'true') {
          console.log(chalk.gray('  ⏭️  Skipping approval check (dry-run mode)'));
        } else {
          console.log(chalk.yellow('  ⏳ Waiting for test approval...'));
          const testApproved = await this.githubClient.getApprovalStatus(testPR.prNumber);
          if (!testApproved) {
            console.log(chalk.red('  ❌ Test not approved, skipping subtask'));
            continue;
          }
          console.log(chalk.green('  ✅ Test approved'));
        }
        
        // 4. Generate solution PR
        console.log(chalk.yellow('  💡 Generating solution...'));
        const solutionPR = await this.solutionSearcher.searchAndCreateSolutionPR(subtask, testPR.content);
        console.log(chalk.green(`  ✅ Solution PR created: #${solutionPR.prNumber}`));
        
        // 5. Wait for solution approval (simulated)
        if (process.env.UNIVERSAL_ALGORITHM_DRY_RUN === 'true') {
          console.log(chalk.gray('  ⏭️  Skipping approval check (dry-run mode)'));
        } else {
          console.log(chalk.yellow('  ⏳ Waiting for solution approval...'));
          const solutionApproved = await this.githubClient.getApprovalStatus(solutionPR.prNumber);
          if (!solutionApproved) {
            console.log(chalk.red('  ❌ Solution not approved, skipping subtask'));
            continue;
          }
          console.log(chalk.green('  ✅ Solution approved'));
        }
        
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
    const finalPR = await this.composer.composeAndCreateFinalPR(mainIssue, subtaskSolutions);
    console.log(chalk.green(`✅ Final solution PR created: #${finalPR.prNumber}`));
    
    // 7. Cleanup test repository
    console.log(chalk.yellow('\n🧹 Step 3: Cleaning up test repository...'));
    const success = successCount === subtasks.length;
    await this.githubClient.cleanupTestRepository(success);
    
    console.log(chalk.green('\n🎉 Problem solving pipeline completed successfully!'));
  }

  async decomposeTask(task) {
    return await this.decomposer.decomposeTask(task);
  }

  async generateTest(task) {
    return await this.testGenerator.generateTest(task);
  }
} 