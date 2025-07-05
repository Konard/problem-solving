import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

/**
 * Universal Algorithm LLM Client
 * 
 * Provides a unified interface for interacting with various LLM providers
 * using LangChain. Supports structured output parsing and custom prompts.
 */
export class LLMClient {
  constructor(options = {}) {
    this.model = options.model || process.env.OPENAI_API_MODEL || "llama3.1-8b";
    this.temperature = parseFloat(options.temperature || process.env.OPENAI_API_TEMPERATURE || "0.1");
    this.baseURL = options.baseURL || process.env.OPENAI_API_BASE_URL;
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    this.debug = options.debug || process.env.UA_DEBUG === "true";
    
    this.llm = new ChatOpenAI({
      modelName: this.model,
      temperature: this.temperature,
      openAIApiKey: this.apiKey,
      ...(this.baseURL && { configuration: { baseURL: this.baseURL } }),
      maxRetries: 3,
      timeout: 30000,
    });

    if (this.debug) {
      console.log(`[LLMClient] Initialized with model: ${this.model}, temperature: ${this.temperature}`);
    }
  }

  /**
   * Send a simple text prompt to the LLM
   */
  async ask(prompt, options = {}) {
    try {
      if (this.debug) {
        console.log(`[LLMClient] Asking: ${prompt.substring(0, 100)}...`);
      }

      const response = await this.llm.invoke(prompt);
      
      if (this.debug) {
        console.log(`[LLMClient] Response: ${response.content.substring(0, 100)}...`);
      }

      return response.content;
    } catch (error) {
      console.error(`[LLMClient] Error asking LLM:`, error);
      throw new Error(`LLM request failed: ${error.message}`);
    }
  }

  /**
   * Send a prompt and parse the response using a structured parser
   */
  async askStructured(prompt, schema, options = {}) {
    try {
      const parser = StructuredOutputParser.fromZodSchema(schema);
      const formatInstructions = parser.getFormatInstructions();

      const fullPrompt = `${prompt}\n\n${formatInstructions}`;
      
      if (this.debug) {
        console.log(`[LLMClient] Asking structured: ${fullPrompt.substring(0, 100)}...`);
      }

      const response = await this.llm.invoke(fullPrompt);
      const parsed = await parser.parse(response.content);

      if (this.debug) {
        console.log(`[LLMClient] Structured response:`, parsed);
      }

      return parsed;
    } catch (error) {
      console.error(`[LLMClient] Error in structured request:`, error);
      throw new Error(`Structured LLM request failed: ${error.message}`);
    }
  }

  /**
   * Create a prompt template for reusable prompts
   */
  createPromptTemplate(template, inputVariables) {
    return new PromptTemplate({
      template,
      inputVariables,
    });
  }

  /**
   * Task decomposition specific method
   */
  async decomposeTask(taskDescription, options = {}) {
    const schema = z.object({
      subtasks: z.array(z.object({
        id: z.string().describe("Unique identifier for the subtask"),
        title: z.string().describe("Short title for the subtask"),
        description: z.string().describe("Detailed description of what needs to be done"),
        priority: z.enum(["high", "medium", "low"]).describe("Priority level"),
        estimatedComplexity: z.number().min(1).max(10).describe("Complexity score from 1-10"),
        dependencies: z.array(z.string()).describe("List of subtask IDs this depends on"),
        acceptanceCriteria: z.array(z.string()).describe("List of acceptance criteria"),
      })),
      metadata: z.object({
        totalSubtasks: z.number(),
        estimatedTotalComplexity: z.number(),
        decompositionReasoning: z.string(),
      }),
    });

    const prompt = `You are an expert software architect and project manager. Your task is to decompose a high-level software development task into smaller, manageable subtasks.

Task to decompose: "${taskDescription}"

Guidelines:
1. Break down the task into logical, implementation-focused subtasks
2. Each subtask should be specific and actionable
3. Identify dependencies between subtasks
4. Assign realistic complexity scores (1=trivial, 10=very complex)
5. Define clear acceptance criteria for each subtask
6. Aim for subtasks that can be completed in 1-3 hours each
7. Consider both functional and non-functional requirements
8. Include testing and documentation subtasks where appropriate

Focus on creating subtasks that are:
- Specific and actionable
- Independently testable
- Have clear "definition of done" criteria
- Are ordered logically with proper dependencies`;

    return this.askStructured(prompt, schema, options);
  }

  /**
   * Test generation specific method
   */
  async generateTest(subtaskDescription, options = {}) {
    const schema = z.object({
      testType: z.enum(["unit", "integration", "e2e"]).describe("Type of test to generate"),
      testFramework: z.string().describe("Recommended test framework"),
      testCode: z.string().describe("Complete test code"),
      testDescription: z.string().describe("Description of what the test validates"),
      expectedFailureReason: z.string().describe("Why this test should initially fail"),
      imports: z.array(z.string()).describe("Required imports for the test"),
    });

    const prompt = `You are an expert test engineer. Generate a comprehensive failing test for the following subtask.

Subtask: "${subtaskDescription}"

Requirements:
1. The test should be comprehensive and cover all acceptance criteria
2. The test should FAIL initially (before implementation)
3. Use modern JavaScript testing practices
4. Include all necessary imports and setup
5. Test should be specific and validate the exact behavior required
6. Use descriptive test names and clear assertions
7. Consider edge cases and error scenarios

The test should clearly define what "done" means for this subtask.`;

    return this.askStructured(prompt, schema, options);
  }

  /**
   * Solution generation specific method
   */
  async generateSolution(subtaskDescription, testCode, failureOutput = null, options = {}) {
    const schema = z.object({
      solution: z.string().describe("Complete implementation code"),
      explanation: z.string().describe("Explanation of the solution approach"),
      dependencies: z.array(z.string()).describe("Required dependencies or imports"),
      additionalFiles: z.array(z.object({
        filename: z.string(),
        content: z.string(),
      })).describe("Additional files needed for the solution"),
      testingNotes: z.string().describe("Notes about testing the solution"),
    });

    const failureContext = failureOutput 
      ? `\n\nThe test is currently failing with this output:\n${failureOutput}\n\n`
      : "\n\n";

    const prompt = `You are an expert software developer. Generate a complete solution that will make the failing test pass.

Subtask: "${subtaskDescription}"

Test Code:
\`\`\`javascript
${testCode}
\`\`\`${failureContext}

Requirements:
1. Write minimal but complete code that makes the test pass
2. Follow best practices and clean code principles
3. Include all necessary imports and dependencies
4. Ensure the solution is production-ready
5. Add appropriate error handling
6. Include JSDoc comments for public functions
7. Consider performance and maintainability

Focus on solving the specific problem defined by the test, nothing more.`;

    return this.askStructured(prompt, schema, options);
  }

  /**
   * Solution composition specific method
   */
  async composeSolutions(partialSolutions, mainTaskDescription, options = {}) {
    const schema = z.object({
      composedSolution: z.string().describe("Final composed solution code"),
      integrationNotes: z.string().describe("Notes about how components were integrated"),
      testSuite: z.string().describe("Complete test suite for the final solution"),
      documentation: z.string().describe("README or documentation for the solution"),
      additionalFiles: z.array(z.object({
        filename: z.string(),
        content: z.string(),
      })).describe("Additional files for the complete solution"),
    });

    const solutionsContext = partialSolutions.map((sol, idx) => 
      `Solution ${idx + 1}:\n${sol}`
    ).join("\n\n");

    const prompt = `You are an expert software architect. Compose multiple partial solutions into a cohesive final solution.

Main Task: "${mainTaskDescription}"

Partial Solutions:
${solutionsContext}

Requirements:
1. Integrate all partial solutions into a coherent whole
2. Resolve any conflicts or overlaps between solutions
3. Ensure proper interfaces and communication between components
4. Create a comprehensive test suite for the final solution
5. Generate appropriate documentation
6. Follow software architecture best practices
7. Ensure the solution is maintainable and extensible

The final solution should be production-ready and fully functional.`;

    return this.askStructured(prompt, schema, options);
  }
}

// Export a default instance
export const llmClient = new LLMClient();

// Export individual methods for convenience
export const {
  ask,
  askStructured,
  decomposeTask,
  generateTest,
  generateSolution,
  composeSolutions,
} = llmClient; 