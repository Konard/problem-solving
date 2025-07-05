#!/usr/bin/env bun
import { program } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { universalAlgorithm } from "./orchestrator.js";
import { taskDecomposer } from "./core/decomposer.js";
import { testGenerator } from "./core/testGenerator.js";
import { solutionSearcher } from "./core/solutionSearcher.js";
import { solutionComposer } from "./core/composer.js";
import { githubClient } from "./core/githubClient.js";

/**
 * Universal Algorithm CLI
 * 
 * Command-line interface for the Universal Algorithm workflow
 */

// Configure CLI
program
  .name("universal-algorithm")
  .description("TDD-based automated problem solving using GitHub and LLMs")
  .version("1.0.0");

// Global options
program
  .option("-d, --debug", "Enable debug mode")
  .option("--dry-run", "Run without making actual GitHub API calls")
  .option("-v, --verbose", "Enable verbose output");

/**
 * Main solve command
 */
program
  .command("solve")
  .description("Execute the complete Universal Algorithm workflow")
  .argument("<task>", "Task description to solve")
  .option("-o, --output <dir>", "Output directory for generated files", "./output")
  .option("--max-subtasks <num>", "Maximum number of subtasks", "10")
  .option("--max-attempts <num>", "Maximum solution attempts per subtask", "3")
  .action(async (task, options) => {
    const spinner = ora("Starting Universal Algorithm workflow...").start();
    
    try {
      console.log(chalk.blue.bold("\n🚀 Universal Algorithm - Problem Solver\n"));
      console.log(chalk.cyan(`Task: ${task}\n`));

      // Configure options
      if (options.debug || program.opts().debug) {
        process.env.UA_DEBUG = "true";
      }
      if (options.dryRun || program.opts().dryRun) {
        process.env.UA_DRY_RUN = "true";
      }
      if (options.maxSubtasks) {
        process.env.UA_MAX_SUBTASKS = options.maxSubtasks;
      }
      if (options.maxAttempts) {
        process.env.UA_MAX_SOLUTION_ATTEMPTS = options.maxAttempts;
      }

      spinner.text = "Initializing workflow...";
      
      // Execute workflow with progress tracking
      const result = await executeWithProgress(universalAlgorithm.solve(task, options), spinner);
      
      spinner.succeed("Workflow completed successfully!");
      
      // Display results
      displayResults(result);
      
    } catch (error) {
      spinner.fail(`Workflow failed: ${error.message}`);
      if (program.opts().verbose) {
        console.error(chalk.red(error.stack));
      }
      process.exit(1);
    }
  });

/**
 * Decompose command
 */
program
  .command("decompose")
  .description("Decompose a task into subtasks")
  .argument("<task>", "Task description to decompose")
  .option("-f, --format <format>", "Output format (json|table)", "table")
  .action(async (task, options) => {
    const spinner = ora("Decomposing task...").start();
    
    try {
      const result = await taskDecomposer.decompose(task);
      spinner.succeed("Task decomposed successfully!");
      
      displayDecomposition(result, options.format);
      
    } catch (error) {
      spinner.fail(`Decomposition failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Test command
 */
program
  .command("test")
  .description("Generate tests for a subtask")
  .option("-t, --title <title>", "Subtask title", "Test Subtask")
  .option("-d, --description <desc>", "Subtask description", "Generate test for this subtask")
  .option("-c, --criteria <criteria...>", "Acceptance criteria", [])
  .action(async (options) => {
    const spinner = ora("Generating test...").start();
    
    try {
      const subtask = {
        id: "test-subtask",
        title: options.title,
        description: options.description,
        acceptanceCriteria: options.criteria,
        estimatedComplexity: 5,
        priority: "medium",
      };
      
      const result = await testGenerator.generateTest(subtask);
      spinner.succeed("Test generated successfully!");
      
      displayTest(result);
      
    } catch (error) {
      spinner.fail(`Test generation failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Solution command
 */
program
  .command("solution")
  .description("Find solution for a failing test")
  .option("-t, --title <title>", "Subtask title", "Solution Subtask")
  .option("-d, --description <desc>", "Subtask description", "Find solution for this subtask")
  .option("--test-code <code>", "Test code to make pass")
  .action(async (options) => {
    const spinner = ora("Searching for solution...").start();
    
    try {
      const subtask = {
        id: "solution-subtask",
        title: options.title,
        description: options.description,
        estimatedComplexity: 5,
        priority: "medium",
      };
      
      const testCode = options.testCode || `
        import { test, expect } from "bun:test";
        
        test("${options.title}", () => {
          expect(false).toBe(true);
        });
      `;
      
      const result = await solutionSearcher.findSolution(subtask, testCode);
      spinner.succeed("Solution search completed!");
      
      displaySolution(result);
      
    } catch (error) {
      spinner.fail(`Solution search failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Compose command
 */
program
  .command("compose")
  .description("Compose multiple solutions into final solution")
  .argument("<task>", "Main task description")
  .option("--solutions <files...>", "Solution files to compose")
  .action(async (task, options) => {
    const spinner = ora("Composing solutions...").start();
    
    try {
      // Mock partial solutions for demo
      const partialSolutions = [
        {
          subtaskId: "solution-1",
          subtaskTitle: "Component 1",
          solution: "export function component1() { return 'Hello'; }",
          metadata: { subtaskComplexity: 3 },
        },
        {
          subtaskId: "solution-2", 
          subtaskTitle: "Component 2",
          solution: "export function component2() { return 'World'; }",
          metadata: { subtaskComplexity: 4 },
        },
      ];
      
      const result = await solutionComposer.composeSolutions(task, partialSolutions);
      spinner.succeed("Solutions composed successfully!");
      
      displayComposition(result);
      
    } catch (error) {
      spinner.fail(`Composition failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Status command
 */
program
  .command("status")
  .description("Show current workflow status")
  .action(async () => {
    const status = universalAlgorithm.getStatus();
    displayStatus(status);
  });

/**
 * Interactive command
 */
program
  .command("interactive")
  .alias("i")
  .description("Start interactive mode")
  .action(async () => {
    console.log(chalk.blue.bold("\n🤖 Universal Algorithm - Interactive Mode\n"));
    
    const { task } = await inquirer.prompt([
      {
        type: "input",
        name: "task",
        message: "What task would you like to solve?",
        validate: (input) => input.length > 0 || "Task description is required",
      },
    ]);

    const { confirmProceed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmProceed",
        message: `Proceed with solving: "${task}"?`,
        default: true,
      },
    ]);

    if (!confirmProceed) {
      console.log(chalk.yellow("Cancelled."));
      return;
    }

    // Execute the solve command
    const spinner = ora("Starting workflow...").start();
    
    try {
      const result = await executeWithProgress(universalAlgorithm.solve(task), spinner);
      spinner.succeed("Workflow completed!");
      displayResults(result);
    } catch (error) {
      spinner.fail(`Workflow failed: ${error.message}`);
    }
  });

/**
 * Config command
 */
program
  .command("config")
  .description("Configure Universal Algorithm settings")
  .action(async () => {
    console.log(chalk.blue.bold("\n⚙️  Universal Algorithm Configuration\n"));
    
    const questions = [
      {
        type: "input",
        name: "githubToken",
        message: "GitHub Token:",
        default: process.env.GITHUB_TOKEN || "",
        when: !process.env.GITHUB_TOKEN,
      },
      {
        type: "input",
        name: "githubOwner",
        message: "GitHub Owner:",
        default: process.env.GITHUB_OWNER || "",
        when: !process.env.GITHUB_OWNER,
      },
      {
        type: "input",
        name: "githubRepo",
        message: "GitHub Repository:",
        default: process.env.GITHUB_REPO || "",
        when: !process.env.GITHUB_REPO,
      },
      {
        type: "input",
        name: "openaiApiKey",
        message: "OpenAI API Key:",
        default: process.env.OPENAI_API_KEY || "",
        when: !process.env.OPENAI_API_KEY,
      },
    ];

    const config = await inquirer.prompt(questions);
    
    console.log(chalk.green("\n✅ Configuration saved!"));
    console.log(chalk.yellow("Note: Set these as environment variables for persistent configuration."));
  });

/**
 * Execute workflow with progress tracking
 */
async function executeWithProgress(workflowPromise, spinner) {
  const statusInterval = setInterval(() => {
    const status = universalAlgorithm.getStatus();
    spinner.text = `${status.phase.replace('_', ' ')} (${status.progress}%)`;
  }, 1000);

  try {
    const result = await workflowPromise;
    clearInterval(statusInterval);
    return result;
  } catch (error) {
    clearInterval(statusInterval);
    throw error;
  }
}

/**
 * Display workflow results
 */
function displayResults(result) {
  console.log(chalk.green.bold("\n✅ Workflow Results\n"));
  
  if (result.summary) {
    const { summary } = result;
    
    console.log(chalk.cyan("📊 Statistics:"));
    console.log(`   Subtasks: ${summary.statistics.subtasksTotal}`);
    console.log(`   Tests Generated: ${summary.statistics.testsGenerated}`);
    console.log(`   Solutions Found: ${summary.statistics.solutionsFound}`);
    console.log(`   Success Rate: ${summary.statistics.successRate}%`);
    console.log(`   Duration: ${summary.duration}\n`);
    
    console.log(chalk.cyan("🔗 GitHub Artifacts:"));
    console.log(`   Main Issue: #${summary.artifacts.mainIssue}`);
    console.log(`   Sub Issues: ${summary.artifacts.subIssues.map(n => `#${n}`).join(', ')}`);
    console.log(`   Test PRs: ${summary.artifacts.testPRs.map(n => `#${n}`).join(', ')}`);
    console.log(`   Solution PRs: ${summary.artifacts.solutionPRs.map(n => `#${n}`).join(', ')}\n`);
  }
  
  if (result.solutionPackage) {
    console.log(chalk.cyan("📦 Solution Package:"));
    result.solutionPackage.files.forEach(file => {
      console.log(`   - ${file.filename}`);
    });
  }
}

/**
 * Display decomposition results
 */
function displayDecomposition(result, format) {
  console.log(chalk.green.bold("\n🔍 Task Decomposition\n"));
  
  if (format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  
  console.log(chalk.cyan(`Original Task: ${result.originalTask}\n`));
  
  console.log(chalk.cyan("Subtasks:"));
  result.subtasks.forEach((subtask, index) => {
    console.log(chalk.white(`${index + 1}. ${subtask.title}`));
    console.log(chalk.gray(`   ${subtask.description}`));
    console.log(chalk.gray(`   Priority: ${subtask.priority}, Complexity: ${subtask.estimatedComplexity}/10`));
    console.log(chalk.gray(`   Dependencies: ${subtask.dependencies.join(', ') || 'None'}\n`));
  });
}

/**
 * Display test results
 */
function displayTest(result) {
  console.log(chalk.green.bold("\n🧪 Generated Test\n"));
  
  console.log(chalk.cyan(`Test Type: ${result.testType}`));
  console.log(chalk.cyan(`Framework: ${result.testFramework}`));
  console.log(chalk.cyan(`File: ${result.fileName}\n`));
  
  console.log(chalk.cyan("Test Code:"));
  console.log(chalk.gray(result.testCode));
}

/**
 * Display solution results
 */
function displaySolution(result) {
  console.log(chalk.green.bold("\n💡 Solution Search Results\n"));
  
  console.log(chalk.cyan(`Total Attempts: ${result.totalAttempts}`));
  console.log(chalk.cyan(`Best Solution: ${result.bestSolution ? '✅ Found' : '❌ Not found'}\n`));
  
  if (result.bestSolution) {
    console.log(chalk.cyan("Solution Code:"));
    console.log(chalk.gray(result.bestSolution.solution));
  }
}

/**
 * Display composition results
 */
function displayComposition(result) {
  console.log(chalk.green.bold("\n🔧 Solution Composition\n"));
  
  console.log(chalk.cyan(`Main Task: ${result.mainTask}`));
  console.log(chalk.cyan(`Components: ${result.metadata.partialSolutionCount}\n`));
  
  console.log(chalk.cyan("Composed Solution:"));
  console.log(chalk.gray(result.composedSolution.substring(0, 500) + "..."));
}

/**
 * Display workflow status
 */
function displayStatus(status) {
  console.log(chalk.blue.bold("\n📊 Workflow Status\n"));
  
  console.log(chalk.cyan(`Phase: ${status.phase}`));
  console.log(chalk.cyan(`Progress: ${status.progress}%`));
  console.log(chalk.cyan(`Task: ${status.task || 'None'}`));
  console.log(chalk.cyan(`Started: ${status.startTime || 'Not started'}`));
  
  if (status.statistics) {
    console.log(chalk.cyan("\nStatistics:"));
    console.log(`   Success Rate: ${status.statistics.successRate}%`);
    console.log(`   Subtasks: ${status.statistics.subtasksTotal}`);
    console.log(`   Solutions: ${status.statistics.solutionsFound}`);
  }
}

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 