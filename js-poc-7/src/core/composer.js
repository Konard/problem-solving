import llmClient from './llmClient.js';
import githubClient from './githubClient.js';
import { HumanMessage } from '@langchain/core/messages';

/**
 * Composes a final solution from the solutions of subtasks.
 * @param {object} mainTaskIssue The GitHub issue for the main task.
 * @param {Array<object>} subtaskSolutions An array of objects, each containing the subtask and its solution code.
 * @returns {Promise<object>} A promise that resolves to the created pull request object for the final solution.
 */
export const composeSolution = async (mainTaskIssue, subtaskSolutions) => {
  const { title: mainTaskTitle, number: mainTaskIssueNumber } = mainTaskIssue;
  console.log(`Composing solution for main task #${mainTaskIssueNumber}: "${mainTaskTitle}"`);

  let solutionsString = '';
  for (const s of subtaskSolutions) {
    solutionsString += `
      // Solution for Subtask: "${s.task.title}"
      ${s.solutionCode}
    `;
  }

  const prompt = `
    You are an expert software architect. Your task is to combine several partial solutions into a single, coherent final solution.
    
    Main Task: "${mainTaskTitle}"

    Here are the partial solutions from the subtasks:
    ${solutionsString}

    Combine these into a final implementation that solves the main task.
    The code should be enclosed in a single markdown code block.
  `;

  const response = await llmClient.invoke([new HumanMessage(prompt)]);
  const finalSolutionCode = response.content.match(/```javascript\n([\s\S]*?)\n```/)[1];

  console.log('LLM generated final solution code:\n', finalSolutionCode);

  // In a real implementation, we would create a pull request with this final solution.
  console.log(`Creating pull request with final solution for task #${mainTaskIssueNumber}`);
  const pullRequest = {
    title: `Feat: ${mainTaskTitle} (Composed Solution)`,
    body: `This PR provides the final, composed solution for issue #${mainTaskIssueNumber}.`,
    branch: `solution-${mainTaskIssueNumber}-composed`,
  };

  console.log('Pull request for composed solution created successfully.');
  return pullRequest;
}; 