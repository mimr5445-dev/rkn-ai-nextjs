import { getAgent } from '@/lib/agents';
import type { AgentId, ChatRequestMessage, GeminiModel } from '@/types';

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';
export const DEFAULT_MODEL: GeminiModel = 'gemini-2.5-flash';

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: unknown;
};

type GeminiError = { error?: { code?: number; message?: string; status?: string } };

function requireApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing. Add it to .env.local or Vercel Environment Variables.');
  }
  if (/^(Bearer\s+|ya29\.|ghp_|github_pat_|\{)/i.test(apiKey)) {
    throw new Error('GEMINI_API_KEY must be a Google AI Studio key, not an OAuth/GitHub token or service-account JSON.');
  }
  return apiKey;
}

function modelPath(model: string) {
  return model.startsWith('models/') ? model : `models/${model}`;
}

function endpointUrl(model: string, method: 'generateContent' | 'streamGenerateContent', apiKey: string, sse = false) {
  const url = new URL(`${API_ROOT}/${modelPath(model)}:${method}`);
  url.searchParams.set('key', apiKey);
  if (sse) url.searchParams.set('alt', 'sse');
  return url.toString();
}

function toContents(messages: ChatRequestMessage[]): GeminiContent[] {
  return messages
    .filter((m) => m.content.trim() || (m.attachments?.length ?? 0) > 0)
    .map((m) => {
      const parts: GeminiPart[] = [];
      const text = m.content.trim();
      if (text) parts.push({ text });
      for (const attachment of m.attachments ?? []) {
        if (!attachment.data || !attachment.mimeType) continue;
        parts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
      }
      return { role: m.role === 'assistant' ? 'model' : 'user', parts } as GeminiContent;
    });
}

function buildBody(messages: ChatRequestMessage[], agentId: AgentId | undefined, temperature: number) {
  const agent = getAgent(agentId);
  const contents = toContents(messages);
  if (contents.length === 0) throw new Error('No valid user message or attachment was provided.');
  return {
    systemInstruction: { parts: [{ text: agent.systemPrompt }] },
    contents,
    generationConfig: { temperature, topP: 0.95, topK: 40, maxOutputTokens: 8192 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]
  };
}

function summarizeError(status: number, payload: GeminiError | string) {
  if (typeof payload === 'string') return `Gemini HTTP ${status}: ${payload}`;
  const message = payload.error?.message ?? `Gemini HTTP ${status}.`;
  const reason = payload.error?.status ? ` (${payload.error.status})` : '';
  return `${message}${reason}`;
}

export type GenerateArgs = {
  messages: ChatRequestMessage[];
  agentId?: AgentId;
  model?: GeminiModel;
  temperature?: number;
};

export async function generateChatResponse({ messages, agentId, model = DEFAULT_MODEL, temperature = 0.7 }: GenerateArgs) {
  const apiKey = requireApiKey();
  const response = await fetch(endpointUrl(model, 'generateContent', apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(messages, agentId, temperature)),
    cache: 'no-store'
  });

  const raw = await response.text();
  let data: GeminiResponse & GeminiError;
  try {
    data = raw ? (JSON.parse(raw) as GeminiResponse & GeminiError) : {};
  } catch {
    data = { error: { message: raw } };
  }
  if (!response.ok) throw new Error(summarizeError(response.status, data));

  const message = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  if (!message) {
    const blocked = data.promptFeedback?.blockReason;
    throw new Error(blocked ? `Gemini blocked the response: ${blocked}` : 'Gemini returned an empty response.');
  }
  return { message, model, usage: data.usageMetadata ?? null };
}

export async function createChatStream({ messages, agentId, model = DEFAULT_MODEL, temperature = 0.7 }: GenerateArgs) {
  const apiKey = requireApiKey();
  const response = await fetch(endpointUrl(model, 'streamGenerateContent', apiKey, true), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(messages, agentId, temperature)),
    cache: 'no-store'
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    let payload: GeminiError | string = errorText;
    try {
      payload = JSON.parse(errorText) as GeminiError;
    } catch {
      // Keep plain text.
    }
    throw new Error(summarizeError(response.status, payload));
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = response.body.getReader();
  let buffer = '';

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const json = trimmed.slice(5).trim();
        if (!json || json === '[DONE]') continue;
        try {
          const parsed = JSON.parse(json) as GeminiResponse;
          const text = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          // Ignore malformed SSE chunks.
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => undefined);
    }
  });
}
