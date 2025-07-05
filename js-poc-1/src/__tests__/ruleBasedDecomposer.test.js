const RuleBasedDecomposer = require('../ruleBasedDecomposer');

describe('RuleBasedDecomposer', () => {
  let decomposer;

  beforeEach(() => {
    decomposer = new RuleBasedDecomposer();
  });

  test('should handle numbered list decomposition', () => {
    const task = `To implement a login system:
    1. Create login form
    2. Implement authentication
    3. Add password reset functionality`;

    const result = decomposer.decompose(task);
    expect(result.subtasks).toHaveLength(3);
    expect(result.subtasks[0].type).toBe('numberedList');
    expect(result.subtasks[0].description).toContain('Create login form');
    expect(result.metadata.decompositionMethod).toBe('rule-based');
  });

  test('should handle bullet point decomposition', () => {
    const task = `Project setup:
    • Initialize git repository
    • Create package.json
    • Install dependencies`;

    const result = decomposer.decompose(task);
    expect(result.subtasks).toHaveLength(3);
    expect(result.subtasks[0].type).toBe('bulletPoints');
    expect(result.metadata.decompositionMethod).toBe('rule-based');
  });

  test('should handle sequential tasks', () => {
    const task = `First, create a database schema, then implement the API endpoints`;

    const result = decomposer.decompose(task);
    expect(result.subtasks).toHaveLength(1);
    expect(result.subtasks[0].type).toBe('sequential');
    expect(result.subtasks[0].tasks).toHaveLength(2);
    expect(result.subtasks[0].tasks[0].type).toBe('prerequisite');
    expect(result.subtasks[0].tasks[1].type).toBe('dependent');
    expect(result.metadata.decompositionMethod).toBe('rule-based');
  });

  test('should handle atomic tasks', () => {
    const task = 'Implement a simple calculator';

    const result = decomposer.decompose(task);
    expect(result.subtasks).toHaveLength(1);
    expect(result.subtasks[0].type).toBe('atomic');
    expect(result.subtasks[0].description).toBe(task);
    expect(result.metadata.decompositionMethod).toBe('atomic');
  });

  test('should validate decomposition', () => {
    const task = `First, create a database schema, then create a database schema`;
    
    const decomposition = decomposer.decompose(task);
    const validation = decomposer.validateDecomposition(decomposition);
    
    expect(validation.isValid).toBe(false);
    expect(validation.issues).toContain('Circular dependency detected in sequential tasks');
  });

  test('should handle mixed pattern types', () => {
    const task = `Project initialization:
    1. First, create a new directory, then initialize git
    • Set up package.json
    Step 1: Install dependencies
    Prerequisites: Configure environment variables`;

    const result = decomposer.decompose(task);
    expect(result.subtasks.length).toBeGreaterThan(1);
    expect(result.metadata.decompositionMethod).toBe('rule-based');
    expect(result.metadata.patternCount).toBe(5);
  });
}); 