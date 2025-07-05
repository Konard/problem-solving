import { test, expect, mock } from 'bun:test';
import { composeSolution } from '../../src/core/composer.js';

const mockLLMResponse = `
\`\`\`javascript
const finalSolution = () => 'final';
\`\`\`
`;

mock.module('../src/core/llmClient.js', () => ({
  default: {
    invoke: () => Promise.resolve({ content: mockLLMResponse })
  }
}));

test('composeSolution should return a pull request object', async () => {
  const mainTaskIssue = { title: 'Main Task', number: 1 };
  const subtaskSolutions = [
    { task: { title: 'Subtask 1' }, solutionCode: 'const a = 1;' }
  ];
  const pr = await composeSolution(mainTaskIssue, subtaskSolutions);

  expect(pr.title).toBe('Feat: Main Task (Composed Solution)');
  expect(pr.body).toContain('#1');
  expect(pr.branch).toBe('solution-1-composed');
}); 