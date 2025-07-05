require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');

class LLMBasedDecomposer {
  constructor() {
    // Initialize the LLM with configuration from environment variables
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_API_MODEL || 'gpt-3.5-turbo',
      temperature: parseFloat(process.env.OPENAI_API_TEMPERATURE) || 0.7,
      maxTokens: parseInt(process.env.OPENAI_API_MAX_TOKENS) || 1000,
      configuration: {
        baseURL: process.env.OPENAI_API_BASE_URL,
      },
    });

    // Define the output schema for task decomposition
    this.outputSchema = z.object({
      subtasks: z.array(
        z.object({
          description: z.string(),
          type: z.enum(['atomic', 'sequential', 'parallel', 'prerequisite']),
          dependencies: z.array(z.string()).optional(),
          estimatedComplexity: z.enum(['low', 'medium', 'high']).optional(),
        })
      ),
      metadata: z.object({
        decompositionMethod: z.literal('llm-based'),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
      }),
    });

    // Create the output parser
    this.outputParser = StructuredOutputParser.fromZodSchema(this.outputSchema);

    // Create the prompt template
    this.promptTemplate = new PromptTemplate({
      template: `You are a task decomposition expert. Your goal is to break down a given task into smaller, manageable subtasks.

Task to decompose:
{task}

Guidelines:
1. Break down the task into logical subtasks
2. Identify dependencies between subtasks
3. Assign appropriate types (atomic, sequential, parallel, prerequisite)
4. Estimate complexity where possible
5. Provide reasoning for your decomposition

{format_instructions}

Your decomposition:`,
      inputVariables: ['task'],
      partialVariables: {
        format_instructions: this.outputParser.getFormatInstructions(),
      },
    });
  }

  async decompose(taskDescription) {
    try {
      // Format the prompt with the task description
      const prompt = await this.promptTemplate.format({
        task: taskDescription,
      });

      // Get the response from the LLM
      const response = await this.llm.invoke(prompt);

      // Parse the response into the structured format
      const parsedOutput = await this.outputParser.parse(response.content);

      // Add the original task to the output
      return {
        originalTask: taskDescription,
        ...parsedOutput,
      };
    } catch (error) {
      console.error('Error in LLM-based decomposition:', error);
      // Fallback to atomic task if decomposition fails
      return {
        originalTask: taskDescription,
        subtasks: [
          {
            description: taskDescription,
            type: 'atomic',
          },
        ],
        metadata: {
          decompositionMethod: 'llm-based',
          confidence: 0,
          reasoning: `Decomposition failed: ${error.message}`,
        },
      };
    }
  }

  async validateDecomposition(decomposition) {
    const validation = {
      isValid: true,
      issues: [],
    };

    try {
      // Validate the structure using the schema
      this.outputSchema.parse(decomposition);

      // Check for circular dependencies
      const dependencyGraph = new Map();
      decomposition.subtasks.forEach((task) => {
        if (task.dependencies) {
          dependencyGraph.set(task.description, task.dependencies);
        }
      });

      // Simple cycle detection
      const visited = new Set();
      const recursionStack = new Set();

      const hasCycle = (task) => {
        if (!dependencyGraph.has(task)) return false;
        if (recursionStack.has(task)) return true;
        if (visited.has(task)) return false;

        visited.add(task);
        recursionStack.add(task);

        const dependencies = dependencyGraph.get(task);
        for (const dep of dependencies) {
          if (hasCycle(dep)) return true;
        }

        recursionStack.delete(task);
        return false;
      };

      for (const task of dependencyGraph.keys()) {
        if (hasCycle(task)) {
          validation.isValid = false;
          validation.issues.push('Circular dependency detected');
          break;
        }
      }

      // Check confidence level
      if (decomposition.metadata.confidence < 0.5) {
        validation.isValid = false;
        validation.issues.push('Low confidence in decomposition');
      }

    } catch (error) {
      validation.isValid = false;
      validation.issues.push(`Validation error: ${error.message}`);
    }

    return validation;
  }
}

module.exports = LLMBasedDecomposer; 