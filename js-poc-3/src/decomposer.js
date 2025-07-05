import { askLLM } from "./llmClient.js";

/**
 * Decompose a high-level task description into smaller subtasks.
 * Falls back to returning the original task in test environments.
 * @param {string} taskDescription
 * @returns {Promise<string[]>}
 */
export async function decomposeTask(taskDescription) {
  if (process.env.NODE_ENV === "test") {
    return [taskDescription];
  }

  const prompt = `You are a senior software architect. Decompose the following task into smaller, implementation-level subtasks. Respond with a JSON array of strings.\n\nTask: \"\"\"${taskDescription}\"\"\"`;
  const raw = await askLLM(prompt);

  try {
    const subtasks = JSON.parse(raw);
    if (!Array.isArray(subtasks)) throw new Error("Expected array");
    return subtasks;
  } catch (err) {
    console.warn("Could not parse LLM response, returning fallback subtask", err);
    return [taskDescription];
  }
}

export default { decomposeTask }; 