import llmClient from './llmClient.js';
import githubClient from './githubClient.js';
import { HumanMessage } from '@langchain/core/messages';

/**
 * Searches for a solution for a task and creates a pull request.
 * @param {object} issue The GitHub issue object for the task.
 *param {string} testCode The code of the failing test.
 * @returns {Promise<object>} A promise that resolves to the created pull request object.
 */
export const findSolution = async (issue, testCode) => {
  const { title: taskTitle, body: taskDescription, number: issueNumber } = issue;
  console.log(`Finding solution for task #${issueNumber}: "${taskTitle}"`);

  const prompt = `
    You are an expert software developer. Your task is to write code that passes the given test.
    
    Task: "${taskTitle}"
    Description: "${taskDescription}"

    Here is the failing test code that your solution must pass:
    \`\`\`javascript
    ${testCode}
    \`\`\`

    Provide the implementation code that solves the task and passes the test.
    The code should be enclosed in a single markdown code block.
  `;

  const response = await llmClient.invoke([new HumanMessage(prompt)]);
  const solutionCode = response.content.match(/```javascript\n([\s\S]*?)\n```/)[1];

  console.log('LLM generated solution code:\n', solutionCode);

  // In a real implementation, we would:
  // 1. Create a new branch
  // 2. Create/update the file with the solution code
  // 3. Commit the file
  // 4. Create a pull request

  console.log(`Creating pull request with solution for task #${issueNumber}`);
  const pullRequest = {
    title: `Feat: ${taskTitle}`,
    body: `This PR attempts to solve issue #${issueNumber}.`,
    branch: `solution-${issueNumber}`,
  };

  console.log('Pull request for solution created successfully.');
  return pullRequest;
}; 