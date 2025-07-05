import { test, expect, mock } from 'bun:test';
import llmClient from '../../src/core/llmClient.js';

mock.module('@langchain/openai', () => ({
  ChatOpenAI: class {
    constructor(options) {
      this.options = options;
    }
    invoke() {
      return Promise.resolve({ content: '{"subtasks": ["subtask 1", "subtask 2"]}' });
    }
  }
}));

test('llmClient should be configured correctly', () => {
  expect(llmClient.options.apiKey).toBe(process.env.OPENAI_API_KEY);
  expect(llmClient.options.baseURL).toBe(process.env.OPENAI_API_BASE_URL);
  expect(llmClient.options.model).toBe(process.env.OPENAI_API_MODEL);
});

test('llmClient.invoke should return a mocked response', async () => {
  const response = await llmClient.invoke("test prompt");
  expect(response.content).toBe('{"subtasks": ["subtask 1", "subtask 2"]}');
}); 