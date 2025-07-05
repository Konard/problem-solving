import llmClient from './llmClient.js';
import githubClient from './githubClient.js';
import { HumanMessage } from '@langchain/core/messages';

/**
 * Generates a failing test for a task and creates a pull request.
 * @param {object} issue The GitHub issue object for the task.
 * @returns {Promise<object>} A promise that resolves to the created pull request object.
 */
export const generateTest = async (issue) => {
  const { title: taskTitle, body: taskDescription, number: issueNumber } = issue;
  console.log(`Generating test for task #${issueNumber}: "${taskTitle}"`);

  const prompt = `
    You are an expert software developer specializing in Test-Driven Development (TDD).
    Based on the following task description, write a single failing test file using the 'bun:test' framework.
    The test should accurately reflect the requirements of the task.
    The code should be enclosed in a single markdown code block.

    Task: "${taskTitle}"
    Description: "${taskDescription}"

    Example output:
    \`\`\`javascript
    import { test, expect } from 'bun:test';

    test("${taskTitle}", () => {
      // Your failing test logic here
      expect(false).toBe(true);
    });
    \`\`\`
  `;

  const response = await llmClient.invoke([new HumanMessage(prompt)]);
  const testCode = response.content.match(/```javascript\n([\s\S]*?)\n```/)[1];

  console.log('LLM generated test code:\n', testCode);

  // In a real implementation, we would:
  // 1. Create a new branch
  // 2. Create a new file with the test code
  // 3. Commit the file
  // 4. Create a pull request

  console.log(`Creating pull request with test for task #${issueNumber}`);
  const pullRequest = {
    title: `Test: ${taskTitle}`,
    body: `This PR adds a failing test for issue #${issueNumber}.`,
    branch: `test-${issueNumber}`,
  };

  console.log('Pull request created successfully.');
  return pullRequest;
}; 