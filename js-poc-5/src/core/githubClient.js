import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();

export class GitHubClient {
  constructor(options = {}) {
    this.octokit = new Octokit({
      auth: options.token || process.env.GITHUB_TOKEN,
    });
    
    this.owner = options.owner || process.env.GITHUB_OWNER;
    this.repo = options.repo || process.env.GITHUB_REPO;
    this.dryRun = options.dryRun || process.env.UA_DRY_RUN === "true";
    
    if (!this.owner || !this.repo) {
      throw new Error("GitHub owner and repo must be specified");
    }
  }

  async createIssue(title, description, labels = []) {
    if (this.dryRun) {
      console.log(`[DRY RUN] Would create issue: ${title}`);
      return {
        number: Math.floor(Math.random() * 1000),
        title,
        body: description,
        labels: labels.map(label => ({ name: label })),
        html_url: `https://github.com/${this.owner}/${this.repo}/issues/mock`,
      };
    }

    try {
      const response = await this.octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body: description,
        labels,
      });
      
      return response.data;
    } catch (error) {
      console.error("Failed to create issue:", error);
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async updateIssue(issueNumber, updates) {
    if (this.dryRun) {
      console.log(`[DRY RUN] Would update issue #${issueNumber}:`, updates);
      return { number: issueNumber, ...updates };
    }

    try {
      const response = await this.octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        ...updates,
      });
      
      return response.data;
    } catch (error) {
      console.error("Failed to update issue:", error);
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async createPullRequest(title, description, headBranch, baseBranch = "main") {
    if (this.dryRun) {
      console.log(`[DRY RUN] Would create PR: ${title} (${headBranch} -> ${baseBranch})`);
      return {
        number: Math.floor(Math.random() * 1000),
        title,
        body: description,
        head: { ref: headBranch },
        base: { ref: baseBranch },
        html_url: `https://github.com/${this.owner}/${this.repo}/pull/mock`,
      };
    }

    try {
      const response = await this.octokit.rest.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body: description,
        head: headBranch,
        base: baseBranch,
      });
      
      return response.data;
    } catch (error) {
      console.error("Failed to create pull request:", error);
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async createOrUpdateFile(filePath, content, message, branch = "main") {
    if (this.dryRun) {
      console.log(`[DRY RUN] Would create/update file: ${filePath} on ${branch}`);
      return {
        content: { path: filePath, sha: "mock-sha" },
        commit: { sha: "mock-commit-sha" },
      };
    }

    try {
      // First, try to get the file to see if it exists
      let existingFile = null;
      try {
        const response = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          ref: branch,
        });
        existingFile = response.data;
      } catch (error) {
        // File doesn't exist, which is fine
      }

      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message,
        content: Buffer.from(content).toString("base64"),
        branch,
        ...(existingFile && { sha: existingFile.sha }),
      });
      
      return response.data;
    } catch (error) {
      console.error("Failed to create/update file:", error);
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async createBranch(branchName, fromBranch = "main") {
    if (this.dryRun) {
      console.log(`[DRY RUN] Would create branch: ${branchName} from ${fromBranch}`);
      return {
        ref: `refs/heads/${branchName}`,
        object: { sha: "mock-sha" },
      };
    }

    try {
      // Get the SHA of the base branch
      const baseResponse = await this.octokit.rest.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${fromBranch}`,
      });
      
      const baseSha = baseResponse.data.object.sha;
      
      // Create the new branch
      const response = await this.octokit.rest.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      });
      
      return response.data;
    } catch (error) {
      console.error("Failed to create branch:", error);
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async getIssue(issueNumber) {
    try {
      const response = await this.octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      
      return response.data;
    } catch (error) {
      console.error("Failed to get issue:", error);
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async addIssueComment(issueNumber, comment) {
    if (this.dryRun) {
      console.log(`[DRY RUN] Would add comment to issue #${issueNumber}: ${comment}`);
      return { body: comment };
    }

    try {
      const response = await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body: comment,
      });
      
      return response.data;
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async linkIssues(parentIssueNumber, childIssueNumbers) {
    const linkText = childIssueNumbers.map(num => `- #${num}`).join("\n");
    const comment = `## Related Subtasks\n\n${linkText}`;
    
    return await this.addIssueComment(parentIssueNumber, comment);
  }

  generateBranchName(prefix, title) {
    const sanitized = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 30);
    
    return `${prefix}/${sanitized}`;
  }
} 