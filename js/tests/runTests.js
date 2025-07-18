#!/usr/bin/env bun

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Updated test files organized by category
const testFiles = [
  // Unit tests (fast, isolated)
  'tests/unit/cli.test.js',
  'tests/unit/githubClient.test.js',
  'tests/unit/repositoryManager.test.js',
  
  // Integration tests (medium speed, some real services)
  'tests/integration/orchestrator.test.js',
  'tests/integration/githubIntegration.test.js',
  
  // E2E tests (slow, real APIs)
  'tests/e2e/universalAlgorithm.test.js',
  'tests/e2e/sqrt-universal-algorithm.test.js'
];

async function runTest(file) {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`\n🧪 Running tests: ${file}`));
    
    const child = spawn('bun', ['test', file], {
      cwd: join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ ${file} - PASSED`));
        resolve({ file, success: true, output, errorOutput });
      } else {
        console.log(chalk.red(`❌ ${file} - FAILED (code: ${code})`));
        if (errorOutput) {
          console.log(chalk.gray(errorOutput));
        }
        resolve({ file, success: false, output, errorOutput, code });
      }
    });

    child.on('error', (error) => {
      console.log(chalk.red(`❌ ${file} - ERROR: ${error.message}`));
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log(chalk.blue('🚀 Starting comprehensive test suite...\n'));
  console.log(chalk.gray('📁 Test Categories:'));
  console.log(chalk.gray('   🧪 Unit tests (fast, isolated)'));
  console.log(chalk.gray('   🔗 Integration tests (medium speed)'));
  console.log(chalk.gray('   🚀 E2E tests (slow, real APIs)\n'));
  
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const file of testFiles) {
    try {
      const result = await runTest(file);
      results.push(result);
      
      if (result.success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(chalk.red(`❌ ${file} - ERROR: ${error.message}`));
      failed++;
      results.push({ file, success: false, error: error.message });
    }
  }

  console.log(chalk.blue('\n📊 Test Summary:'));
  console.log(chalk.green(`✅ Passed: ${passed}`));
  console.log(chalk.red(`❌ Failed: ${failed}`));
  console.log(chalk.blue(`📁 Total: ${testFiles.length}`));

  if (failed > 0) {
    console.log(chalk.red('\n❌ Some tests failed. Check the output above for details.'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n🎉 All tests passed!'));
  }
}

// Check if GitHub token is available for integration tests
if (!process.env.GITHUB_TOKEN) {
  console.log(chalk.yellow('⚠️  GITHUB_TOKEN not set - integration and e2e tests will be skipped'));
  console.log(chalk.gray('   Set GITHUB_TOKEN to run full integration and e2e tests'));
}

runAllTests().catch(console.error); 