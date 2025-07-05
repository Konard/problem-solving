import { decomposeTask } from "./decomposer.js";
import { createIssue, addCommentToIssue } from "./githubClient.js";
import { generateFailingTest } from "./testGenerator.js";
import { attemptSolution } from "./solutionSearcher.js";

/**
 * End-to-end flow for a single high-level task.
 */
export async function decomposeAndTrack(taskDescription) {
  // 1. Create top-level GitHub issue
  const mainIssue = await createIssue(taskDescription, taskDescription);

  // 2. Decompose into subtasks via LLM
  const subtasks = await decomposeTask(taskDescription);

  // 3. For each subtask create issue & failing test PR
  for (const sub of subtasks) {
    const issue = await createIssue(sub.title, sub.body);

    // Link sub-issue back to main issue (naïve comment for now)
    if (mainIssue) {
      await addCommentToIssue(mainIssue.number, `Sub-task created: #${issue.number}`);
    }

    // Generate failing test and open draft PR
    const testPath = await generateFailingTest({
      subtaskTitle: sub.title,
      subtaskBody: sub.body,
    });

    await attemptSolution({
      subtaskTitle: sub.title,
      subtaskBody: sub.body,
      failingTestPath: testPath,
    });
  }

  return { mainIssue, subtasks };
} 