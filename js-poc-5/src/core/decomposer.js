import { LLMClient } from "./llmClient.js";
import { GitHubClient } from "./githubClient.js";

export class Decomposer {
  constructor(options = {}) {
    this.llmClient = options.llmClient || new LLMClient();
    this.githubClient = options.githubClient || new GitHubClient();
    this.maxSubtasks = options.maxSubtasks || parseInt(process.env.UA_MAX_SUBTASKS) || 10;
  }

  async decompose(taskDescription) {
    console.log("🔍 Decomposing task:", taskDescription);
    
    try {
      // Step 1: Generate decomposition using LLM
      const decomposition = await this.llmClient.generateDecomposition(taskDescription);
      
      if (!decomposition.subtasks || decomposition.subtasks.length === 0) {
        throw new Error("No subtasks generated from LLM");
      }

      // Limit the number of subtasks
      const subtasks = decomposition.subtasks.slice(0, this.maxSubtasks);
      
      console.log(`📋 Generated ${subtasks.length} subtasks`);
      
      // Step 2: Create main issue
      const mainIssue = await this.createMainIssue(taskDescription, subtasks);
      
      // Step 3: Create subtask issues
      const subtaskIssues = await this.createSubtaskIssues(subtasks, mainIssue.number);
      
      // Step 4: Link issues
      await this.linkIssues(mainIssue.number, subtaskIssues.map(issue => issue.number));
      
      return {
        mainIssue,
        subtaskIssues,
        decomposition: {
          ...decomposition,
          subtasks
        }
      };
    } catch (error) {
      console.error("Decomposition failed:", error);
      throw error;
    }
  }

  async createMainIssue(taskDescription, subtasks) {
    const issueBody = this.generateMainIssueBody(taskDescription, subtasks);
    
    const issue = await this.githubClient.createIssue(
      `[MAIN] ${taskDescription}`,
      issueBody,
      ["universal-algorithm", "main-task"]
    );
    
    console.log(`📝 Created main issue #${issue.number}: ${issue.title}`);
    return issue;
  }

  async createSubtaskIssues(subtasks, mainIssueNumber) {
    const issues = [];
    
    for (const [index, subtask] of subtasks.entries()) {
      const issueBody = this.generateSubtaskIssueBody(subtask, mainIssueNumber);
      
      const issue = await this.githubClient.createIssue(
        `[SUBTASK] ${subtask.title}`,
        issueBody,
        ["universal-algorithm", "subtask", `subtask-${index + 1}`]
      );
      
      console.log(`📝 Created subtask issue #${issue.number}: ${issue.title}`);
      issues.push({
        ...issue,
        subtaskData: subtask
      });
    }
    
    return issues;
  }

  async linkIssues(mainIssueNumber, subtaskNumbers) {
    await this.githubClient.linkIssues(mainIssueNumber, subtaskNumbers);
    console.log(`🔗 Linked main issue #${mainIssueNumber} to subtasks: ${subtaskNumbers.join(", ")}`);
  }

  generateMainIssueBody(taskDescription, subtasks) {
    const subtasksList = subtasks.map((subtask, index) => 
      `${index + 1}. **${subtask.title}**\n   - ${subtask.description}`
    ).join("\n\n");

    return `## Main Task Description
${taskDescription}

## Decomposition Overview
This task has been decomposed into ${subtasks.length} subtasks:

${subtasksList}

## Definition of Done
- [ ] All subtasks are completed
- [ ] All subtask solutions are composed into a final solution
- [ ] Final solution passes all tests
- [ ] Solution is documented and ready for production

## Workflow
1. **Decomposition**: ✅ Task decomposed into subtasks
2. **Test Generation**: 🔄 Generate failing tests for each subtask
3. **Solution Search**: ⏳ Find solutions for each subtask
4. **Composition**: ⏳ Compose all solutions into final result

---
*This issue was created by the Universal Algorithm*`;
  }

  generateSubtaskIssueBody(subtask, mainIssueNumber) {
    const acceptanceCriteria = subtask.acceptanceCriteria.map(criteria => 
      `- [ ] ${criteria}`
    ).join("\n");

    const dependencies = subtask.dependencies.length > 0 
      ? `\n## Dependencies\nThis subtask depends on:\n${subtask.dependencies.map(dep => `- ${dep}`).join("\n")}`
      : "";

    return `## Subtask Description
${subtask.description}

## Acceptance Criteria
${acceptanceCriteria}
${dependencies}

## Definition of Done
- [ ] Failing test is created and approved
- [ ] Implementation passes all tests
- [ ] Solution is reviewed and approved
- [ ] Solution is ready for composition

## Related
- Main Task: #${mainIssueNumber}

---
*This subtask was created by the Universal Algorithm*`;
  }

  async getDecompositionStatus(mainIssueNumber) {
    try {
      const mainIssue = await this.githubClient.getIssue(mainIssueNumber);
      
      // Extract subtask numbers from the issue body or comments
      // This is a simplified implementation - in production, you'd want
      // to store this relationship in a database or use GitHub projects
      
      return {
        mainIssue,
        status: mainIssue.state,
        // Add logic to track subtask completion
      };
    } catch (error) {
      console.error("Failed to get decomposition status:", error);
      throw error;
    }
  }
} 