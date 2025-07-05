import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_REPO_OWNER;
const repo = process.env.GITHUB_REPO_NAME;

export async function createIssue(title, body) {
  const { data } = await octokit.rest.issues.create({ owner, repo, title, body });
  return data;
}

export async function createSubIssue(parentIssueNumber, title, body) {
  const bodyWithReference = `${body}\n\nParent Issue: #${parentIssueNumber}`;
  return createIssue(title, bodyWithReference);
}

export async function createPullRequest(branch, title, body) {
  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head: branch,
    base: "main",
    body,
  });
  return data;
}

export default { createIssue, createSubIssue, createPullRequest }; 