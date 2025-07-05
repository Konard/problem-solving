import { getChat } from "./llmClient.js";
import { createPullRequest } from "./githubClient.js";
import { writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";

const chat = getChat();

/**
 * Attempt to generate a solution for a subtask.
 * Writes a candidate implementation file and opens a PR.
 */
export async function attemptSolution({ subtaskTitle, subtaskBody, failingTestPath }) {
  const prompt = `You are an expert developer. Implement code that will make the following test pass. Respond with the full JavaScript source code only, no explanations.\nTest:\n\n${failingTestPath}\n\nSubtask description:\n${subtaskBody}`;

  const res = await chat.call([{ role: "user", content: prompt }]);
  const code = res.text ?? res;

  const implFileName = `${randomUUID()}.js`;
  const implFilePath = join("src", "generated", implFileName);

  await writeFile(implFilePath, code, "utf8");

  // A real implementation would commit the file, push a branch, and create a PR.
  // Here we just stub the PR creation for offline mode.
  const pr = await createPullRequest({
    title: `feat: attempt solution for ${subtaskTitle}`,
    head: `attempt/${implFileName}`,
    body: `Automated solution attempt for **${subtaskTitle}**. File: \
${implFilePath}`,
  });

  return { implFilePath, pr };
} 