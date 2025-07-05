import { test, expect, mock } from 'bun:test';
import { decomposeTask } from '../../src/core/decomposer.js';

mock.module('../src/core/llmClient.js', () => ({
  default: {
    invoke: () => Promise.resolve({ content: '["Subtask 1", "Subtask 2"]' })
  }
}));

test('decomposeTask should return an array of subtask objects', async () => {
  const taskDescription = 'Main task';
  const issue = { number: 1 };
  const subtasks = await decomposeTask(taskDescription, issue);

  expect(subtasks).toBeArray();
  expect(subtasks.length).toBe(2);
  expect(subtasks[0].title).toBe('Subtask 1');
  expect(subtasks[0].body).toContain('#1');
}); 