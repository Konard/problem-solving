import { test, expect, mock } from 'bun:test';
import { findSolution } from '../../src/core/solutionSearcher.js';

const mockLLMResponse = `
\`\`\`javascript
const solution = () => 'hello';
\`\`\`
`;

mock.module('../src/core/llmClient.js', () => ({
  default: {
    invoke: () => Promise.resolve({ content: mockLLMResponse })
  }
}));

test('findSolution should return a pull request object', async () => {
  const issue = { title: 'Solve Task', body: 'Test Body', number: 1 };
  const testCode = 'const a = 1;';
  const pr = await findSolution(issue, testCode);

  expect(pr.title).toBe('Feat: Solve Task');
  expect(pr.body).toContain('#1');
  expect(pr.branch).toBe('solution-1');
}); 