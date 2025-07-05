import { Decomposer } from "./core/decomposer.js";
import { TestGenerator } from "./core/testGenerator.js";
import { SolutionSearcher } from "./core/solutionSearcher.js";
import { Composer } from "./core/composer.js";
import { LLMClient } from "./core/llmClient.js";
import { GitHubClient } from "./core/githubClient.js";
import chalk from "chalk";
import ora from "ora";

export class UniversalAlgorithm {
  constructor(options = {}) {
    this.llmClient = options.llmClient || new LLMClient();
    this.githubClient = options.githubClient || new GitHubClient();
    
    this.decomposer = options.decomposer || new Decomposer({
      llmClient: this.llmClient,
      githubClient: this.githubClient
    });
    
    this.testGenerator = options.testGenerator || new TestGenerator({
      llmClient: this.llmClient,
      githubClient: this.githubClient
    });
    
    this.solutionSearcher = options.solutionSearcher || new SolutionSearcher({
      llmClient: this.llmClient,
      githubClient: this.githubClient
    });
    
    this.composer = options.composer || new Composer({
      llmClient: this.llmClient,
      githubClient: this.githubClient
    });
    
    this.verbose = options.verbose || false;
  }

  async solve(taskDescription) {
    console.log(chalk.blue.bold("🚀 Starting Universal Algorithm"));
    console.log(chalk.cyan(`📋 Main Task: ${taskDescription}`));
    console.log(chalk.gray("─".repeat(80)));
    
    const startTime = Date.now();
    let spinner;
    
    try {
      const result = {
        taskDescription,
        startTime,
        phases: {}
      };
      
      // Phase 1: Decomposition
      console.log(chalk.yellow.bold("\n📊 Phase 1: Task Decomposition"));
      spinner = ora("Decomposing task into subtasks...").start();
      
      const decompositionResult = await this.decomposer.decompose(taskDescription);
      result.phases.decomposition = decompositionResult;
      
      spinner.succeed(chalk.green(`✅ Decomposed into ${decompositionResult.subtaskIssues.length} subtasks`));
      this.logPhaseResults("Decomposition", decompositionResult);
      
      // Phase 2: Test Generation
      console.log(chalk.yellow.bold("\n🧪 Phase 2: Test Generation"));
      spinner = ora("Generating failing tests for subtasks...").start();
      
      const testResults = await this.testGenerator.generateTestsForAllSubtasks(
        decompositionResult.subtaskIssues
      );
      result.phases.testGeneration = testResults;
      
      const successfulTests = testResults.filter(r => r.status === "success");
      spinner.succeed(chalk.green(`✅ Generated ${successfulTests.length}/${testResults.length} tests`));
      this.logPhaseResults("Test Generation", testResults);
      
      // Phase 3: Solution Search
      console.log(chalk.yellow.bold("\n🔍 Phase 3: Solution Search"));
      spinner = ora("Searching for solutions to make tests pass...").start();
      
      const solutionResults = await this.solutionSearcher.searchSolutionsForAllSubtasks(
        decompositionResult.subtaskIssues,
        testResults
      );
      result.phases.solutionSearch = solutionResults;
      
      const successfulSolutions = solutionResults.filter(r => r.status === "success");
      spinner.succeed(chalk.green(`✅ Found ${successfulSolutions.length}/${solutionResults.length} solutions`));
      this.logPhaseResults("Solution Search", solutionResults);
      
      // Phase 4: Composition
      console.log(chalk.yellow.bold("\n🔧 Phase 4: Solution Composition"));
      spinner = ora("Composing partial solutions into final solution...").start();
      
      const compositionResult = await this.composer.composeSolutions(
        taskDescription,
        solutionResults
      );
      result.phases.composition = compositionResult;
      
      if (compositionResult.status === "success") {
        spinner.succeed(chalk.green("✅ Composition complete"));
        
        // Update main issue with composition
        await this.composer.updateMainIssueWithComposition(
          decompositionResult.mainIssue.number,
          compositionResult
        );
      } else {
        spinner.warn(chalk.yellow("⚠️  Composition skipped or failed"));
      }
      
      this.logPhaseResults("Composition", compositionResult);
      
      // Final Results
      const endTime = Date.now();
      result.endTime = endTime;
      result.duration = endTime - startTime;
      
      console.log(chalk.green.bold("\n🎉 Universal Algorithm Complete!"));
      this.logFinalResults(result);
      
      return result;
      
    } catch (error) {
      if (spinner) spinner.fail(chalk.red(`❌ Error: ${error.message}`));
      console.error(chalk.red.bold("\n💥 Universal Algorithm Failed:"), error);
      throw error;
    }
  }

  async decomposeOnly(taskDescription) {
    console.log(chalk.blue.bold("🔍 Decomposition Only Mode"));
    console.log(chalk.cyan(`📋 Task: ${taskDescription}`));
    
    const spinner = ora("Decomposing task...").start();
    
    try {
      const result = await this.decomposer.decompose(taskDescription);
      spinner.succeed(chalk.green(`✅ Decomposed into ${result.subtaskIssues.length} subtasks`));
      
      this.logPhaseResults("Decomposition", result);
      return result;
    } catch (error) {
      spinner.fail(chalk.red(`❌ Decomposition failed: ${error.message}`));
      throw error;
    }
  }

  async solveSubtask(subtaskIssueNumber) {
    console.log(chalk.blue.bold("🎯 Solving Individual Subtask"));
    console.log(chalk.cyan(`📋 Subtask Issue: #${subtaskIssueNumber}`));
    
    let spinner;
    
    try {
      // Get subtask issue details
      spinner = ora("Fetching subtask details...").start();
      const subtaskIssue = await this.githubClient.getIssue(subtaskIssueNumber);
      spinner.succeed(chalk.green(`✅ Fetched subtask: ${subtaskIssue.title}`));
      
      // Parse subtask data from issue (simplified)
      const subtaskData = this.parseSubtaskFromIssue(subtaskIssue);
      subtaskIssue.subtaskData = subtaskData;
      
      // Generate test
      spinner = ora("Generating test...").start();
      const testResult = await this.testGenerator.generateTestForSubtask(subtaskIssue);
      spinner.succeed(chalk.green("✅ Test generated"));
      
      // Generate solution
      spinner = ora("Searching for solution...").start();
      const solutionResult = await this.solutionSearcher.searchSolutionForSubtask(
        subtaskIssue,
        testResult.testCode
      );
      spinner.succeed(chalk.green("✅ Solution found"));
      
      console.log(chalk.green.bold("\n🎉 Subtask Solved!"));
      this.logSubtaskResults(subtaskIssue, testResult, solutionResult);
      
      return {
        subtaskIssue,
        testResult,
        solutionResult
      };
    } catch (error) {
      if (spinner) spinner.fail(chalk.red(`❌ Error: ${error.message}`));
      console.error(chalk.red.bold("\n💥 Subtask solving failed:"), error);
      throw error;
    }
  }

  async composeOnly(mainIssueNumber) {
    console.log(chalk.blue.bold("🔧 Composition Only Mode"));
    console.log(chalk.cyan(`📋 Main Issue: #${mainIssueNumber}`));
    
    const spinner = ora("Composing solutions...").start();
    
    try {
      // This is a simplified implementation
      // In practice, you'd need to gather all solution results
      const mainIssue = await this.githubClient.getIssue(mainIssueNumber);
      
      // Mock solution results for demonstration
      const mockSolutionResults = []; // Would be populated from actual subtask solutions
      
      const result = await this.composer.composeSolutions(
        mainIssue.title,
        mockSolutionResults
      );
      
      if (result.status === "success") {
        spinner.succeed(chalk.green("✅ Composition complete"));
        await this.composer.updateMainIssueWithComposition(mainIssueNumber, result);
      } else {
        spinner.warn(chalk.yellow("⚠️  Composition skipped or failed"));
      }
      
      this.logPhaseResults("Composition", result);
      return result;
    } catch (error) {
      spinner.fail(chalk.red(`❌ Composition failed: ${error.message}`));
      throw error;
    }
  }

  parseSubtaskFromIssue(issue) {
    // Simplified parsing - in production, you'd have more sophisticated parsing
    const body = issue.body || "";
    
    return {
      title: issue.title.replace(/^\[SUBTASK\]\s*/, ""),
      description: body.split("## Acceptance Criteria")[0].replace("## Subtask Description", "").trim(),
      acceptanceCriteria: this.extractAcceptanceCriteria(body),
      dependencies: []
    };
  }

  extractAcceptanceCriteria(issueBody) {
    const criteriaSection = issueBody.split("## Acceptance Criteria")[1];
    if (!criteriaSection) return [];
    
    const lines = criteriaSection.split("\n");
    const criteria = [];
    
    for (const line of lines) {
      if (line.trim().startsWith("- [ ]")) {
        criteria.push(line.trim().replace("- [ ]", "").trim());
      }
    }
    
    return criteria;
  }

  logPhaseResults(phaseName, results) {
    if (!this.verbose) return;
    
    console.log(chalk.gray(`\n📊 ${phaseName} Results:`));
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        const status = result.status === "success" ? "✅" : "❌";
        console.log(chalk.gray(`  ${index + 1}. ${status} ${result.subtaskIssue?.title || result.title || "Unknown"}`));
      });
    } else {
      console.log(chalk.gray(`  Status: ${results.status || "Unknown"}`));
    }
  }

  logSubtaskResults(subtaskIssue, testResult, solutionResult) {
    console.log(chalk.gray("\n📊 Subtask Results:"));
    console.log(chalk.gray(`  Issue: #${subtaskIssue.number} - ${subtaskIssue.title}`));
    console.log(chalk.gray(`  Test PR: #${testResult.pullRequest.number}`));
    console.log(chalk.gray(`  Solution PR: #${solutionResult.pullRequest.number}`));
    console.log(chalk.gray(`  Solution Attempts: ${solutionResult.attemptNumber}`));
  }

  logFinalResults(result) {
    console.log(chalk.gray("\n📊 Final Results:"));
    console.log(chalk.gray(`  Duration: ${Math.round(result.duration / 1000)}s`));
    console.log(chalk.gray(`  Main Issue: #${result.phases.decomposition.mainIssue.number}`));
    console.log(chalk.gray(`  Subtasks: ${result.phases.decomposition.subtaskIssues.length}`));
    console.log(chalk.gray(`  Tests Generated: ${result.phases.testGeneration.filter(r => r.status === "success").length}`));
    console.log(chalk.gray(`  Solutions Found: ${result.phases.solutionSearch.filter(r => r.status === "success").length}`));
    console.log(chalk.gray(`  Composition: ${result.phases.composition.status}`));
    
    if (result.phases.composition.status === "success") {
      console.log(chalk.green(`  📝 Composition PR: #${result.phases.composition.pullRequest.number}`));
      console.log(chalk.green(`  📁 Solution File: ${result.phases.composition.composedFilePath}`));
    }
  }

  async getStatus(mainIssueNumber) {
    try {
      const status = await this.decomposer.getDecompositionStatus(mainIssueNumber);
      return status;
    } catch (error) {
      console.error("Failed to get status:", error);
      throw error;
    }
  }
} 