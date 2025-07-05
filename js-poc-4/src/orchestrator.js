import { taskDecomposer } from "./core/decomposer.js";
import { testGenerator } from "./core/testGenerator.js";
import { solutionSearcher } from "./core/solutionSearcher.js";
import { solutionComposer } from "./core/composer.js";
import { githubClient } from "./core/githubClient.js";
import { llmClient } from "./core/llmClient.js";

/**
 * Universal Algorithm Orchestrator
 * 
 * Coordinates the entire workflow of the Universal Algorithm:
 * 1. Task Decomposition
 * 2. Issue Creation
 * 3. Test Generation
 * 4. Solution Search
 * 5. Solution Composition
 */
export class UniversalAlgorithm {
  constructor(options = {}) {
    this.taskDecomposer = options.taskDecomposer || taskDecomposer;
    this.testGenerator = options.testGenerator || testGenerator;
    this.solutionSearcher = options.solutionSearcher || solutionSearcher;
    this.solutionComposer = options.solutionComposer || solutionComposer;
    this.githubClient = options.githubClient || githubClient;
    this.llmClient = options.llmClient || llmClient;
    this.debug = options.debug || process.env.UA_DEBUG === "true";
    
    // Workflow state
    this.currentTask = null;
    this.workflowState = {
      phase: 'idle',
      mainIssue: null,
      decomposition: null,
      subIssues: [],
      tests: [],
      solutions: [],
      composition: null,
      startTime: null,
      endTime: null,
    };
  }

  /**
   * Execute the complete Universal Algorithm workflow
   */
  async solve(taskDescription, options = {}) {
    this.currentTask = taskDescription;
    this.workflowState.startTime = new Date().toISOString();
    
    if (this.debug) {
      console.log(`[UniversalAlgorithm] Starting workflow for: ${taskDescription}`);
    }

    try {
      // Phase 1: Task Decomposition
      await this.executeDecomposition(taskDescription, options);
      
      // Phase 2: Issue Creation
      await this.executeIssueCreation(options);
      
      // Phase 3: Test Generation
      await this.executeTestGeneration(options);
      
      // Phase 4: Solution Search
      await this.executeSolutionSearch(options);
      
      // Phase 5: Solution Composition
      await this.executeSolutionComposition(options);
      
      // Complete workflow
      await this.completeWorkflow(options);
      
      if (this.debug) {
        console.log(`[UniversalAlgorithm] Workflow completed successfully`);
      }

      return this.workflowState;
    } catch (error) {
      console.error(`[UniversalAlgorithm] Workflow failed:`, error);
      this.workflowState.phase = 'failed';
      this.workflowState.error = error.message;
      this.workflowState.endTime = new Date().toISOString();
      throw error;
    }
  }

  /**
   * Phase 1: Task Decomposition
   */
  async executeDecomposition(taskDescription, options = {}) {
    this.workflowState.phase = 'decomposition';
    
    if (this.debug) {
      console.log(`[UniversalAlgorithm] Phase 1: Decomposing task`);
    }

    const decomposition = await this.taskDecomposer.decompose(taskDescription, options);
    this.workflowState.decomposition = decomposition;

    if (this.debug) {
      console.log(`[UniversalAlgorithm] Decomposed into ${decomposition.subtasks.length} subtasks`);
    }
  }

  /**
   * Phase 2: Issue Creation
   */
  async executeIssueCreation(options = {}) {
    this.workflowState.phase = 'issue_creation';
    
    if (this.debug) {
      console.log(`[UniversalAlgorithm] Phase 2: Creating GitHub issues`);
    }

    const { decomposition } = this.workflowState;
    
    // Create main issue
    const mainIssue = await this.githubClient.createIssue(
      `🎯 ${this.currentTask}`,
      this.createMainIssueBody(decomposition),
      ['universal-algorithm', 'main-task']
    );
    
    this.workflowState.mainIssue = mainIssue;

    // Create sub-issues
    const subIssues = [];
    for (const subtask of decomposition.subtasks) {
      const subIssue = await this.githubClient.createSubIssue(
        mainIssue.number,
        `🔧 ${subtask.title}`,
        this.createSubIssueBody(subtask),
        ['universal-algorithm', 'subtask', `priority-${subtask.priority}`]
      );
      
      subIssues.push({
        ...subIssue,
        subtask,
      });
    }
    
    this.workflowState.subIssues = subIssues;

    if (this.debug) {
      console.log(`[UniversalAlgorithm] Created ${subIssues.length} sub-issues`);
    }
  }

  /**
   * Phase 3: Test Generation
   */
  async executeTestGeneration(options = {}) {
    this.workflowState.phase = 'test_generation';
    
    if (this.debug) {
      console.log(`[UniversalAlgorithm] Phase 3: Generating tests`);
    }

    const tests = [];
    
    for (const subIssue of this.workflowState.subIssues) {
      try {
        // Generate test
        const test = await this.testGenerator.generateTest(subIssue.subtask, options);
        
        // Create test PR
        const testPR = await this.githubClient.createTestPR(
          subIssue.number,
          test.testCode,
          test.testDescription,
          test.fileName
        );
        
        tests.push({
          ...test,
          subIssue,
          testPR,
        });
        
        if (this.debug) {
          console.log(`[UniversalAlgorithm] Generated test for: ${subIssue.subtask.title}`);
        }
      } catch (error) {
        console.error(`[UniversalAlgorithm] Failed to generate test for ${subIssue.subtask.title}:`, error);
      }
    }
    
    this.workflowState.tests = tests;

    if (this.debug) {
      console.log(`[UniversalAlgorithm] Generated ${tests.length} tests`);
    }
  }

  /**
   * Phase 4: Solution Search
   */
  async executeSolutionSearch(options = {}) {
    this.workflowState.phase = 'solution_search';
    
    if (this.debug) {
      console.log(`[UniversalAlgorithm] Phase 4: Searching for solutions`);
    }

    const solutions = [];
    
    for (const test of this.workflowState.tests) {
      try {
        // Search for solution
        const solutionResult = await this.solutionSearcher.findSolution(
          test.subIssue.subtask,
          test.testCode,
          options
        );
        
        if (solutionResult.bestSolution) {
          // Create solution PR
          const solutionPR = await this.githubClient.createSolutionPR(
            test.subIssue.number,
            solutionResult.bestSolution.solution,
            solutionResult.bestSolution.explanation,
            solutionResult.bestSolution.fileName
          );
          
          solutions.push({
            ...solutionResult,
            test,
            solutionPR,
          });
          
          if (this.debug) {
            console.log(`[UniversalAlgorithm] Found solution for: ${test.subIssue.subtask.title}`);
          }
        } else {
          if (this.debug) {
            console.log(`[UniversalAlgorithm] No valid solution found for: ${test.subIssue.subtask.title}`);
          }
        }
      } catch (error) {
        console.error(`[UniversalAlgorithm] Failed to find solution for ${test.subIssue.subtask.title}:`, error);
      }
    }
    
    this.workflowState.solutions = solutions;

    if (this.debug) {
      console.log(`[UniversalAlgorithm] Found ${solutions.length} solutions`);
    }
  }

  /**
   * Phase 5: Solution Composition
   */
  async executeSolutionComposition(options = {}) {
    this.workflowState.phase = 'solution_composition';
    
    if (this.debug) {
      console.log(`[UniversalAlgorithm] Phase 5: Composing final solution`);
    }

    const partialSolutions = this.workflowState.solutions
      .filter(s => s.bestSolution)
      .map(s => s.bestSolution);

    if (partialSolutions.length === 0) {
      throw new Error("No valid partial solutions found for composition");
    }

    // Compose the final solution
    const composition = await this.solutionComposer.composeSolutions(
      this.currentTask,
      partialSolutions,
      options
    );
    
    this.workflowState.composition = composition;

    // Create final solution package
    const solutionPackage = await this.solutionComposer.createSolutionPackage(
      this.currentTask,
      partialSolutions,
      options
    );
    
    this.workflowState.solutionPackage = solutionPackage;

    if (this.debug) {
      console.log(`[UniversalAlgorithm] Composed final solution with ${partialSolutions.length} components`);
    }
  }

  /**
   * Complete the workflow
   */
  async completeWorkflow(options = {}) {
    this.workflowState.phase = 'completed';
    this.workflowState.endTime = new Date().toISOString();
    
    // Update main issue with completion status
    if (this.workflowState.mainIssue) {
      await this.githubClient.addComment(
        this.workflowState.mainIssue.number,
        this.createCompletionComment()
      );
    }

    // Generate workflow summary
    const summary = this.generateWorkflowSummary();
    this.workflowState.summary = summary;

    if (this.debug) {
      console.log(`[UniversalAlgorithm] Workflow summary:`, summary);
    }
  }

  /**
   * Create main issue body
   */
  createMainIssueBody(decomposition) {
    return `# ${this.currentTask}

## Task Overview
${decomposition.originalTask}

## Decomposition Summary
- **Total Subtasks**: ${decomposition.subtasks.length}
- **Estimated Complexity**: ${decomposition.metadata.estimatedTotalComplexity}/10
- **Reasoning**: ${decomposition.metadata.decompositionReasoning}

## Subtasks
${decomposition.subtasks.map((subtask, index) => `
${index + 1}. **${subtask.title}** (Priority: ${subtask.priority}, Complexity: ${subtask.estimatedComplexity}/10)
   - ${subtask.description}
   - Dependencies: ${subtask.dependencies.length > 0 ? subtask.dependencies.join(', ') : 'None'}
   - Acceptance Criteria:
     ${subtask.acceptanceCriteria.map(c => `- ${c}`).join('\n     ')}
`).join('')}

## Workflow Status
- [ ] Decomposition Complete
- [ ] Tests Generated
- [ ] Solutions Found
- [ ] Final Solution Composed

---
*Generated by Universal Algorithm*`;
  }

  /**
   * Create sub-issue body
   */
  createSubIssueBody(subtask) {
    return `# ${subtask.title}

## Description
${subtask.description}

## Priority
${subtask.priority}

## Estimated Complexity
${subtask.estimatedComplexity}/10

## Dependencies
${subtask.dependencies.length > 0 ? subtask.dependencies.map(dep => `- ${dep}`).join('\n') : 'None'}

## Acceptance Criteria
${subtask.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}

## Workflow Status
- [ ] Test Generated
- [ ] Solution Found
- [ ] Solution Validated

---
*Generated by Universal Algorithm*`;
  }

  /**
   * Create completion comment
   */
  createCompletionComment() {
    const { solutions, composition, solutionPackage } = this.workflowState;
    
    return `🎉 **Universal Algorithm Workflow Complete!**

## Results Summary
- **Subtasks Completed**: ${solutions.length}/${this.workflowState.subIssues.length}
- **Tests Generated**: ${this.workflowState.tests.length}
- **Solutions Found**: ${solutions.length}
- **Final Solution**: ${composition ? '✅ Generated' : '❌ Failed'}

## Solution Package
${solutionPackage ? `
The complete solution has been composed and includes:
- **Main Solution**: \`${solutionPackage.files.find(f => f.filename === 'solution.js')?.filename || 'solution.js'}\`
- **Test Suite**: \`${solutionPackage.files.find(f => f.filename === 'test.js')?.filename || 'test.js'}\`
- **Documentation**: \`${solutionPackage.files.find(f => f.filename === 'README.md')?.filename || 'README.md'}\`
- **Package Configuration**: \`package.json\`

**Total Files**: ${solutionPackage.files.length}
` : 'Solution package generation failed.'}

## Next Steps
1. Review the generated solution
2. Run the test suite to validate functionality
3. Consider optimization and refactoring
4. Deploy or integrate as needed

---
*Completed by Universal Algorithm in ${this.calculateWorkflowDuration()}*`;
  }

  /**
   * Generate workflow summary
   */
  generateWorkflowSummary() {
    const duration = this.calculateWorkflowDuration();
    const successRate = this.workflowState.solutions.length / this.workflowState.subIssues.length;
    
    return {
      taskDescription: this.currentTask,
      duration,
      phases: {
        decomposition: !!this.workflowState.decomposition,
        issueCreation: this.workflowState.subIssues.length > 0,
        testGeneration: this.workflowState.tests.length > 0,
        solutionSearch: this.workflowState.solutions.length > 0,
        solutionComposition: !!this.workflowState.composition,
      },
      statistics: {
        subtasksTotal: this.workflowState.subIssues.length,
        testsGenerated: this.workflowState.tests.length,
        solutionsFound: this.workflowState.solutions.length,
        successRate: Math.round(successRate * 100),
        averageComplexity: this.calculateAverageComplexity(),
      },
      artifacts: {
        mainIssue: this.workflowState.mainIssue?.number,
        subIssues: this.workflowState.subIssues.map(si => si.number),
        testPRs: this.workflowState.tests.map(t => t.testPR?.number).filter(Boolean),
        solutionPRs: this.workflowState.solutions.map(s => s.solutionPR?.number).filter(Boolean),
        solutionPackage: !!this.workflowState.solutionPackage,
      },
    };
  }

  /**
   * Calculate workflow duration
   */
  calculateWorkflowDuration() {
    if (!this.workflowState.startTime || !this.workflowState.endTime) {
      return 'Unknown';
    }
    
    const start = new Date(this.workflowState.startTime);
    const end = new Date(this.workflowState.endTime);
    const durationMs = end - start;
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Calculate average complexity
   */
  calculateAverageComplexity() {
    if (!this.workflowState.decomposition?.subtasks.length) {
      return 0;
    }
    
    const totalComplexity = this.workflowState.decomposition.subtasks
      .reduce((sum, subtask) => sum + subtask.estimatedComplexity, 0);
    
    return Math.round(totalComplexity / this.workflowState.decomposition.subtasks.length);
  }

  /**
   * Get current workflow status
   */
  getStatus() {
    return {
      phase: this.workflowState.phase,
      progress: this.calculateProgress(),
      task: this.currentTask,
      startTime: this.workflowState.startTime,
      statistics: this.workflowState.phase === 'completed' ? this.workflowState.summary?.statistics : null,
    };
  }

  /**
   * Calculate workflow progress percentage
   */
  calculateProgress() {
    const phases = ['decomposition', 'issue_creation', 'test_generation', 'solution_search', 'solution_composition'];
    const currentPhaseIndex = phases.indexOf(this.workflowState.phase);
    
    if (currentPhaseIndex === -1) {
      return this.workflowState.phase === 'completed' ? 100 : 0;
    }
    
    return Math.round((currentPhaseIndex / phases.length) * 100);
  }

  /**
   * Pause the workflow
   */
  pause() {
    this.workflowState.paused = true;
    this.workflowState.pausedAt = new Date().toISOString();
  }

  /**
   * Resume the workflow
   */
  resume() {
    this.workflowState.paused = false;
    this.workflowState.resumedAt = new Date().toISOString();
  }

  /**
   * Reset the workflow state
   */
  reset() {
    this.currentTask = null;
    this.workflowState = {
      phase: 'idle',
      mainIssue: null,
      decomposition: null,
      subIssues: [],
      tests: [],
      solutions: [],
      composition: null,
      startTime: null,
      endTime: null,
    };
  }
}

// Export a default instance
export const universalAlgorithm = new UniversalAlgorithm();

// Export convenience methods
export const {
  solve,
  getStatus,
  pause,
  resume,
  reset,
} = universalAlgorithm; 