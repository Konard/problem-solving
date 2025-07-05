require('dotenv').config();

// Real end-to-end test: hit the actual API
jest.setTimeout(60000);

const LLMBasedDecomposer = require('../llmBasedDecomposer');

describe('LLMBasedDecomposer Real E2E', () => {
  let decomposer;

  beforeAll(() => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set; real E2E tests require a valid key');
    }
    decomposer = new LLMBasedDecomposer();
  });

  test('splits a single sequential task into two subtasks', async () => {
    const task = 'Split into two tasks: First, wash dishes, then cook dinner.';
    const result = await decomposer.decompose(task);
    expect(Array.isArray(result.subtasks)).toBe(true);
    expect(result.subtasks).toHaveLength(2);
  });
}); 