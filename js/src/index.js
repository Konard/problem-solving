#!/usr/bin/env node

import { Command } from 'commander';
import { Orchestrator } from './orchestrator.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const program = new Command();

program
  .name('problem-solver')
  .description('Automated problem solving using LLM and GitHub integration')
  .version('1.0.0');

program
  .command('solve')
  .description('Solve a problem using the full pipeline')
  .argument('<task>', 'The main task to solve')
  .option('-d, --dry-run', 'Run without making actual GitHub changes')
  .option('--debug', 'Enable debug logging')
  .action(async (task, options) => {
    try {
      console.log(chalk.blue(`🚀 Starting problem solving for: "${task}"`));
      
      const orchestrator = new Orchestrator();
      
      if (options.dryRun) {
        process.env.UNIVERSAL_ALGORITHM_DRY_RUN = 'true';
        console.log(chalk.yellow('⚠️  Running in dry-run mode'));
      }
      
      if (options.debug) {
        process.env.UNIVERSAL_ALGORITHM_DEBUG = 'true';
        console.log(chalk.gray('🔍 Debug mode enabled'));
      }
      
      await orchestrator.execute(task);
      console.log(chalk.green('✅ Process completed successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('decompose')
  .description('Decompose a task into subtasks')
  .argument('<task>', 'The task to decompose')
  .action(async (task) => {
    try {
      console.log(chalk.blue(`🔍 Decomposing task: "${task}"`));
      const orchestrator = new Orchestrator();
      const subtasks = await orchestrator.decomposeTask(task);
      console.log(chalk.green('📋 Subtasks:'));
      subtasks.forEach((subtask, index) => {
        console.log(chalk.cyan(`  ${index + 1}. ${subtask}`));
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Generate tests for a task')
  .argument('<task>', 'The task to generate tests for')
  .action(async (task) => {
    try {
      console.log(chalk.blue(`🧪 Generating tests for: "${task}"`));
      const orchestrator = new Orchestrator();
      const testCode = await orchestrator.generateTest(task);
      console.log(chalk.green('📝 Generated test code:'));
      console.log(testCode);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// If no command is provided, run the default solve command
if (process.argv.length === 2) {
  const task = process.argv[2] || "Implement a user authentication system";
  console.log(chalk.blue(`🚀 Starting problem solving for: "${task}"`));
  
  const orchestrator = new Orchestrator();
  orchestrator.execute(task)
    .then(() => console.log(chalk.green('✅ Process completed')))
    .catch(err => {
      console.error(chalk.red('❌ Error:'), err.message);
      process.exit(1);
    });
} else {
  program.parse();
} 