import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

dotenv.config();

/**
 * Universal Algorithm GitHub Client
 * 
 * Provides a unified interface for interacting with GitHub API
 * for issue tracking, pull request management, and repository operations.
 */
export class GitHubClient {
  constructor(options = {}) {
    this.token = options.token || process.env.GITHUB_TOKEN;
    this.owner = options.owner || process.env.GITHUB_OWNER;
    this.repo = options.repo || process.env.GITHUB_REPO;
    this.dryRun = options.dryRun || process.env.UA_DRY_RUN === "true";
    this.debug = options.debug || process.env.UA_DEBUG === "true";

    if (!this.token && !this.dryRun) {
      throw new Error("GitHub token is required unless running in dry-run mode");
    }

    if (!this.owner || !this.repo) {
      throw new Error("GitHub owner and repo are required");
    }

    this.octokit = this.token ? new Octokit({ auth: this.token }) : null;

    if (this.debug) {
      console.log(`[GitHubClient] Initialized for ${this.owner}/${this.repo}, dry-run: ${this.dryRun}`);
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(title, body, labels = [], assignees = []) {
    if (this.dryRun) {
      const mockIssue = {
        number: Math.floor(Math.random() * 1000) + 1,
        title,
        body,
        labels,
        assignees,
        url: `https://github.com/${this.owner}/${this.repo}/issues/mock`,
        html_url: `https://github.com/${this.owner}/${this.repo}/issues/mock`,
      };
      
      if (this.debug) {
        console.log(`[GitHubClient] DRY RUN - Would create issue:`, mockIssue);
      }
      
      return mockIssue;
    }

    try {
      const response = await this.octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body,
        labels,
        assignees,
      });

      if (this.debug) {
        console.log(`[GitHubClient] Created issue #${response.data.number}: ${title}`);
      }

      return response.data;
    } catch (error) {
      console.error(`[GitHubClient] Error creating issue:`, error);
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  /**
   * Create a sub-issue linked to a parent issue
   */
  async createSubIssue(parentIssueNumber, title, body, labels = []) {
    const subIssueBody = `${body}\n\n---\n\n**Parent Issue:** #${parentIssueNumber}`;
    const subIssueLabels = [...labels, "subtask"];
    
    const subIssue = await this.createIssue(title, subIssueBody, subIssueLabels);
    
    // Add a comment to the parent issue linking the sub-issue
    await this.addComment(parentIssueNumber, `🔗 **Sub-issue created:** #${subIssue.number} - ${title}`);
    
    return subIssue;
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueNumber, body) {
    if (this.dryRun) {
      if (this.debug) {
        console.log(`[GitHubClient] DRY RUN - Would add comment to #${issueNumber}: ${body}`);
      }
      return { id: Math.floor(Math.random() * 1000) + 1 };
    }

    try {
      const response = await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body,
      });

      if (this.debug) {
        console.log(`[GitHubClient] Added comment to #${issueNumber}`);
      }

      return response.data;
    } catch (error) {
      console.error(`[GitHubClient] Error adding comment:`, error);
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  /**
   * Update an issue
   */
  async updateIssue(issueNumber, updates) {
    if (this.dryRun) {
      if (this.debug) {
        console.log(`[GitHubClient] DRY RUN - Would update issue #${issueNumber}:`, updates);
      }
      return { number: issueNumber, ...updates };
    }

    try {
      const response = await this.octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        ...updates,
      });

      if (this.debug) {
        console.log(`[GitHubClient] Updated issue #${issueNumber}`);
      }

      return response.data;
    } catch (error) {
      console.error(`[GitHubClient] Error updating issue:`, error);
      throw new Error(`Failed to update issue: ${error.message}`);
    }
  }

  /**
   * Close an issue
   */
  async closeIssue(issueNumber, comment = null) {
    if (comment) {
      await this.addComment(issueNumber, comment);
    }

    return this.updateIssue(issueNumber, { state: "closed" });
  }

  /**
   * Get an issue by number
   */
  async getIssue(issueNumber) {
    if (this.dryRun) {
      return {
        number: issueNumber,
        title: "Mock Issue",
        body: "Mock issue body",
        state: "open",
      };
    }

    try {
      const response = await this.octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });

      return response.data;
    } catch (error) {
      console.error(`[GitHubClient] Error getting issue:`, error);
      throw new Error(`Failed to get issue: ${error.message}`);
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName, fromRef = "main") {
    if (this.dryRun) {
      if (this.debug) {
        console.log(`[GitHubClient] DRY RUN - Would create branch: ${branchName} from ${fromRef}`);
      }
      return { ref: `refs/heads/${branchName}` };
    }

    try {
      // Get the SHA of the reference branch
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${fromRef}`,
      });

      // Create the new branch
      const response = await this.octokit.rest.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      });

      if (this.debug) {
        console.log(`[GitHubClient] Created branch: ${branchName}`);
      }

      return response.data;
    } catch (error) {
      console.error(`[GitHubClient] Error creating branch:`, error);
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Create or update a file in the repository
   */
  async createOrUpdateFile(path, content, message, branch = "main") {
    if (this.dryRun) {
      if (this.debug) {
        console.log(`[GitHubClient] DRY RUN - Would create/update file: ${path} on ${branch}`);
      }
      return { commit: { sha: "mock-sha" } };
    }

    try {
      // Try to get the existing file first
      let sha = null;
      try {
        const { data: existingFile } = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
          ref: branch,
        });
        sha = existingFile.sha;
      } catch (error) {
        // File doesn't exist, that's fine
      }

      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: Buffer.from(content).toString("base64"),
        branch,
        ...(sha && { sha }),
      });

      if (this.debug) {
        console.log(`[GitHubClient] Created/updated file: ${path}`);
      }

      return response.data;
    } catch (error) {
      console.error(`[GitHubClient] Error creating/updating file:`, error);
      throw new Error(`Failed to create/update file: ${error.message}`);
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(title, body, head, base = "main", draft = false) {
    if (this.dryRun) {
      const mockPR = {
        number: Math.floor(Math.random() * 1000) + 1,
        title,
        body,
        head: { ref: head },
        base: { ref: base },
        draft,
        url: `https://github.com/${this.owner}/${this.repo}/pull/mock`,
        html_url: `https://github.com/${this.owner}/${this.repo}/pull/mock`,
      };

      if (this.debug) {
        console.log(`[GitHubClient] DRY RUN - Would create PR:`, mockPR);
      }

      return mockPR;
    }

    try {
      const response = await this.octokit.rest.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body,
        head,
        base,
        draft,
      });

      if (this.debug) {
        console.log(`[GitHubClient] Created PR #${response.data.number}: ${title}`);
      }

      return response.data;
    } catch (error) {
      console.error(`[GitHubClient] Error creating PR:`, error);
      throw new Error(`Failed to create PR: ${error.message}`);
    }
  }

  /**
   * Create a complete test PR workflow
   */
  async createTestPR(issueNumber, testCode, testDescription, testFileName) {
    const branchName = `test/issue-${issueNumber}`;
    const testPath = `tests/${testFileName || `issue-${issueNumber}.test.js`}`;
    
    // Create branch
    await this.createBranch(branchName);
    
    // Create test file
    await this.createOrUpdateFile(
      testPath,
      testCode,
      `Add failing test for issue #${issueNumber}`,
      branchName
    );
    
    // Create PR
    const pr = await this.createPullRequest(
      `🧪 Add test for issue #${issueNumber}`,
      `${testDescription}\n\n**Related Issue:** #${issueNumber}\n\n**Test File:** \`${testPath}\`\n\n> This test should initially fail. A solution PR will be created once this is merged.`,
      branchName,
      "main",
      false
    );
    
    // Add comment to original issue
    await this.addComment(issueNumber, `🧪 **Test PR created:** #${pr.number}\n\nThis PR contains a failing test that defines the acceptance criteria. Once merged, solution attempts will be generated.`);
    
    return { pr, branch: branchName, testPath };
  }

  /**
   * Create a complete solution PR workflow
   */
  async createSolutionPR(issueNumber, solutionCode, solutionDescription, solutionFileName, attempt = 1) {
    const branchName = `solution/issue-${issueNumber}-attempt-${attempt}`;
    const solutionPath = `src/${solutionFileName || `issue-${issueNumber}-solution.js`}`;
    
    // Create branch
    await this.createBranch(branchName);
    
    // Create solution file
    await this.createOrUpdateFile(
      solutionPath,
      solutionCode,
      `Add solution for issue #${issueNumber} (attempt ${attempt})`,
      branchName
    );
    
    // Create PR
    const pr = await this.createPullRequest(
      `✨ Solution for issue #${issueNumber} (attempt ${attempt})`,
      `${solutionDescription}\n\n**Related Issue:** #${issueNumber}\n\n**Solution File:** \`${solutionPath}\`\n\n**Attempt:** ${attempt}\n\n> This solution should make the failing test pass.`,
      branchName,
      "main",
      false
    );
    
    // Add comment to original issue
    await this.addComment(issueNumber, `✨ **Solution PR created:** #${pr.number} (attempt ${attempt})\n\nThis PR contains a solution that should make the tests pass.`);
    
    return { pr, branch: branchName, solutionPath };
  }

  /**
   * List issues with optional filtering
   */
  async listIssues(options = {}) {
    if (this.dryRun) {
      return [
        { number: 1, title: "Mock Issue 1", state: "open" },
        { number: 2, title: "Mock Issue 2", state: "closed" },
      ];
    }

    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        ...options,
      });

      return response.data;
    } catch (error) {
      console.error(`[GitHubClient] Error listing issues:`, error);
      throw new Error(`Failed to list issues: ${error.message}`);
    }
  }

  /**
   * Get repository information
   */
  async getRepository() {
    if (this.dryRun) {
      return {
        name: this.repo,
        owner: { login: this.owner },
        html_url: `https://github.com/${this.owner}/${this.repo}`,
      };
    }

    try {
      const response = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      return response.data;
    } catch (error) {
      console.error(`[GitHubClient] Error getting repository:`, error);
      throw new Error(`Failed to get repository: ${error.message}`);
    }
  }
}

// Export a default instance
export const githubClient = new GitHubClient();

// Export convenience methods
export const {
  createIssue,
  createSubIssue,
  addComment,
  updateIssue,
  closeIssue,
  getIssue,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
  createTestPR,
  createSolutionPR,
  listIssues,
  getRepository,
} = githubClient; 