import { ChatOpenAI } from "@langchain/openai";

class LlmClient {
    constructor() {
        this.client = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_API_BASE_URL,
            model: process.env.OPENAI_API_MODEL,
            temperature: process.env.OPENAI_API_TEMPERATURE,
        });
    }

    async call(prompt, ...rest) {
        // Placeholder for future LLM calls
        console.log(`[LlmClient] Calling LLM with prompt: ${prompt}`);
        // In a real scenario, you would format the prompt and call the LLM
        // For now, we'll return a mock response.
        return {
            success: true,
            data: "This is a mock response from the LLM.",
        };
    }
}

export default new LlmClient(); 