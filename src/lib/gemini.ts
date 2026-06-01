import { getAgent } from '@/lib/agents';
import type { AgentId, Message } from '@/types';

const MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const GEMINI_STREAM_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent`;

type GeminiPart = { text: string };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  usageMetadata?: unknown;
};

type GeminiErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown[];
  };
};

function requireApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing. Add it to .env.local or Vercel Environment Variables.');
  }

  // Google AI Studio / Gemini Developer API keys are standard Google API keys.
  // OAuth access tokens, GitHub tokens, service-account JSON, or values prefixed with "Bearer"
  // cause ACCESS_TOKEN_TYPE_UNSUPPORTED / 401 errors on the Gemini Developer endpoint.
  if (/^(Bearer\s+|ya29\.|ghp_|github_pat_|\{)/i.test(apiKey)) {
    throw new Error(
      'GEMINI_API_KEY must be a Google AI Studio Gemini API key, not an OAuth token, GitHub token, or service-account JSON.'
    );
  }

  return apiKey;
}

function toGeminiContents(messages: Pick<Message, 'role' | 'content'>[]): GeminiContent[] {
  return messages
    .filter((message) => message.role !== 'system' && message.content.trim())
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));
}

function buildRequestBody({
  messages,
  agentId,
  temperature
}: {
  messages: Pick<Message, 'role' | 'content'>[];
  agentId?: AgentId;
  temperature: number;
}) {
  const agent = getAgent(agentId);
  const contents = toGeminiContents(messages);

  if (contents.length === 0) {
    throw new Error('No valid user message was provided.');
  }

  return {
    systemInstruction: {
      parts: [{ text: agent.systemPrompt }]
    },
    contents,
    generationConfig: {
      temperature,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]
  };
}

function buildGeminiUrl(endpoint: string, apiKey: string) {
  const url = new URL(endpoint);
  // Strictly authenticate with a standard Gemini Developer API key.
  // No Authorization/Bearer headers are sent from this app.
  url.searchParams.set('key', apiKey);
  return url.toString();
}

function summarizeGeminiError(status: number, payload: GeminiErrorResponse | string) {
  if (typeof payload === 'string') {
    return `Gemini API request failed with HTTP ${status}: ${payload}`;
  }

  const message = payload.error?.message ?? `Gemini API request failed with HTTP ${status}.`;
  const reason = payload.error?.status ? ` (${payload.error.status})` : '';
  return `${message}${reason}`;
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
  const body = buildRequestBody({ messages, agentId, temperature });

  const response = await fetch(buildGeminiUrl(GEMINI_ENDPOINT, apiKey), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  const rawText = await response.text();
  let data: GeminiGenerateResponse & GeminiErrorResponse;

  try {
    data = rawText ? (JSON.parse(rawText) as GeminiGenerateResponse & GeminiErrorResponse) : {};
  } catch {
    data = { error: { message: rawText } };
  }

  if (!response.ok) {
    throw new Error(summarizeGeminiError(response.status, data));
  }

  const message = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n').trim();

  if (!message) {
    const blockReason = data.promptFeedback?.blockReason;
    throw new Error(blockReason ? `Gemini blocked the response: ${blockReason}` : 'Gemini returned an empty response.');
  }

  return {
    message,
    model: MODEL,
    usage: data.usageMetadata ?? null
  };
}

export async function createGeminiStream({
  messages,
  agentId,
  temperature = 0.7
}: {
  messages: Pick<Message, 'role' | 'content'>[];
  agentId?: AgentId;
  temperature?: number;
}) {
  const apiKey = requireApiKey();
  const body = buildRequestBody({ messages, agentId, temperature });
  const url = new URL(buildGeminiUrl(GEMINI_STREAM_ENDPOINT, apiKey));
  url.searchParams.set('alt', 'sse');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorText = await response.text();
    let payload: GeminiErrorResponse | string = errorText;
    try {
      payload = JSON.parse(errorText) as GeminiErrorResponse;
    } catch {
      // Keep plain-text error.
    }
    throw new Error(summarizeGeminiError(response.status, payload));
  }

  if (!response.body) {
    throw new Error('Gemini stream response body is empty.');
  }

  return response.body;
}
