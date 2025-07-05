import { Decomposer } from './core/decomposer.js';
import { TestGenerator } from './core/testGenerator.js';
import { SolutionSearcher } from './core/solutionSearcher.js';
import { Composer } from './core/composer.js';
import chalk from 'chalk';

export class Orchestrator {
  constructor() {
    this.decomposer = new Decomposer();
    this.testGenerator = new TestGenerator();
    this.solutionSearcher = new SolutionSearcher();
    this.composer = new Composer();
  }

  async execute(mainTask) {
    console.log(chalk.blue('🎯 Starting problem solving pipeline...'));
    
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
        if (process.env.UA_DRY_RUN === 'true') {
          console.log(chalk.gray('  ⏭️  Skipping approval check (dry-run mode)'));
        } else {
          console.log(chalk.yellow('  ⏳ Waiting for test approval...'));
          const testApproved = await this.decomposer.github.getApprovalStatus(testPR.prNumber);
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
        if (process.env.UA_DRY_RUN === 'true') {
          console.log(chalk.gray('  ⏭️  Skipping approval check (dry-run mode)'));
        } else {
          console.log(chalk.yellow('  ⏳ Waiting for solution approval...'));
          const solutionApproved = await this.decomposer.github.getApprovalStatus(solutionPR.prNumber);
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
        if (process.env.UA_DEBUG === 'true') {
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
    
    console.log(chalk.green('\n🎉 Problem solving pipeline completed successfully!'));
  }

  async decomposeTask(task) {
    return await this.decomposer.decomposeTask(task);
  }

  async generateTest(task) {
    return await this.testGenerator.generateTest(task);
  }
} 