import { ChatOpenAI } from "langchain/chat_models/openai";
import dotenv from "dotenv";

dotenv.config();

const chat = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
  modelName: process.env.OPENAI_API_MODEL,
  temperature: Number(process.env.OPENAI_API_TEMPERATURE ?? 0),
});

/**
 * Send a prompt to the LLM and retrieve the textual response.
 * @param {string} prompt
 * @param {string} [systemPrompt]
 * @returns {Promise<string>}
 */
export async function askLLM(prompt, systemPrompt = "You are a helpful AI assistant.") {
  const res = await chat.call([
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ]);
  return res.content;
}

export default { askLLM }; 