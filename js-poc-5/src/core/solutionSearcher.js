import { LLMClient } from "./llmClient.js";
import { GitHubClient } from "./githubClient.js";

export class SolutionSearcher {
  constructor(options = {}) {
    this.llmClient = options.llmClient || new LLMClient();
    this.githubClient = options.githubClient || new GitHubClient();
    this.maxAttempts = options.maxAttempts || parseInt(process.env.UA_MAX_SOLUTION_ATTEMPTS) || 3;
  }

  async searchSolutionForSubtask(subtaskIssue, testCode) {
    console.log(`🔍 Searching solution for subtask #${subtaskIssue.number}: ${subtaskIssue.title}`);
    
    try {
      const subtaskData = subtaskIssue.subtaskData;
      let lastError = null;
      
      for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
        console.log(`🚀 Solution attempt ${attempt}/${this.maxAttempts}`);
        
        try {
          const result = await this.generateSolutionAttempt(
            subtaskData,
            testCode,
            attempt,
            lastError
          );
          
          return {
            ...result,
            attemptNumber: attempt,
            status: "success"
          };
        } catch (error) {
          lastError = error;
          console.error(`Attempt ${attempt} failed:`, error.message);
          
          if (attempt === this.maxAttempts) {
            throw new Error(`All ${this.maxAttempts} solution attempts failed. Last error: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error("Solution search failed:", error);
      throw error;
    }
  }

  async generateSolutionAttempt(subtaskData, testCode, attemptNumber, previousError) {
    // Step 1: Generate solution using LLM
    const solutionCode = await this.llmClient.generateSolution(
      subtaskData.title,
      subtaskData.description,
      testCode,
      attemptNumber
    );
    
    // Step 2: Create branch for the solution
    const branchName = this.githubClient.generateBranchName(
      `solution-${attemptNumber}`,
      subtaskData.title
    );
    await this.githubClient.createBranch(branchName);
    
    // Step 3: Create solution file
    const solutionFileName = this.generateSolutionFileName(subtaskData.title);
    const solutionFilePath = `src/${solutionFileName}`;
    
    await this.githubClient.createOrUpdateFile(
      solutionFilePath,
      solutionCode,
      `Add solution attempt ${attemptNumber} for: ${subtaskData.title}`,
      branchName
    );
    
    // Step 4: Create pull request for the solution
    const pullRequest = await this.createSolutionPullRequest(
      subtaskData.title,
      subtaskData.issueNumber || subtaskData.number,
      branchName,
      solutionFilePath,
      attemptNumber,
      previousError
    );
    
    return {
      solutionCode,
      solutionFilePath,
      branchName,
      pullRequest
    };
  }

  async searchSolutionsForAllSubtasks(subtaskIssues, testResults) {
    console.log(`🔍 Searching solutions for ${subtaskIssues.length} subtasks`);
    
    const results = [];
    
    for (const subtaskIssue of subtaskIssues) {
      try {
        // Find corresponding test result
        const testResult = testResults.find(tr => 
          tr.subtaskIssue.number === subtaskIssue.number
        );
        
        if (!testResult || testResult.status !== "success") {
          console.warn(`Skipping subtask #${subtaskIssue.number} - no valid test available`);
          results.push({
            subtaskIssue,
            status: "skipped",
            reason: "No valid test available"
          });
          continue;
        }
        
        const result = await this.searchSolutionForSubtask(subtaskIssue, testResult.testCode);
        results.push({
          subtaskIssue,
          ...result,
          status: "success"
        });
        
        // Update subtask issue with solution PR
        await this.updateSubtaskWithSolutionPR(
          subtaskIssue.number,
          result.pullRequest.number,
          result.attemptNumber
        );
        
      } catch (error) {
        console.error(`Failed to find solution for subtask #${subtaskIssue.number}:`, error);
        results.push({
          subtaskIssue,
          status: "failed",
          error: error.message
        });
      }
    }
    
    return results;
  }

  generateSolutionFileName(subtaskTitle) {
    return subtaskTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 40) + ".js";
  }

  async createSolutionPullRequest(subtaskTitle, subtaskIssueNumber, branchName, solutionFilePath, attemptNumber, previousError) {
    const title = `[SOLUTION] ${subtaskTitle} (Attempt ${attemptNumber})`;
    
    let description = `## Solution for Subtask #${subtaskIssueNumber}

This pull request provides a solution for the subtask that should make the failing tests pass.

### Solution Details
- **File**: \`${solutionFilePath}\`
- **Attempt**: ${attemptNumber}
- **Purpose**: Implement functionality to pass the failing tests

### Testing
- [ ] Tests pass locally
- [ ] Code follows best practices
- [ ] Solution is complete and production-ready`;

    if (previousError) {
      description += `

### Previous Attempt
The previous solution attempt (${attemptNumber - 1}) failed with:
\`\`\`
${previousError.message}
\`\`\`

This attempt addresses the previous issues.`;
    }

    description += `

### Next Steps
1. Review the solution code
2. Run tests to verify they pass
3. Approve and merge if successful
4. Move to composition phase

### Related
- Subtask Issue: #${subtaskIssueNumber}

---
*This solution was generated by the Universal Algorithm*`;
    
    return await this.githubClient.createPullRequest(
      title,
      description,
      branchName,
      "main"
    );
  }

  async updateSubtaskWithSolutionPR(subtaskIssueNumber, solutionPRNumber, attemptNumber) {
    const comment = `## Solution Generated 🚀

A solution has been generated for this subtask:
- **Solution PR**: #${solutionPRNumber}
- **Attempt**: ${attemptNumber}

### Next Steps
1. Review the solution PR
2. Test that it makes the failing tests pass
3. Approve and merge if successful
4. Mark subtask as complete

---
*Updated by the Universal Algorithm*`;
    
    await this.githubClient.addIssueComment(subtaskIssueNumber, comment);
    console.log(`📝 Updated subtask #${subtaskIssueNumber} with solution PR #${solutionPRNumber}`);
  }

  async validateSolution(solutionCode, testCode, subtaskData) {
    // Basic validation of the generated solution
    const validations = [
      {
        check: solutionCode.trim().length > 0,
        message: "Solution should not be empty"
      },
      {
        check: solutionCode.includes("export") || solutionCode.includes("module.exports"),
        message: "Solution should export functionality"
      },
      {
        check: !solutionCode.includes("TODO") && !solutionCode.includes("FIXME"),
        message: "Solution should not contain TODO or FIXME comments"
      }
    ];

    const failedValidations = validations.filter(v => !v.check);
    
    if (failedValidations.length > 0) {
      const errors = failedValidations.map(v => v.message).join(", ");
      console.warn(`Solution validation warnings: ${errors}`);
    }
    
    return {
      isValid: failedValidations.length === 0,
      warnings: failedValidations.map(v => v.message)
    };
  }

  async getSolutionStatus(solutionPRNumber) {
    try {
      // In a real implementation, you'd check the PR status and test results
      // For now, return basic status
      return {
        prNumber: solutionPRNumber,
        status: "pending_review",
        testsPass: null // Would be determined by CI/CD
      };
    } catch (error) {
      console.error("Failed to get solution status:", error);
      throw error;
    }
  }
} 