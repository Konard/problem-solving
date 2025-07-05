import { Octokit } from "octokit";
import 'dotenv/config';

if (!process.env.GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is not set in the environment variables.");
}

const githubClient = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// We will add more methods here for creating issues, PRs, etc.
// For example:
/*
export const createIssue = async (owner, repo, title, body) => {
  return await githubClient.request('POST /repos/{owner}/{repo}/issues', {
    owner,
    repo,
    title,
    body,
  });
};
*/

export default githubClient; 