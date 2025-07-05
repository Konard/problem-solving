import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  baseUrl: process.env.GITHUB_API_BASE_URL || "https://api.github.com",
});

const repoOwner = process.env.GITHUB_REPO_OWNER;
const repoName = process.env.GITHUB_REPO_NAME;

if (!repoOwner || !repoName) {
  console.warn(
    "[githubClient] Missing GITHUB_REPO_OWNER or GITHUB_REPO_NAME – GitHub calls will be skipped."
  );
}

export async function createIssue(title, body) {
  if (!repoOwner || !repoName) return null;
  const { data } = await octokit.issues.create({
    owner: repoOwner,
    repo: repoName,
    title,
    body,
  });
  return data;
}

export async function createPullRequest({ title, head, base = "main", body }) {
  if (!repoOwner || !repoName) return null;
  const { data } = await octokit.pulls.create({
    owner: repoOwner,
    repo: repoName,
    title,
    head,
    base,
    body,
  });
  return data;
}

export async function addCommentToIssue(issueNumber, comment) {
  if (!repoOwner || !repoName) return null;
  const { data } = await octokit.issues.createComment({
    owner: repoOwner,
    repo: repoName,
    issue_number: issueNumber,
    body: comment,
  });
  return data;
} 