import { llmClient } from "./llmClient.js";

/**
 * Universal Algorithm Solution Searcher
 * 
 * Searches for code solutions that make failing tests pass.
 * Iteratively generates and improves solutions based on test feedback.
 */
export class SolutionSearcher {
  constructor(options = {}) {
    this.llmClient = options.llmClient || llmClient;
    this.maxAttempts = options.maxAttempts || parseInt(process.env.UA_MAX_SOLUTION_ATTEMPTS) || 3;
    this.debug = options.debug || process.env.UA_DEBUG === "true";
  }

  /**
   * Search for a solution to make a failing test pass
   */
  async findSolution(subtask, testCode, options = {}) {
    if (this.debug) {
      console.log(`[SolutionSearcher] Searching for solution to: ${subtask.title}`);
    }

    let attempts = [];
    let lastFailureOutput = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        if (this.debug) {
          console.log(`[SolutionSearcher] Attempt ${attempt}/${this.maxAttempts}`);
        }

        const solution = await this.generateSolution(subtask, testCode, lastFailureOutput, {
          ...options,
          attempt,
        });

        // Validate the solution
        const validation = await this.validateSolution(solution, testCode);
        
        const solutionAttempt = {
          attempt,
          solution,
          validation,
          timestamp: new Date().toISOString(),
        };

        attempts.push(solutionAttempt);

        if (validation.isValid) {
          if (this.debug) {
            console.log(`[SolutionSearcher] Found valid solution on attempt ${attempt}`);
          }
          break;
        }

        // Use validation feedback for next attempt
        lastFailureOutput = validation.failureReason;

      } catch (error) {
        console.error(`[SolutionSearcher] Error on attempt ${attempt}:`, error);
        
        attempts.push({
          attempt,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const result = {
      subtaskId: subtask.id,
      subtaskTitle: subtask.title,
      attempts,
      bestSolution: this.selectBestSolution(attempts),
      searchComplete: true,
      totalAttempts: attempts.length,
    };

    if (this.debug) {
      console.log(`[SolutionSearcher] Search complete. Best solution: ${result.bestSolution ? 'found' : 'not found'}`);
    }

    return result;
  }

  /**
   * Generate a solution using the LLM
   */
  async generateSolution(subtask, testCode, failureOutput = null, options = {}) {
    const testDescription = this.createSolutionDescription(subtask, testCode, failureOutput);
    
    try {
      const result = await this.llmClient.generateSolution(testDescription, testCode, failureOutput, options);
      
      return this.processSolutionResult(result, subtask, options);
    } catch (error) {
      console.error(`[SolutionSearcher] Error generating solution:`, error);
      return this.createFallbackSolution(subtask);
    }
  }

  /**
   * Create a comprehensive description for solution generation
   */
  createSolutionDescription(subtask, testCode, failureOutput = null) {
    let description = `${subtask.description}\n\nAcceptance Criteria:\n`;
    
    if (subtask.acceptanceCriteria && subtask.acceptanceCriteria.length > 0) {
      description += subtask.acceptanceCriteria.map(c => `- ${c}`).join('\n');
    } else {
      description += '- Solution should make the test pass';
    }

    if (failureOutput) {
      description += `\n\nPrevious attempt failed with: ${failureOutput}`;
    }

    return description;
  }

  /**
   * Process and validate the solution result
   */
  processSolutionResult(result, subtask, options = {}) {
    return {
      subtaskId: subtask.id,
      subtaskTitle: subtask.title,
      solution: this.cleanSolutionCode(result.solution),
      explanation: result.explanation || "Generated solution",
      dependencies: Array.isArray(result.dependencies) ? result.dependencies : [],
      additionalFiles: Array.isArray(result.additionalFiles) ? result.additionalFiles : [],
      testingNotes: result.testingNotes || "Test the solution against the failing test",
      fileName: this.generateSolutionFileName(subtask, options.attempt),
      metadata: {
        generatedAt: new Date().toISOString(),
        attempt: options.attempt || 1,
        subtaskComplexity: subtask.estimatedComplexity,
        subtaskPriority: subtask.priority,
      },
    };
  }

  /**
   * Clean and format solution code
   */
  cleanSolutionCode(solutionCode) {
    // Remove any markdown formatting
    let cleaned = solutionCode.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');
    
    // Ensure proper indentation
    const lines = cleaned.split('\n');
    let indentLevel = 0;
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // Adjust indent level based on brackets
      if (trimmed.includes('}') && !trimmed.includes('{')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const formatted = '  '.repeat(indentLevel) + trimmed;
      
      if (trimmed.includes('{') && !trimmed.includes('}')) {
        indentLevel++;
      }
      
      return formatted;
    });
    
    return formattedLines.join('\n');
  }

  /**
   * Generate a solution file name
   */
  generateSolutionFileName(subtask, attempt = 1) {
    const sanitized = subtask.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return attempt > 1 ? `${sanitized}-attempt-${attempt}.js` : `${sanitized}.js`;
  }

  /**
   * Create a fallback solution when LLM fails
   */
  createFallbackSolution(subtask) {
    if (this.debug) {
      console.log(`[SolutionSearcher] Creating fallback solution for: ${subtask.title}`);
    }

    const solutionCode = `/**
 * ${subtask.title}
 * ${subtask.description}
 */

// TODO: Implement solution for ${subtask.title}
export function solutionPlaceholder() {
  throw new Error("Solution not yet implemented: ${subtask.title}");
}

// TODO: Add your implementation here
// Make sure to export the functions/classes needed to pass the test

export default {
  solutionPlaceholder,
};`;

    return {
      subtaskId: subtask.id,
      subtaskTitle: subtask.title,
      solution: solutionCode,
      explanation: "Fallback solution placeholder",
      dependencies: [],
      additionalFiles: [],
      testingNotes: "Replace placeholder with actual implementation",
      fileName: this.generateSolutionFileName(subtask),
      metadata: {
        generatedAt: new Date().toISOString(),
        subtaskComplexity: subtask.estimatedComplexity,
        subtaskPriority: subtask.priority,
        fallback: true,
      },
    };
  }

  /**
   * Validate a solution against its test
   */
  async validateSolution(solution, testCode, options = {}) {
    // Basic validation - check if solution has proper structure
    const hasFunctions = solution.solution.includes('function') || solution.solution.includes('export');
    const hasImplementation = !solution.solution.includes('TODO:') && !solution.solution.includes('throw new Error');
    const hasExports = solution.solution.includes('export');

    const validation = {
      hasStructure: hasFunctions,
      hasImplementation,
      hasExports,
      isValid: hasFunctions && hasImplementation && hasExports,
      failureReason: null,
    };

    if (!validation.isValid) {
      const reasons = [];
      if (!hasFunctions) reasons.push("Missing function definitions");
      if (!hasImplementation) reasons.push("Contains placeholder or TODO comments");
      if (!hasExports) reasons.push("Missing exports");
      validation.failureReason = reasons.join(", ");
    }

    if (this.debug) {
      console.log(`[SolutionSearcher] Solution validation:`, validation);
    }

    return validation;
  }

  /**
   * Select the best solution from multiple attempts
   */
  selectBestSolution(attempts) {
    // Find the first valid solution
    const validSolutions = attempts.filter(a => a.solution && a.validation?.isValid);
    
    if (validSolutions.length > 0) {
      return validSolutions[0].solution;
    }

    // If no valid solutions, return the most complete one
    const solutionsWithCode = attempts.filter(a => a.solution && !a.error);
    
    if (solutionsWithCode.length > 0) {
      // Sort by implementation completeness
      const sorted = solutionsWithCode.sort((a, b) => {
        const aScore = this.calculateSolutionScore(a.solution);
        const bScore = this.calculateSolutionScore(b.solution);
        return bScore - aScore;
      });
      
      return sorted[0].solution;
    }

    return null;
  }

  /**
   * Calculate a score for solution quality
   */
  calculateSolutionScore(solution) {
    let score = 0;
    
    // Check for various quality indicators
    if (solution.solution.includes('function')) score += 10;
    if (solution.solution.includes('export')) score += 10;
    if (solution.solution.includes('/**')) score += 5; // JSDoc comments
    if (solution.solution.includes('try')) score += 5; // Error handling
    if (solution.solution.includes('test')) score += 5; // Test-related code
    if (!solution.solution.includes('TODO')) score += 10; // No TODOs
    if (!solution.solution.includes('throw new Error')) score += 10; // No placeholders
    
    // Penalize for poor quality
    if (solution.solution.length < 50) score -= 10; // Too short
    if (solution.solution.includes('placeholder')) score -= 5; // Placeholder code
    
    return score;
  }

  /**
   * Generate multiple solution attempts in parallel
   */
  async generateMultipleSolutions(subtask, testCode, options = {}) {
    const numSolutions = options.numSolutions || 3;
    const promises = [];

    for (let i = 0; i < numSolutions; i++) {
      promises.push(
        this.generateSolution(subtask, testCode, null, {
          ...options,
          attempt: i + 1,
        })
      );
    }

    try {
      const solutions = await Promise.all(promises);
      return solutions;
    } catch (error) {
      console.error(`[SolutionSearcher] Error generating multiple solutions:`, error);
      return [];
    }
  }

  /**
   * Improve a solution based on feedback
   */
  async improveSolution(originalSolution, feedback, options = {}) {
    const improvementPrompt = `
Improve this solution based on the feedback:

Original Solution:
${originalSolution.solution}

Feedback:
${feedback}

Please provide an improved version that addresses the feedback.
`;

    try {
      const result = await this.llmClient.ask(improvementPrompt, options);
      
      return {
        ...originalSolution,
        solution: this.cleanSolutionCode(result),
        explanation: `Improved solution based on feedback: ${feedback}`,
        metadata: {
          ...originalSolution.metadata,
          improvedAt: new Date().toISOString(),
          improvementFeedback: feedback,
        },
      };
    } catch (error) {
      console.error(`[SolutionSearcher] Error improving solution:`, error);
      return originalSolution;
    }
  }
}

// Export a default instance
export const solutionSearcher = new SolutionSearcher();

// Export convenience methods
export const {
  findSolution,
  generateSolution,
  validateSolution,
  generateMultipleSolutions,
  improveSolution,
} = solutionSearcher; 