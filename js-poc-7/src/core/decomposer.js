import llmClient from './llmClient.js';
import githubClient from './githubClient.js';
import { HumanMessage } from '@langchain/core/messages';

/**
 * Decomposes a task into subtasks using an LLM.
 * @param {string} taskDescription The description of the main task.
 * @param {object} issue The GitHub issue object for the main task.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of created subtask issue objects.
 */
export const decomposeTask = async (taskDescription, issue) => {
  console.log(`Decomposing task: "${taskDescription}"`);

  const prompt = `
    You are an expert project manager. Decompose the following task into a list of smaller, actionable subtasks.
    Provide the output as a JSON array of strings, where each string is a subtask title.

    Task: "${taskDescription}"

    Example output:
    ["Subtask 1 Title", "Subtask 2 Title", "Subtask 3 Title"]
  `;

  const response = await llmClient.invoke([new HumanMessage(prompt)]);
  const subtaskTitles = JSON.parse(response.content);

  console.log('LLM generated subtasks:', subtaskTitles);

  const subtaskIssues = [];
  // For the prototype, we'll just log the subtasks.
  // In the real implementation, we would use githubClient to create issues.
  for (const title of subtaskTitles) {
    console.log(`Creating issue for subtask: "${title}"`);
    // const newIssue = await githubClient.request('POST /repos/{owner}/{repo}/issues', {
    //   owner: issue.owner,
    //   repo: issue.repo,
    //   title: title,
    //   body: `This is a subtask of #${issue.number}.`,
    // });
    // subtaskIssues.push(newIssue.data);
    subtaskIssues.push({ title, body: `This is a subtask of #${issue.number}.` });
  }

  console.log('Subtasks created successfully.');
  return subtaskIssues;
}; 