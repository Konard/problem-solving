import { llmClient } from "./llmClient.js";

/**
 * Universal Algorithm Test Generator
 * 
 * Generates comprehensive failing tests that define the "definition of done"
 * for each subtask. Tests serve as acceptance criteria and validation.
 */
export class TestGenerator {
  constructor(options = {}) {
    this.llmClient = options.llmClient || llmClient;
    this.debug = options.debug || process.env.UA_DEBUG === "true";
    this.defaultTestFramework = options.defaultTestFramework || "bun:test";
  }

  /**
   * Generate a failing test for a subtask
   */
  async generateTest(subtask, options = {}) {
    if (this.debug) {
      console.log(`[TestGenerator] Generating test for subtask: ${subtask.title}`);
    }

    try {
      const testDescription = this.createTestDescription(subtask);
      const result = await this.llmClient.generateTest(testDescription, options);
      
      // Process and validate the result
      const processedResult = this.processTestResult(result, subtask);
      
      if (this.debug) {
        console.log(`[TestGenerator] Generated ${processedResult.testType} test for: ${subtask.title}`);
      }

      return processedResult;
    } catch (error) {
      console.error(`[TestGenerator] Error generating test:`, error);
      
      // Fallback to simple test generation
      return this.createFallbackTest(subtask);
    }
  }

  /**
   * Create a comprehensive test description for the LLM
   */
  createTestDescription(subtask) {
    const acceptanceCriteria = subtask.acceptanceCriteria || [];
    const criteriaText = acceptanceCriteria.length > 0 
      ? `\n\nAcceptance Criteria:\n${acceptanceCriteria.map(c => `- ${c}`).join('\n')}`
      : '';

    return `${subtask.description}${criteriaText}`;
  }

  /**
   * Process and validate the test result
   */
  processTestResult(result, subtask) {
    return {
      subtaskId: subtask.id,
      subtaskTitle: subtask.title,
      testType: result.testType || "unit",
      testFramework: result.testFramework || this.defaultTestFramework,
      testCode: this.cleanTestCode(result.testCode),
      testDescription: result.testDescription || `Test for ${subtask.title}`,
      expectedFailureReason: result.expectedFailureReason || "Implementation not yet provided",
      imports: Array.isArray(result.imports) ? result.imports : [],
      fileName: this.generateTestFileName(subtask),
      metadata: {
        generatedAt: new Date().toISOString(),
        subtaskComplexity: subtask.estimatedComplexity,
        subtaskPriority: subtask.priority,
      },
    };
  }

  /**
   * Clean and format test code
   */
  cleanTestCode(testCode) {
    // Remove any markdown formatting
    let cleaned = testCode.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');
    
    // Ensure proper indentation
    const lines = cleaned.split('\n');
    let indentLevel = 0;
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // Adjust indent level based on brackets
      if (trimmed.includes('}') && !trimmed.includes('{')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const formatted = '  '.repeat(indentLevel) + trimmed;
      
      if (trimmed.includes('{') && !trimmed.includes('}')) {
        indentLevel++;
      }
      
      return formatted;
    });
    
    return formattedLines.join('\n');
  }

  /**
   * Generate a test file name
   */
  generateTestFileName(subtask) {
    const sanitized = subtask.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${sanitized}.test.js`;
  }

  /**
   * Create a fallback test when LLM fails
   */
  createFallbackTest(subtask) {
    if (this.debug) {
      console.log(`[TestGenerator] Creating fallback test for: ${subtask.title}`);
    }

    const testCode = `import { test, expect } from "bun:test";

test("${subtask.title}", () => {
  // TODO: Implement test for ${subtask.title}
  // ${subtask.description}
  
  // This test should fail until the implementation is provided
  expect(false).toBe(true);
});

test("${subtask.title} - should meet acceptance criteria", () => {
  ${subtask.acceptanceCriteria.map(criterion => 
    `// TODO: Test that ${criterion.toLowerCase()}`
  ).join('\n  ')}
  
  // This test should validate all acceptance criteria
  expect(false).toBe(true);
});`;

    return {
      subtaskId: subtask.id,
      subtaskTitle: subtask.title,
      testType: "unit",
      testFramework: "bun:test",
      testCode,
      testDescription: `Fallback test for ${subtask.title}`,
      expectedFailureReason: "Test is designed to fail until implementation is provided",
      imports: ['import { test, expect } from "bun:test";'],
      fileName: this.generateTestFileName(subtask),
      metadata: {
        generatedAt: new Date().toISOString(),
        subtaskComplexity: subtask.estimatedComplexity,
        subtaskPriority: subtask.priority,
        fallback: true,
      },
    };
  }

  /**
   * Generate multiple tests for a subtask
   */
  async generateTestSuite(subtask, options = {}) {
    const testTypes = options.testTypes || ['unit'];
    const tests = [];

    for (const testType of testTypes) {
      try {
        const test = await this.generateTest(subtask, { ...options, testType });
        tests.push(test);
      } catch (error) {
        console.error(`[TestGenerator] Failed to generate ${testType} test:`, error);
        // Continue with other test types
      }
    }

    return tests;
  }

  /**
   * Validate that a test properly fails
   */
  async validateTestFailure(testCode, options = {}) {
    // This would ideally run the test and ensure it fails
    // For now, we'll do a basic validation
    const hasExpectStatements = testCode.includes('expect(');
    const hasTestFunction = testCode.includes('test(') || testCode.includes('it(');
    const hasAssertions = testCode.includes('.toBe(') || testCode.includes('.toEqual(');

    const validation = {
      hasTestFunction,
      hasExpectStatements,
      hasAssertions,
      isValid: hasTestFunction && hasExpectStatements && hasAssertions,
    };

    if (this.debug) {
      console.log(`[TestGenerator] Test validation:`, validation);
    }

    return validation;
  }

  /**
   * Generate integration tests for multiple subtasks
   */
  async generateIntegrationTest(subtasks, options = {}) {
    const description = `Integration test for subtasks: ${subtasks.map(s => s.title).join(', ')}`;
    
    try {
      const result = await this.llmClient.generateTest(description, {
        ...options,
        testType: 'integration',
      });
      
      return this.processTestResult(result, {
        id: 'integration-test',
        title: 'Integration Test',
        description,
        estimatedComplexity: Math.max(...subtasks.map(s => s.estimatedComplexity)),
        priority: 'high',
        acceptanceCriteria: ['All subtasks work together correctly'],
      });
    } catch (error) {
      console.error(`[TestGenerator] Error generating integration test:`, error);
      return this.createFallbackIntegrationTest(subtasks);
    }
  }

  /**
   * Create a fallback integration test
   */
  createFallbackIntegrationTest(subtasks) {
    const testCode = `import { test, expect } from "bun:test";

test("Integration test for ${subtasks.map(s => s.title).join(', ')}", () => {
  // TODO: Test integration between subtasks
  ${subtasks.map(s => `// - ${s.title}: ${s.description}`).join('\n  ')}
  
  // This test should validate that all subtasks work together
  expect(false).toBe(true);
});`;

    return {
      subtaskId: 'integration-test',
      subtaskTitle: 'Integration Test',
      testType: 'integration',
      testFramework: 'bun:test',
      testCode,
      testDescription: `Integration test for ${subtasks.length} subtasks`,
      expectedFailureReason: 'Integration not yet implemented',
      imports: ['import { test, expect } from "bun:test";'],
      fileName: 'integration.test.js',
      metadata: {
        generatedAt: new Date().toISOString(),
        subtaskCount: subtasks.length,
        fallback: true,
      },
    };
  }

  /**
   * Generate end-to-end test for the complete solution
   */
  async generateE2ETest(mainTask, subtasks, options = {}) {
    const description = `End-to-end test for: ${mainTask}`;
    
    try {
      const result = await this.llmClient.generateTest(description, {
        ...options,
        testType: 'e2e',
      });
      
      return this.processTestResult(result, {
        id: 'e2e-test',
        title: 'End-to-End Test',
        description,
        estimatedComplexity: 8,
        priority: 'high',
        acceptanceCriteria: ['Complete solution works as expected'],
      });
    } catch (error) {
      console.error(`[TestGenerator] Error generating E2E test:`, error);
      return this.createFallbackE2ETest(mainTask);
    }
  }

  /**
   * Create a fallback E2E test
   */
  createFallbackE2ETest(mainTask) {
    const testCode = `import { test, expect } from "bun:test";

test("End-to-end test for: ${mainTask}", () => {
  // TODO: Test the complete solution end-to-end
  // Task: ${mainTask}
  
  // This test should validate the entire solution works as expected
  expect(false).toBe(true);
});`;

    return {
      subtaskId: 'e2e-test',
      subtaskTitle: 'End-to-End Test',
      testType: 'e2e',
      testFramework: 'bun:test',
      testCode,
      testDescription: `End-to-end test for: ${mainTask}`,
      expectedFailureReason: 'Complete solution not yet implemented',
      imports: ['import { test, expect } from "bun:test";'],
      fileName: 'e2e.test.js',
      metadata: {
        generatedAt: new Date().toISOString(),
        mainTask,
        fallback: true,
      },
    };
  }
}

// Export a default instance
export const testGenerator = new TestGenerator();

// Export convenience methods
export const {
  generateTest,
  generateTestSuite,
  validateTestFailure,
  generateIntegrationTest,
  generateE2ETest,
} = testGenerator; 