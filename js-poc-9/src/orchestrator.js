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
    // 1. Decompose task and create issues
    const { mainIssue, subtasks } = await this.decomposer.decomposeAndCreateIssues(mainTask);
    
    const subtaskSolutions = [];
    
    for (const subtask of subtasks) {
      // 2. Generate test PR
      const testPR = await this.testGenerator.generateAndCreateTestPR(subtask);
      
      // 3. Wait for test approval
      const testApproved = await this.github.getApprovalStatus(testPR.prNumber);
      if (!testApproved) continue;
      
      // 4. Generate solution PR
      const solutionPR = await this.solutionSearcher.searchAndCreateSolutionPR(subtask, testPR.content);
      
      // 5. Wait for solution approval
      const solutionApproved = await this.github.getApprovalStatus(solutionPR.prNumber);
      if (!solutionApproved) continue;
      
      subtaskSolutions.push(solutionPR.content);
    }
    
    // 6. Compose final solution
    await this.composer.composeAndCreateFinalPR(mainIssue, subtaskSolutions);
  }
} 