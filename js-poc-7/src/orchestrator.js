import { decomposeTask } from './core/decomposer.js';
import { generateTest } from './core/testGenerator.js';
import { findSolution } from './core/solutionSearcher.js';
import { composeSolution } from './core/composer.js';

// Mock data for the prototype
const MOCK_MAIN_ISSUE = {
  number: 1,
  title: 'Implement a calculator',
  body: 'Create a simple calculator that can perform addition, subtraction, multiplication, and division.',
  owner: 'test-owner',
  repo: 'test-repo',
};

const MOCK_TEST_CODE = `
import { test, expect } from 'bun:test';
import { add } from './calculator.js';

test("adds two numbers", () => {
  expect(add(1, 2)).toBe(3);
});
`;

const MOCK_SOLUTION_CODE = `
export const add = (a, b) => a + b;
`;

/**
 * Main orchestrator function.
 * @param {object} mainIssue The main GitHub issue to solve.
 */
export const run = async (mainIssue) => {
  console.log('--- Starting process for issue #${mainIssue.number} ---');

  // 1. Decompose the main task into subtasks
  const subtasks = await decomposeTask(mainIssue.title, mainIssue);
  console.log(`\n--- Decomposed into ${subtasks.length} subtasks ---`);

  const subtaskSolutions = [];

  // This loop simulates the process for each subtask.
  // In a real scenario, this would be more complex, involving waiting for PR approvals.
  for (const subtask of subtasks) {
    console.log(`\n--- Processing subtask: "${subtask.title}" ---`);

    // 2. Generate a failing test for the subtask
    const testPR = await generateTest(subtask);
    console.log('Test PR created:', testPR.title);
    
    // In a real scenario, we would wait for the test PR to be reviewed and merged.
    console.log('...Simulating test PR approval...');

    // 3. Find a solution for the subtask
    // We pass mock test code here for the prototype.
    const solutionPR = await findSolution(subtask, MOCK_TEST_CODE);
    console.log('Solution PR created:', solutionPR.title);

    // In a real scenario, we would wait for the solution PR to pass tests and be merged.
    console.log('...Simulating solution PR approval...');
    
    // For the prototype, we store mock solution code.
    subtaskSolutions.push({
      task: subtask,
      solutionCode: MOCK_SOLUTION_CODE,
    });
  }

  // 4. Compose the final solution from subtask solutions
  if (subtaskSolutions.length > 0) {
    console.log('\n--- Composing final solution ---');
    const finalPR = await composeSolution(mainIssue, subtaskSolutions);
    console.log('Final composed solution PR created:', finalPR.title);
  }

  console.log('\n--- Process finished ---');
}; 