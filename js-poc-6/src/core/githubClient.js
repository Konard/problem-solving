import { Octokit } from "@octokit/rest";

class GitHubClient {
    constructor() {
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });
        this.owner = process.env.GITHUB_OWNER;
        this.repo = process.env.GITHUB_REPO;
        this.dryRun = process.env.UA_DRY_RUN === 'true';
    }

    async createIssue({ title, body, labels }) {
        if (this.dryRun) {
            console.log(`[GitHubClient] DRY RUN: Creating issue with title: ${title}`);
            return { data: { number: Math.floor(Math.random() * 1000), html_url: 'https://github.com/mock/issue' } };
        }
        return this.octokit.issues.create({
            owner: this.owner,
            repo: this.repo,
            title,
            body,
            labels,
        });
    }
    
    async createPullRequest({ title, body, head, base }) {
        if (this.dryRun) {
            console.log(`[GitHubClient] DRY RUN: Creating PR with title: ${title}`);
            return { data: { number: Math.floor(Math.random() * 1000), html_url: 'https://github.com/mock/pr' } };
        }
        return this.octokit.pulls.create({
            owner: this.owner,
            repo: this.repo,
            title,
            body,
            head,
            base,
        });
    }

    // Add other methods for interacting with GitHub as needed...
    // - create branch
    // - commit files
    // - get issue
    // - etc.
}

export default new GitHubClient(); 