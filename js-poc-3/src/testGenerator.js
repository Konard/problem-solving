import { askLLM } from "./llmClient.js";

/**
 * Generate a failing unit test for a given subtask.
 * @param {string} subtask
 * @returns {Promise<string>} JavaScript source for bun test.
 */
export async function generateTest(subtask) {
  if (process.env.NODE_ENV === "test") {
    return `import { expect, test } from \"bun:test\";\n\n// TODO: implement automatically generated test for: ${subtask}\n\n test(\"placeholder\", () => { expect(true).toBe(false); });`;
  }

  const prompt = `You are a TDD expert using bun test (Vitest style). For the following requirement, write a single JavaScript test file that fails before implementation. Provide only the code.\n\nRequirement: \"\"\"${subtask}\"\"\"`;
  return askLLM(prompt);
}

export default { generateTest }; 