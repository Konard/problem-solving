const LLMBasedDecomposer = require('../llmBasedDecomposer');

// Mock the ChatOpenAI class
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        subtasks: [
          { description: 'Create login form', type: 'atomic', estimatedComplexity: 'low' },
          { description: 'Implement auth', type: 'sequential', dependencies: ['Create login form'] }
        ],
        metadata: {
          decompositionMethod: 'llm-based',
          confidence: 0.9,
          reasoning: 'Test decomposition'
        }
      })
    })
  }))
}));

describe('LLMBasedDecomposer', () => {
  let decomposer;

  beforeEach(() => {
    jest.clearAllMocks();
    decomposer = new LLMBasedDecomposer();
  });

  test('should decompose task successfully', async () => {
    const result = await decomposer.decompose('Implement login');
    expect(result.subtasks).toHaveLength(2);
    expect(result.metadata.decompositionMethod).toBe('llm-based');
  });

  test('should validate decomposition correctly', async () => {
    const decomposition = {
      subtasks: [
        { description: 'Task A', type: 'sequential', dependencies: ['Task B'] },
        { description: 'Task B', type: 'sequential', dependencies: ['Task A'] }
      ],
      metadata: {
        decompositionMethod: 'llm-based',
        confidence: 0.9,
        reasoning: 'Test'
      }
    };
    const validation = await decomposer.validateDecomposition(decomposition);
    expect(validation.isValid).toBe(false);
    expect(validation.issues).toContain('Circular dependency detected');
  });
}); 