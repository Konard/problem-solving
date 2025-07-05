require('dotenv').config();

// Increase timeout for API calls
jest.setTimeout(1000);

const LLMBasedDecomposer = require('../llmBasedDecomposer');

describe('LLMBasedDecomposer (E2E)', () => {
  let decomposer;

  beforeAll(() => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment; set it to run E2E tests');
    }
    decomposer = new LLMBasedDecomposer();
  });

  test('should split a simple sequential task into two subtasks', async () => {
    const task = 'First, wash dishes, then cook dinner.';
    const result = await decomposer.decompose(task);

    // Expect exactly two subtasks
    expect(result.subtasks).toHaveLength(2);

    // Descriptions should include both parts
    const descriptions = result.subtasks.map(st => st.description.toLowerCase());
    expect(descriptions).toEqual(
      expect.arrayContaining([
        expect.stringContaining('wash dishes'),
        expect.stringContaining('cook dinner'),
      ])
    );

    // Validate metadata
    expect(result.metadata.decompositionMethod).toBe('llm-based');
    expect(typeof result.metadata.confidence).toBe('number');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
    expect(result.metadata.confidence).toBeLessThanOrEqual(1);
    expect(typeof result.metadata.reasoning).toBe('string');
    expect(result.metadata.reasoning.length).toBeGreaterThan(0);
  });
}); 