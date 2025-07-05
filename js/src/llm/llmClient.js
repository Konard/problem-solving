import { OpenAI } from '@langchain/openai';
import chalk from 'chalk';

export class LLMClient {
  constructor() {
    this.model = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: process.env.OPENAI_API_BASE_URL
      },
      model: process.env.OPENAI_API_MODEL || 'gpt-4',
      temperature: parseFloat(process.env.OPENAI_API_TEMPERATURE || '0.1'),
      maxTokens: 4000
    });
  }

  async decomposeTask(taskDescription) {
    const prompt = `Decompose this task into 3-5 specific, actionable GitHub-style subissues. 
    Each subtask should be focused and implementable. Return only a JSON array of strings.
    
    Task: "${taskDescription}"
    
    Example format: ["Implement user registration endpoint", "Add password validation", "Create login API"]
    
    Subtasks:`;
    
    try {
      const response = await this.model.call(prompt);
      const parsed = JSON.parse(response.trim());
      return Array.isArray(parsed) ? parsed : [response];
    } catch (error) {
      console.error(chalk.red('  ❌ Error parsing LLM response:'), error.message);
      throw error;
    }
  }

  async generateTest(taskDescription) {
    const prompt = `Generate comprehensive Jest test code for this task. 
    Include multiple test cases, edge cases, and proper assertions.
    Return only the test code, no explanations.
    
    Task: "${taskDescription}"
    
    Test code:`;
    
    try {
      return await this.model.call(prompt);
    } catch (error) {
      console.error(chalk.red('  ❌ Error generating test:'), error.message);
      throw error;
    }
  }

  async generateSolution(taskDescription, testCode) {
    const prompt = `Write production-ready code that passes this test. 
    The code should be clean, well-documented, and follow best practices.
    Return only the implementation code, no explanations.
    
    Task: "${taskDescription}"
    
    Test code:
    ${testCode}
    
    Implementation:`;
    
    try {
      return await this.model.call(prompt);
    } catch (error) {
      console.error(chalk.red('  ❌ Error generating solution:'), error.message);
      throw error;
    }
  }

  async composeSolutions(subtaskSolutions) {
    const prompt = `Combine these individual solutions into one coherent, production-ready implementation.
    Ensure the final code is well-structured, follows best practices, and integrates all components properly.
    Return only the final implementation code, no explanations.
    
    Individual solutions:
    ${subtaskSolutions.join('\n\n---\n\n')}
    
    Combined implementation:`;
    
    try {
      return await this.model.call(prompt);
    } catch (error) {
      console.error(chalk.red('  ❌ Error composing solutions:'), error.message);
      throw error;
    }
  }
} 