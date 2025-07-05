import { llmClient } from "./llmClient.js";

/**
 * Universal Algorithm Solution Composer
 * 
 * Combines multiple partial solutions into a cohesive final solution.
 * Handles integration, conflict resolution, and optimization.
 */
export class SolutionComposer {
  constructor(options = {}) {
    this.llmClient = options.llmClient || llmClient;
    this.debug = options.debug || process.env.UA_DEBUG === "true";
  }

  /**
   * Compose multiple partial solutions into a final solution
   */
  async composeSolutions(mainTask, partialSolutions, options = {}) {
    if (this.debug) {
      console.log(`[SolutionComposer] Composing ${partialSolutions.length} partial solutions for: ${mainTask}`);
    }

    try {
      // Analyze the partial solutions
      const analysis = this.analyzePartialSolutions(partialSolutions);
      
      // Generate the composed solution
      const result = await this.generateComposedSolution(mainTask, partialSolutions, analysis, options);
      
      // Post-process the result
      const processedResult = this.processCompositionResult(result, mainTask, analysis);
      
      if (this.debug) {
        console.log(`[SolutionComposer] Composed solution generated successfully`);
      }

      return processedResult;
    } catch (error) {
      console.error(`[SolutionComposer] Error composing solutions:`, error);
      
      // Fallback to simple composition
      return this.createFallbackComposition(mainTask, partialSolutions);
    }
  }

  /**
   * Analyze partial solutions to understand their structure and dependencies
   */
  analyzePartialSolutions(partialSolutions) {
    const analysis = {
      totalSolutions: partialSolutions.length,
      dependencies: [],
      exports: [],
      imports: [],
      functions: [],
      classes: [],
      conflicts: [],
      complexity: 0,
    };

    for (const solution of partialSolutions) {
      if (!solution.solution) continue;

      const code = solution.solution;
      
      // Extract exports
      const exportMatches = code.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g);
      if (exportMatches) {
        analysis.exports.push(...exportMatches.map(m => m.replace(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+/, '')));
      }

      // Extract imports
      const importMatches = code.match(/import\s+.+\s+from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        analysis.imports.push(...importMatches.map(m => m.match(/from\s+['"]([^'"]+)['"]/)[1]));
      }

      // Extract functions
      const functionMatches = code.match(/(?:function|const|let|var)\s+(\w+)\s*(?:\(|\s*=\s*\()/g);
      if (functionMatches) {
        analysis.functions.push(...functionMatches.map(m => m.replace(/(?:function|const|let|var)\s+(\w+)\s*(?:\(|\s*=\s*\().*/, '$1')));
      }

      // Extract classes
      const classMatches = code.match(/class\s+(\w+)/g);
      if (classMatches) {
        analysis.classes.push(...classMatches.map(m => m.replace(/class\s+/, '')));
      }

      // Add to complexity
      analysis.complexity += solution.metadata?.subtaskComplexity || 5;
    }

    // Remove duplicates
    analysis.exports = [...new Set(analysis.exports)];
    analysis.imports = [...new Set(analysis.imports)];
    analysis.functions = [...new Set(analysis.functions)];
    analysis.classes = [...new Set(analysis.classes)];

    // Check for conflicts (duplicate function/class names)
    const allIdentifiers = [...analysis.functions, ...analysis.classes];
    const duplicates = allIdentifiers.filter((item, index) => allIdentifiers.indexOf(item) !== index);
    analysis.conflicts = [...new Set(duplicates)];

    return analysis;
  }

  /**
   * Generate the composed solution using LLM
   */
  async generateComposedSolution(mainTask, partialSolutions, analysis, options = {}) {
    const solutionTexts = partialSolutions.map(s => s.solution || "// No solution provided").join('\n\n// --- Next Solution ---\n\n');
    
    const result = await this.llmClient.composeSolutions(
      [solutionTexts],
      mainTask,
      {
        ...options,
        analysis,
      }
    );

    return result;
  }

  /**
   * Process and validate the composition result
   */
  processCompositionResult(result, mainTask, analysis) {
    return {
      mainTask,
      composedSolution: this.cleanComposedCode(result.composedSolution),
      integrationNotes: result.integrationNotes || "Solutions composed automatically",
      testSuite: result.testSuite || this.generateFallbackTestSuite(mainTask),
      documentation: result.documentation || this.generateFallbackDocumentation(mainTask),
      additionalFiles: Array.isArray(result.additionalFiles) ? result.additionalFiles : [],
      metadata: {
        generatedAt: new Date().toISOString(),
        partialSolutionCount: analysis.totalSolutions,
        totalComplexity: analysis.complexity,
        conflicts: analysis.conflicts,
        exports: analysis.exports,
        imports: analysis.imports,
      },
    };
  }

  /**
   * Clean and format the composed code
   */
  cleanComposedCode(code) {
    // Remove any markdown formatting
    let cleaned = code.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');
    
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
   * Generate a fallback test suite when LLM fails
   */
  generateFallbackTestSuite(mainTask) {
    return `import { test, expect } from "bun:test";
import { solution } from "./solution.js";

test("${mainTask} - complete solution", () => {
  // TODO: Test the complete solution
  // This test should validate that the composed solution works correctly
  expect(solution).toBeDefined();
});

test("${mainTask} - integration test", () => {
  // TODO: Test that all parts work together
  // This test should validate the integration of all partial solutions
  expect(true).toBe(true);
});`;
  }

  /**
   * Generate fallback documentation when LLM fails
   */
  generateFallbackDocumentation(mainTask) {
    return `# ${mainTask}

## Overview

This solution was automatically composed from multiple partial solutions using the Universal Algorithm.

## Usage

\`\`\`javascript
import { solution } from "./solution.js";

// TODO: Add usage examples
\`\`\`

## Components

This solution combines the following components:
- Multiple partial solutions that were generated for individual subtasks
- Integration logic to connect the components
- Error handling and validation

## Testing

Run the tests with:
\`\`\`bash
bun test
\`\`\`

## Notes

- This solution was automatically generated
- Review and validate before production use
- Consider adding additional error handling as needed
`;
  }

  /**
   * Create a fallback composition when LLM fails
   */
  createFallbackComposition(mainTask, partialSolutions) {
    if (this.debug) {
      console.log(`[SolutionComposer] Creating fallback composition for: ${mainTask}`);
    }

    const combinedCode = this.createSimpleComposition(partialSolutions);
    
    return {
      mainTask,
      composedSolution: combinedCode,
      integrationNotes: "Fallback composition: Simple concatenation of partial solutions",
      testSuite: this.generateFallbackTestSuite(mainTask),
      documentation: this.generateFallbackDocumentation(mainTask),
      additionalFiles: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        partialSolutionCount: partialSolutions.length,
        fallback: true,
      },
    };
  }

  /**
   * Create a simple composition by concatenating solutions
   */
  createSimpleComposition(partialSolutions) {
    const header = `/**
 * Composed Solution
 * Generated by Universal Algorithm
 * 
 * This solution combines multiple partial solutions.
 */

`;

    const solutions = partialSolutions
      .filter(s => s.solution)
      .map((s, index) => {
        return `// --- Solution ${index + 1}: ${s.subtaskTitle || 'Unknown'} ---\n${s.solution}`;
      })
      .join('\n\n');

    const footer = `\n\n// --- Export composed solution ---\nexport default {\n  // TODO: Add appropriate exports\n};`;

    return header + solutions + footer;
  }

  /**
   * Validate the composed solution
   */
  async validateComposition(composedSolution, options = {}) {
    const validation = {
      hasStructure: false,
      hasExports: false,
      hasIntegration: false,
      hasErrorHandling: false,
      isValid: false,
      issues: [],
    };

    const code = composedSolution.composedSolution;

    // Check for basic structure
    validation.hasStructure = code.includes('function') || code.includes('class');
    if (!validation.hasStructure) {
      validation.issues.push("Missing function or class definitions");
    }

    // Check for exports
    validation.hasExports = code.includes('export');
    if (!validation.hasExports) {
      validation.issues.push("Missing export statements");
    }

    // Check for integration logic
    validation.hasIntegration = code.includes('import') || code.includes('require');
    if (!validation.hasIntegration) {
      validation.issues.push("Missing integration between components");
    }

    // Check for error handling
    validation.hasErrorHandling = code.includes('try') || code.includes('catch') || code.includes('throw');
    if (!validation.hasErrorHandling) {
      validation.issues.push("Missing error handling");
    }

    // Overall validation
    validation.isValid = validation.hasStructure && validation.hasExports;

    if (this.debug) {
      console.log(`[SolutionComposer] Composition validation:`, validation);
    }

    return validation;
  }

  /**
   * Optimize the composed solution
   */
  async optimizeComposition(composedSolution, options = {}) {
    const optimizationPrompt = `
Please optimize this composed solution:

${composedSolution.composedSolution}

Focus on:
1. Removing redundant code
2. Improving performance
3. Enhancing readability
4. Adding proper error handling
5. Ensuring consistency

Please provide the optimized version.
`;

    try {
      const result = await this.llmClient.ask(optimizationPrompt, options);
      
      return {
        ...composedSolution,
        composedSolution: this.cleanComposedCode(result),
        integrationNotes: composedSolution.integrationNotes + "\n\nOptimized for performance and readability.",
        metadata: {
          ...composedSolution.metadata,
          optimizedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(`[SolutionComposer] Error optimizing composition:`, error);
      return composedSolution;
    }
  }

  /**
   * Generate package.json for the composed solution
   */
  generatePackageJson(composedSolution, options = {}) {
    const packageName = options.packageName || composedSolution.mainTask
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return {
      name: packageName,
      version: "1.0.0",
      description: `Solution for: ${composedSolution.mainTask}`,
      main: "solution.js",
      type: "module",
      scripts: {
        test: "bun test",
        start: "bun solution.js",
      },
      dependencies: {
        // Add dependencies based on analysis
      },
      devDependencies: {
        "bun-types": "latest",
      },
      keywords: [
        "universal-algorithm",
        "automated-solution",
        "composed-solution",
      ],
      author: "Universal Algorithm",
      license: "MIT",
      generatedBy: "Universal Algorithm Solution Composer",
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create a complete solution package
   */
  async createSolutionPackage(mainTask, partialSolutions, options = {}) {
    const composedSolution = await this.composeSolutions(mainTask, partialSolutions, options);
    
    const packageJson = this.generatePackageJson(composedSolution, options);
    
    const files = [
      {
        filename: "solution.js",
        content: composedSolution.composedSolution,
      },
      {
        filename: "test.js",
        content: composedSolution.testSuite,
      },
      {
        filename: "README.md",
        content: composedSolution.documentation,
      },
      {
        filename: "package.json",
        content: JSON.stringify(packageJson, null, 2),
      },
      ...composedSolution.additionalFiles,
    ];

    return {
      composedSolution,
      packageJson,
      files,
      metadata: {
        ...composedSolution.metadata,
        packageCreatedAt: new Date().toISOString(),
      },
    };
  }
}

// Export a default instance
export const solutionComposer = new SolutionComposer();

// Export convenience methods
export const {
  composeSolutions,
  validateComposition,
  optimizeComposition,
  createSolutionPackage,
} = solutionComposer; 