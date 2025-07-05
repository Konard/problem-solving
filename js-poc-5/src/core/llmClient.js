import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

dotenv.config();

export class LLMClient {
  constructor(options = {}) {
    this.model = new ChatOpenAI({
      apiKey: options.apiKey || process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: options.baseURL || process.env.OPENAI_API_BASE_URL,
      },
      modelName: options.modelName || process.env.OPENAI_API_MODEL || "llama3.1-8b",
      temperature: options.temperature || parseFloat(process.env.OPENAI_API_TEMPERATURE) || 0,
    });
    
    this.parser = new StringOutputParser();
  }

  async chat(messages, options = {}) {
    try {
      const formattedMessages = messages.map(msg => {
        if (msg.role === "system") {
          return new SystemMessage(msg.content);
        } else if (msg.role === "user") {
          return new HumanMessage(msg.content);
        }
        return new HumanMessage(msg.content);
      });

      const response = await this.model.invoke(formattedMessages);
      return await this.parser.invoke(response);
    } catch (error) {
      console.error("LLM Client Error:", error);
      throw new Error(`LLM request failed: ${error.message}`);
    }
  }

  async generateDecomposition(taskDescription) {
    const messages = [
      {
        role: "system",
        content: `You are an expert software architect and project manager. Your task is to decompose complex software tasks into smaller, manageable subtasks.

For each subtask, provide:
1. A clear, concise title
2. A detailed description
3. Clear acceptance criteria
4. Any dependencies on other subtasks

Format your response as a JSON array of objects with the following structure:
{
  "subtasks": [
    {
      "title": "Clear title for the subtask",
      "description": "Detailed description of what needs to be done",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2", "..."],
      "dependencies": ["subtask-1", "subtask-2"] // empty array if no dependencies
    }
  ]
}

Keep subtasks focused, testable, and independent where possible.`
      },
      {
        role: "user",
        content: `Please decompose the following task into subtasks: ${taskDescription}`
      }
    ];

    const response = await this.chat(messages);
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", response);
      throw new Error("Invalid JSON response from LLM");
    }
  }

  async generateTest(subtaskTitle, subtaskDescription, acceptanceCriteria) {
    const messages = [
      {
        role: "system",
        content: `You are an expert test-driven development (TDD) specialist. Your task is to generate failing tests that clearly define what "done" looks like for a given subtask.

Generate a complete test file that:
1. Uses a modern JavaScript testing framework (Jest)
2. Creates failing tests that represent the acceptance criteria
3. Includes clear test descriptions and expectations
4. Has proper imports and setup
5. Uses descriptive test names that explain what is being tested

Format your response as a complete test file with proper JavaScript syntax.`
      },
      {
        role: "user",
        content: `Generate a failing test for the following subtask:

Title: ${subtaskTitle}
Description: ${subtaskDescription}
Acceptance Criteria: ${acceptanceCriteria.join(", ")}

The test should fail initially and pass once the implementation is complete.`
      }
    ];

    return await this.chat(messages);
  }

  async generateSolution(subtaskTitle, subtaskDescription, testCode, attemptNumber = 1) {
    const messages = [
      {
        role: "system",
        content: `You are an expert software developer. Your task is to generate clean, efficient code that will make the given failing tests pass.

Guidelines:
1. Write clean, readable, and maintainable code
2. Follow JavaScript best practices and ES6+ features
3. Include proper error handling
4. Add necessary imports and dependencies
5. Make the code production-ready
6. Focus on making the tests pass without over-engineering

Generate a complete implementation file with proper JavaScript syntax.`
      },
      {
        role: "user",
        content: `Generate a solution for the following subtask (attempt ${attemptNumber}):

Title: ${subtaskTitle}
Description: ${subtaskDescription}

Here is the test code that needs to pass:
\`\`\`javascript
${testCode}
\`\`\`

Please provide a complete implementation that will make these tests pass.`
      }
    ];

    return await this.chat(messages);
  }

  async composeSolutions(mainTaskDescription, subtaskSolutions) {
    const messages = [
      {
        role: "system",
        content: `You are an expert software architect. Your task is to compose multiple partial solutions into a single, cohesive solution that addresses the main task.

Guidelines:
1. Integrate all partial solutions harmoniously
2. Resolve any conflicts between solutions
3. Ensure the final solution is complete and production-ready
4. Add necessary glue code to connect different parts
5. Include proper error handling and validation
6. Optimize for maintainability and performance

Generate a complete, integrated solution with proper JavaScript syntax.`
      },
      {
        role: "user",
        content: `Compose the following partial solutions into a complete solution for: ${mainTaskDescription}

Partial Solutions:
${subtaskSolutions.map((sol, index) => `
Solution ${index + 1}:
Title: ${sol.title}
Code: 
\`\`\`javascript
${sol.code}
\`\`\`
`).join("\n")}

Please provide a complete, integrated solution that combines all these parts.`
      }
    ];

    return await this.chat(messages);
  }
} 