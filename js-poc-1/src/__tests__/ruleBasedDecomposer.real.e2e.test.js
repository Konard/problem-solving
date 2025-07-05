const RuleBasedDecomposer = require('../ruleBasedDecomposer');

describe('RuleBasedDecomposer E2E', () => {
  test('splits a sequential task into two subtasks', () => {
    const decomposer = new RuleBasedDecomposer();
    const result = decomposer.decompose('First, wash dishes, then cook dinner.');
    // Ensure we have a sequential subtask
    const sequential = result.subtasks.find(st => st.type === 'sequential');
    expect(sequential).toBeDefined();
    // That subtask should contain exactly two tasks
    expect(sequential.tasks).toHaveLength(2);
  });
}); 