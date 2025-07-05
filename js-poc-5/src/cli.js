#!/usr/bin/env node

import { Command } from "commander";
import { UniversalAlgorithm } from "./orchestrator.js";
import inquirer from "inquirer";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const program = new Command();

program
  .name("universal-algorithm")
  .description("TDD-based automated problem-solving system")
  .version("1.0.0");

program
  .command("solve")
  .description("Solve a complete task using the Universal Algorithm")
  .argument("<task>", "Task description to solve")
  .option("-v, --verbose", "Enable verbose logging")
  .option("-d, --dry-run", "Run in dry-run mode (no actual GitHub changes)")
  .action(async (task, options) => {
    try {
      console.log(chalk.blue.bold("🚀 Universal Algorithm - Full Solve"));
      
      const ua = new UniversalAlgorithm({
        verbose: options.verbose,
        dryRun: options.dryRun
      });
      
      const result = await ua.solve(task);
      
      console.log(chalk.green.bold("\n✅ Task solved successfully!"));
      console.log(chalk.cyan(`📋 Main Issue: #${result.phases.decomposition.mainIssue.number}`));
      
      if (result.phases.composition.status === "success") {
        console.log(chalk.cyan(`📝 Composition PR: #${result.phases.composition.pullRequest.number}`));
      }
      
    } catch (error) {
      console.error(chalk.red.bold("❌ Failed to solve task:"), error.message);
      process.exit(1);
    }
  });

program
  .command("decompose")
  .description("Decompose a task into subtasks")
  .argument("<task>", "Task description to decompose")
  .option("-v, --verbose", "Enable verbose logging")
  .option("-d, --dry-run", "Run in dry-run mode (no actual GitHub changes)")
  .action(async (task, options) => {
    try {
      console.log(chalk.blue.bold("🔍 Universal Algorithm - Decompose"));
      
      const ua = new UniversalAlgorithm({
        verbose: options.verbose,
        dryRun: options.dryRun
      });
      
      const result = await ua.decomposeOnly(task);
      
      console.log(chalk.green.bold("\n✅ Task decomposed successfully!"));
      console.log(chalk.cyan(`📋 Main Issue: #${result.mainIssue.number}`));
      console.log(chalk.cyan(`📊 Subtasks: ${result.subtaskIssues.length}`));
      
      result.subtaskIssues.forEach((subtask, index) => {
        console.log(chalk.gray(`  ${index + 1}. #${subtask.number} - ${subtask.title}`));
      });
      
    } catch (error) {
      console.error(chalk.red.bold("❌ Failed to decompose task:"), error.message);
      process.exit(1);
    }
  });

program
  .command("solve-subtask")
  .description("Solve a specific subtask")
  .argument("<issue-number>", "GitHub issue number of the subtask")
  .option("-v, --verbose", "Enable verbose logging")
  .option("-d, --dry-run", "Run in dry-run mode (no actual GitHub changes)")
  .action(async (issueNumber, options) => {
    try {
      console.log(chalk.blue.bold("🎯 Universal Algorithm - Solve Subtask"));
      
      const ua = new UniversalAlgorithm({
        verbose: options.verbose,
        dryRun: options.dryRun
      });
      
      const result = await ua.solveSubtask(parseInt(issueNumber));
      
      console.log(chalk.green.bold("\n✅ Subtask solved successfully!"));
      console.log(chalk.cyan(`📋 Issue: #${result.subtaskIssue.number}`));
      console.log(chalk.cyan(`🧪 Test PR: #${result.testResult.pullRequest.number}`));
      console.log(chalk.cyan(`🚀 Solution PR: #${result.solutionResult.pullRequest.number}`));
      
    } catch (error) {
      console.error(chalk.red.bold("❌ Failed to solve subtask:"), error.message);
      process.exit(1);
    }
  });

program
  .command("compose")
  .description("Compose solutions for a main task")
  .argument("<main-issue-number>", "GitHub issue number of the main task")
  .option("-v, --verbose", "Enable verbose logging")
  .option("-d, --dry-run", "Run in dry-run mode (no actual GitHub changes)")
  .action(async (mainIssueNumber, options) => {
    try {
      console.log(chalk.blue.bold("🔧 Universal Algorithm - Compose"));
      
      const ua = new UniversalAlgorithm({
        verbose: options.verbose,
        dryRun: options.dryRun
      });
      
      const result = await ua.composeOnly(parseInt(mainIssueNumber));
      
      if (result.status === "success") {
        console.log(chalk.green.bold("\n✅ Solutions composed successfully!"));
        console.log(chalk.cyan(`📝 Composition PR: #${result.pullRequest.number}`));
        console.log(chalk.cyan(`📁 Solution File: ${result.composedFilePath}`));
      } else {
        console.log(chalk.yellow.bold("\n⚠️  Composition was skipped or failed"));
        console.log(chalk.yellow(`Reason: ${result.message || "Unknown"}`));
      }
      
    } catch (error) {
      console.error(chalk.red.bold("❌ Failed to compose solutions:"), error.message);
      process.exit(1);
    }
  });

program
  .command("status")
  .description("Get status of a main task")
  .argument("<main-issue-number>", "GitHub issue number of the main task")
  .action(async (mainIssueNumber) => {
    try {
      console.log(chalk.blue.bold("📊 Universal Algorithm - Status"));
      
      const ua = new UniversalAlgorithm();
      const status = await ua.getStatus(parseInt(mainIssueNumber));
      
      console.log(chalk.green.bold("\n📋 Task Status:"));
      console.log(chalk.cyan(`📌 Issue: #${status.mainIssue.number}`));
      console.log(chalk.cyan(`📍 State: ${status.status}`));
      console.log(chalk.cyan(`📝 Title: ${status.mainIssue.title}`));
      
    } catch (error) {
      console.error(chalk.red.bold("❌ Failed to get status:"), error.message);
      process.exit(1);
    }
  });

program
  .command("interactive")
  .description("Interactive mode for the Universal Algorithm")
  .option("-v, --verbose", "Enable verbose logging")
  .option("-d, --dry-run", "Run in dry-run mode (no actual GitHub changes)")
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold("🎮 Universal Algorithm - Interactive Mode"));
      
      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: [
            { name: "🚀 Solve a complete task", value: "solve" },
            { name: "🔍 Decompose a task only", value: "decompose" },
            { name: "🎯 Solve a specific subtask", value: "solve-subtask" },
            { name: "🔧 Compose solutions", value: "compose" },
            { name: "📊 Check task status", value: "status" }
          ]
        }
      ]);
      
      const ua = new UniversalAlgorithm({
        verbose: options.verbose,
        dryRun: options.dryRun
      });
      
      switch (answers.action) {
        case "solve":
          const { task } = await inquirer.prompt([
            {
              type: "input",
              name: "task",
              message: "Enter the task description:",
              validate: (input) => input.trim().length > 0 || "Task description cannot be empty"
            }
          ]);
          
          const result = await ua.solve(task);
          console.log(chalk.green.bold("\n✅ Task solved successfully!"));
          console.log(chalk.cyan(`📋 Main Issue: #${result.phases.decomposition.mainIssue.number}`));
          break;
          
        case "decompose":
          const { decomposeTask } = await inquirer.prompt([
            {
              type: "input",
              name: "decomposeTask",
              message: "Enter the task description to decompose:",
              validate: (input) => input.trim().length > 0 || "Task description cannot be empty"
            }
          ]);
          
          const decomposeResult = await ua.decomposeOnly(decomposeTask);
          console.log(chalk.green.bold("\n✅ Task decomposed successfully!"));
          console.log(chalk.cyan(`📋 Main Issue: #${decomposeResult.mainIssue.number}`));
          break;
          
        case "solve-subtask":
          const { subtaskNumber } = await inquirer.prompt([
            {
              type: "input",
              name: "subtaskNumber",
              message: "Enter the subtask issue number:",
              validate: (input) => /^\d+$/.test(input) || "Please enter a valid issue number"
            }
          ]);
          
          const subtaskResult = await ua.solveSubtask(parseInt(subtaskNumber));
          console.log(chalk.green.bold("\n✅ Subtask solved successfully!"));
          console.log(chalk.cyan(`🧪 Test PR: #${subtaskResult.testResult.pullRequest.number}`));
          break;
          
        case "compose":
          const { mainIssueNumber } = await inquirer.prompt([
            {
              type: "input",
              name: "mainIssueNumber",
              message: "Enter the main issue number:",
              validate: (input) => /^\d+$/.test(input) || "Please enter a valid issue number"
            }
          ]);
          
          const composeResult = await ua.composeOnly(parseInt(mainIssueNumber));
          if (composeResult.status === "success") {
            console.log(chalk.green.bold("\n✅ Solutions composed successfully!"));
            console.log(chalk.cyan(`📝 Composition PR: #${composeResult.pullRequest.number}`));
          }
          break;
          
        case "status":
          const { statusIssueNumber } = await inquirer.prompt([
            {
              type: "input",
              name: "statusIssueNumber",
              message: "Enter the main issue number:",
              validate: (input) => /^\d+$/.test(input) || "Please enter a valid issue number"
            }
          ]);
          
          const statusResult = await ua.getStatus(parseInt(statusIssueNumber));
          console.log(chalk.green.bold("\n📋 Task Status:"));
          console.log(chalk.cyan(`📌 Issue: #${statusResult.mainIssue.number}`));
          console.log(chalk.cyan(`📍 State: ${statusResult.status}`));
          break;
      }
      
    } catch (error) {
      console.error(chalk.red.bold("❌ Interactive mode failed:"), error.message);
      process.exit(1);
    }
  });

// Configuration check command
program
  .command("check-config")
  .description("Check configuration and API connectivity")
  .action(async () => {
    try {
      console.log(chalk.blue.bold("🔧 Configuration Check"));
      
      const requiredEnvVars = [
        "OPENAI_API_KEY",
        "GITHUB_TOKEN",
        "GITHUB_OWNER",
        "GITHUB_REPO"
      ];
      
      let configValid = true;
      
      for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
          console.log(chalk.green(`✅ ${envVar}: Set`));
        } else {
          console.log(chalk.red(`❌ ${envVar}: Missing`));
          configValid = false;
        }
      }
      
      if (!configValid) {
        console.log(chalk.red.bold("\n❌ Configuration is incomplete"));
        console.log(chalk.yellow("💡 Please check your .env file"));
        process.exit(1);
      }
      
      console.log(chalk.green.bold("\n✅ Configuration looks good!"));
      
    } catch (error) {
      console.error(chalk.red.bold("❌ Configuration check failed:"), error.message);
      process.exit(1);
    }
  });

// Error handling
program.on("command:*", () => {
  console.error(chalk.red.bold("❌ Invalid command"));
  console.log(chalk.yellow("💡 Run 'universal-algorithm --help' for available commands"));
  process.exit(1);
});

// Parse arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 