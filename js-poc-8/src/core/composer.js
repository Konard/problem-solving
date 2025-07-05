import { LLMClient } from "../llm/llmClient.js";

export class Composer {
  constructor() {
    this.llmClient = new LLMClient();
  }

  async compose(solutions) {
    return this.llmClient.composeSolutions(solutions);
  }
} 