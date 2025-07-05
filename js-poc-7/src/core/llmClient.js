import { ChatOpenAI } from "@langchain/openai";
import 'dotenv/config';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in the environment variables.");
}

const llmClient = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
  model: process.env.OPENAI_API_MODEL,
  temperature: process.env.OPENAI_API_TEMPERATURE ? parseFloat(process.env.OPENAI_API_TEMPERATURE) : 0,
});

export default llmClient; 