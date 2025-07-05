#!/usr/bin/env node

import { Orchestrator } from './src/orchestrator.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

async function runExample() {
  console.log(chalk.blue('🚀 Problem Solving Automation Example'));
  console.log(chalk.gray('This example demonstrates the basic functionality\n'));
  
  const orchestrator = new Orchestrator();
  
  // Example 1: Decompose a task
  console.log(chalk.yellow('📋 Example 1: Task Decomposition'));
  try {
    const subtasks = await orchestrator.decomposeTask('Implement user authentication system');
    console.log(chalk.green('✅ Subtasks generated:'));
    subtasks.forEach((task, index) => {
      console.log(chalk.cyan(`  ${index + 1}. ${task}`));
    });
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Example 2: Generate tests
  console.log(chalk.yellow('🧪 Example 2: Test Generation'));
  try {
    const testCode = await orchestrator.generateTest('Create a user registration endpoint');
    console.log(chalk.green('✅ Test code generated:'));
    console.log(chalk.gray(testCode.substring(0, 200) + '...'));
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log(chalk.blue('💡 To run the full pipeline:'));
  console.log(chalk.gray('  bun start "Your problem description"'));
  console.log(chalk.gray('  bun start -- --dry-run "Your problem description"'));
}

// Check if environment variables are set
const requiredEnvVars = ['OPENAI_API_KEY', 'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log(chalk.red('❌ Missing required environment variables:'));
  missingVars.forEach(varName => {
    console.log(chalk.red(`  - ${varName}`));
  });
  console.log(chalk.yellow('\n💡 Please set up your .env file with the required variables.'));
  console.log(chalk.gray('   See README.md for configuration instructions.'));
  process.exit(1);
}

runExample().catch(console.error); 