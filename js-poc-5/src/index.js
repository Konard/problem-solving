import { UniversalAlgorithm } from "./orchestrator.js";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

// Main entry point for programmatic usage
export { UniversalAlgorithm } from "./orchestrator.js";
export { LLMClient } from "./core/llmClient.js";
export { GitHubClient } from "./core/githubClient.js";
export { Decomposer } from "./core/decomposer.js";
export { TestGenerator } from "./core/testGenerator.js";
export { SolutionSearcher } from "./core/solutionSearcher.js";
export { Composer } from "./core/composer.js";

// Main function for direct execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(chalk.blue.bold("🚀 Universal Algorithm"));
    console.log(chalk.cyan("TDD-based automated problem-solving system"));
    console.log(chalk.gray("\nUsage:"));
    console.log(chalk.gray("  node src/index.js <task-description>"));
    console.log(chalk.gray("  OR use the CLI: bun run src/cli.js --help"));
    console.log(chalk.gray("\nExample:"));
    console.log(chalk.gray('  node src/index.js "Build a URL shortener service"'));
    return;
  }
  
  const taskDescription = args.join(" ");
  
  try {
    console.log(chalk.blue.bold("🚀 Starting Universal Algorithm"));
    console.log(chalk.cyan(`📋 Task: ${taskDescription}`));
    
    const ua = new UniversalAlgorithm({ verbose: true });
    const result = await ua.solve(taskDescription);
    
    console.log(chalk.green.bold("\n🎉 Universal Algorithm completed successfully!"));
    console.log(chalk.cyan(`📋 Main Issue: #${result.phases.decomposition.mainIssue.number}`));
    
    if (result.phases.composition.status === "success") {
      console.log(chalk.cyan(`📝 Composition PR: #${result.phases.composition.pullRequest.number}`));
      console.log(chalk.cyan(`📁 Solution File: ${result.phases.composition.composedFilePath}`));
    }
    
  } catch (error) {
    console.error(chalk.red.bold("❌ Universal Algorithm failed:"), error.message);
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red.bold("❌ Unexpected error:"), error);
    process.exit(1);
  });
} 