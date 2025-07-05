import { ChatOpenAI } from "langchain/chat_models/openai";
import dotenv from "dotenv";

dotenv.config();

export function getChat() {
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_API_BASE_URL,
    },
    modelName: process.env.OPENAI_API_MODEL,
    temperature: Number(process.env.OPENAI_API_TEMPERATURE || "0"),
  });
} 