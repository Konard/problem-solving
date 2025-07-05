import { OpenAI } from "langchain/llms/openai";

export class LLMClient {
  constructor() {
    this.model = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: process.env.OPENAI_API_BASE_URL
      },
      model: process.env.OPENAI_API_MODEL,
      temperature: parseFloat(process.env.OPENAI_API_TEMPERATURE)
    });
  }

  async decomposeTask(taskDescription) {
    const prompt = `Decompose this task into GitHub-style subissues: "${taskDescription}"`;
    const response = await this.model.call(prompt);
    return JSON.parse(response);
  }

  async generateTest(taskDescription) {
    const prompt = `Generate Jest test code for: "${taskDescription}"`;
    return this.model.call(prompt);
  }

  async generateSolution(taskDescription, testCode) {
    const prompt = `Write code that passes this test:\n\n${testCode}\n\nTask: ${taskDescription}`;
    return this.model.call(prompt);
  }

  async composeSolutions(subtaskSolutions) {
    const prompt = `Combine these solutions into one coherent implementation:\n\n${subtaskSolutions.join("\n\n")}`;
    return this.model.call(prompt);
  }
} 