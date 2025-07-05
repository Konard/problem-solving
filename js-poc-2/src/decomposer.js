import { getChat } from "./llmClient.js";

const chat = getChat();

/**
 * Ask the LLM to break a task into 3-7 subtasks.
 * Returns an array of { title, body } objects.
 */
export async function decomposeTask(taskDescription) {
  const prompt = `You are a senior software architect. Decompose the following task into 3-7 clearly defined subtasks. For each subtask provide a short title and a detailed description. Respond with JSON array of objects with keys \"title\" and \"body\" only. Do NOT include markdown fences.\nTask: ${taskDescription}`;

  const res = await chat.call([{ role: "user", content: prompt }]);
  const text = res.text ?? res;

  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) return json;
    throw new Error("Parsed value is not array");
  } catch (e) {
    console.error("[decomposer] Failed to parse LLM JSON, falling back to a single generic issue.", e);
    return [
      {
        title: "Manual decomposition required",
        body: `The LLM response could not be parsed. Raw response:\n\n${text}`,
      },
    ];
  }
} 