import { Octokit } from "@octokit/rest";

export class GitHubClient {
  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.repo = {
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME
    };
  }

  async createIssue(title, body, parentIssue = null) {
    const issue = await this.octokit.issues.create({
      ...this.repo,
      title,
      body
    });
    
    if (parentIssue) {
      await this.octokit.issues.createComment({
        ...this.repo,
        issue_number: parentIssue,
        body: `Subtask created: #${issue.data.number}`
      });
    }
    
    return issue.data.number;
  }

  async createPullRequest(title, branch, content, issueNumber) {
    // Implementation for creating PR with test/solution
    // Would include creating branch, committing file, opening PR
    return { prNumber: 123, url: "https://github.com/pr" };
  }

  async getApprovalStatus(prNumber) {
    // Check if PR is approved
    return true; // Stub implementation
  }
} 