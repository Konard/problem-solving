import { test, expect, mock } from 'bun:test';
import { generateTest } from '../../src/core/testGenerator.js';

const mockLLMResponse = `
\`\`\`javascript
import { test, expect } from 'bun:test';
test("sample test", () => { expect(1).toBe(1); });
\`\`\`
`;

mock.module('../src/core/llmClient.js', () => ({
  default: {
    invoke: () => Promise.resolve({ content: mockLLMResponse })
  }
}));

test('generateTest should return a pull request object', async () => {
  const issue = { title: 'Test Task', body: 'Test Body', number: 1 };
  const pr = await generateTest(issue);

  expect(pr.title).toBe('Test: Test Task');
  expect(pr.body).toContain('#1');
  expect(pr.branch).toBe('test-1');
}); 