import { askLLM } from "./llmClient.js";
import { createPullRequest } from "./githubClient.js";

/**
 * Propose code patch based on failing test output.
 * @param {string} failingTestOutput
 * @returns {Promise<string>} unified diff
 */
export async function proposePatch(failingTestOutput) {
  const prompt = `A unit test is failing with the output below. Provide a minimal code patch (unified diff) that makes the test pass.\n\nTest output:\n${failingTestOutput}\n\nPatch:`;
  return askLLM(prompt);
}

export async function openSolutionPR(branch, title, diff) {
  return createPullRequest(branch, title, `Proposed patch:\n\n\`\`\`diff\n${diff}\n\`\`\``);
}

export default { proposePatch, openSolutionPR }; 