import { Decomposer } from "./core/decomposer.js";
import { TestGenerator } from "./core/testGenerator.js";
import { SolutionSearcher } from "./core/solutionSearcher.js";
import { Composer } from "./core/composer.js";

export class Orchestrator {
  constructor() {
    this.decomposer = new Decomposer();
    this.testGenerator = new TestGenerator();
    this.solutionSearcher = new SolutionSearcher();
    this.composer = new Composer();
  }

  async execute(mainTask) {
    // 1. Decompose task
    const mainIssueId = await this.decomposer.decomposeMainTask(mainTask);
    
    // 2. Generate tests for all subtasks
    await this.testGenerator.generateTestsForIssue(mainIssueId);
    
    // 3. Find solutions for subtasks
    const solutions = await this.solutionSearcher.solveSubTasks(mainIssueId);
    
    // 4. Compose final solution
    const finalSolution = await this.composer.compose(solutions);
    
    console.log("Final solution composed successfully!");
    return finalSolution;
  }
} 