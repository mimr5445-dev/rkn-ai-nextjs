import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { getAgent } from '@/lib/agents';
import type { AgentId, Message } from '@/types';

const MODEL = 'gemini-2.0-flash';

function requireApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing. Add it to .env.local or Vercel Environment Variables.');
  }
  return apiKey;
}

function toGeminiHistory(messages: Pick<Message, 'role' | 'content'>[]) {
  return messages
    .filter((message) => message.role !== 'system' && message.content.trim())
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));
}

export async function generateChatResponse({
  messages,
  agentId,
  temperature = 0.7
}: {
  messages: Pick<Message, 'role' | 'content'>[];
  agentId?: AgentId;
  temperature?: number;
}) {
  const apiKey = requireApiKey();
  const agent = getAgent(agentId);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: agent.systemPrompt,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
    ],
    generationConfig: {
      temperature,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192
    }
  });

  const history = toGeminiHistory(messages.slice(0, -1));
  const lastMessage = messages[messages.length - 1]?.content ?? '';

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage);
  const response = result.response;

  return {
    message: response.text(),
    model: MODEL,
    usage: response.usageMetadata ?? null
  };
}
