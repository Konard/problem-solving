#!/usr/bin/env bun
import { universalAlgorithm } from "./orchestrator.js";
import chalk from "chalk";
import ora from "ora";

/**
 * Universal Algorithm Entry Point
 * 
 * This file serves as the main entry point for the Universal Algorithm.
 * It can be used both programmatically and as a CLI tool.
 */

/**
 * Main function that executes when script is run directly
 */
async function main() {
  const args = process.argv.slice(2);
  
  // If no arguments provided, show usage
  if (args.length === 0) {
    showUsage();
    return;
  }

  const taskDescription = args.join(" ");
  
  console.log(chalk.blue.bold("\n🚀 Universal Algorithm - js-poc-4\n"));
  console.log(chalk.cyan(`Task: ${taskDescription}\n`));

  const spinner = ora("Initializing Universal Algorithm...").start();

  try {
    // Execute the complete workflow
    const result = await universalAlgorithm.solve(taskDescription);
    
    spinner.succeed("Universal Algorithm completed successfully!");
    
    // Display summary
    displaySummary(result);
    
  } catch (error) {
    spinner.fail(`Universal Algorithm failed: ${error.message}`);
    
    if (process.env.UA_DEBUG === "true") {
      console.error(chalk.red("\nDebug Information:"));
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(chalk.blue.bold("\n🚀 Universal Algorithm - js-poc-4\n"));
  
  console.log(chalk.cyan("Usage:"));
  console.log(`  ${chalk.white("bun src/index.js")} ${chalk.gray("<task-description>")}`);
  console.log(`  ${chalk.white("bun start")} ${chalk.gray("<task-description>")}`);
  
  console.log(chalk.cyan("\nExamples:"));
  console.log(`  ${chalk.white('bun src/index.js "Build a URL shortener service"')}`);
  console.log(`  ${chalk.white('bun start "Create a REST API for task management"')}`);
  console.log(`  ${chalk.white('bun src/index.js "Implement user authentication with JWT"')}`);
  
  console.log(chalk.cyan("\nEnvironment Variables:"));
  console.log(`  ${chalk.gray("OPENAI_API_KEY")}     - Your OpenAI API key`);
  console.log(`  ${chalk.gray("GITHUB_TOKEN")}       - GitHub personal access token`);
  console.log(`  ${chalk.gray("GITHUB_OWNER")}       - GitHub username`);
  console.log(`  ${chalk.gray("GITHUB_REPO")}        - GitHub repository name`);
  console.log(`  ${chalk.gray("UA_DEBUG")}           - Enable debug mode (true/false)`);
  console.log(`  ${chalk.gray("UA_DRY_RUN")}         - Skip GitHub API calls (true/false)`);
  
  console.log(chalk.cyan("\nFor more options, use:"));
  console.log(`  ${chalk.white("bun src/cli.js --help")}`);
  
  console.log(chalk.cyan("\nDocumentation:"));
  console.log(`  ${chalk.gray("README.md")}          - Full documentation`);
  console.log(`  ${chalk.gray(".env.example")}       - Environment configuration example`);
}

/**
 * Display workflow summary
 */
function displaySummary(result) {
  if (!result.summary) return;
  
  const { summary } = result;
  
  console.log(chalk.green.bold("\n✅ Workflow Summary\n"));
  
  // Basic information
  console.log(chalk.cyan("📋 Task Information:"));
  console.log(`   Task: ${summary.taskDescription}`);
  console.log(`   Duration: ${summary.duration}`);
  console.log(`   Success Rate: ${summary.statistics.successRate}%\n`);
  
  // Phase completion
  console.log(chalk.cyan("🔄 Phases Completed:"));
  Object.entries(summary.phases).forEach(([phase, completed]) => {
    const icon = completed ? "✅" : "❌";
    const phaseName = phase.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`   ${icon} ${phaseName}`);
  });
  
  // Statistics
  console.log(chalk.cyan("\n📊 Statistics:"));
  console.log(`   Subtasks: ${summary.statistics.subtasksTotal}`);
  console.log(`   Tests Generated: ${summary.statistics.testsGenerated}`);
  console.log(`   Solutions Found: ${summary.statistics.solutionsFound}`);
  console.log(`   Average Complexity: ${summary.statistics.averageComplexity}/10`);
  
  // GitHub artifacts
  console.log(chalk.cyan("\n🔗 GitHub Artifacts:"));
  if (summary.artifacts.mainIssue) {
    console.log(`   Main Issue: #${summary.artifacts.mainIssue}`);
  }
  if (summary.artifacts.subIssues.length > 0) {
    console.log(`   Sub Issues: ${summary.artifacts.subIssues.map(n => `#${n}`).join(', ')}`);
  }
  if (summary.artifacts.testPRs.length > 0) {
    console.log(`   Test PRs: ${summary.artifacts.testPRs.map(n => `#${n}`).join(', ')}`);
  }
  if (summary.artifacts.solutionPRs.length > 0) {
    console.log(`   Solution PRs: ${summary.artifacts.solutionPRs.map(n => `#${n}`).join(', ')}`);
  }
  
  // Solution package
  if (result.solutionPackage) {
    console.log(chalk.cyan("\n📦 Generated Files:"));
    result.solutionPackage.files.forEach(file => {
      console.log(`   - ${file.filename}`);
    });
  }
  
  console.log(chalk.green("\n🎉 Task completed successfully!"));
  
  // Next steps
  console.log(chalk.cyan("\n📝 Next Steps:"));
  console.log("   1. Review the generated GitHub issues and PRs");
  console.log("   2. Validate the test suites");
  console.log("   3. Review and merge the solution PRs");
  console.log("   4. Test the final composed solution");
  console.log("   5. Deploy or integrate as needed");
}

/**
 * Handle uncaught errors
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\nUnhandled Rejection at:'), promise);
  console.error(chalk.red('Reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('\nUncaught Exception:'), error);
  process.exit(1);
});

// Export the main components for programmatic use
export { universalAlgorithm };
export { taskDecomposer } from "./core/decomposer.js";
export { testGenerator } from "./core/testGenerator.js";
export { solutionSearcher } from "./core/solutionSearcher.js";
export { solutionComposer } from "./core/composer.js";
export { githubClient } from "./core/githubClient.js";
export { llmClient } from "./core/llmClient.js";

// If this file is run directly, execute main function
if (import.meta.main) {
  main().catch(error => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
  });
} 