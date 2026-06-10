import { getAgent } from '@/lib/agents';
import type { AgentId, ChatRequestMessage, GeminiModel, ReasoningLevel, StreamEvent } from '@/types';

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';
export const DEFAULT_MODEL: GeminiModel = 'gemini-2.5-flash';

type GeminiRequestPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiRequestPart[] };
type GeminiResponsePart = { text?: string; thought?: boolean };

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiResponsePart[] }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: unknown;
};

type GeminiError = { error?: { code?: number; message?: string; status?: string } };

type BodyOptions = {
  thinking: boolean;
  reasoningLevel: ReasoningLevel;
  model: GeminiModel;
};

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

export function supportsThinking(model: string) {
  const cleanModel = model.startsWith('models/') ? model.slice('models/'.length) : model;
  return cleanModel.startsWith('gemini-2.5');
}

export function thinkingBudgetFor(model: string, level: ReasoningLevel) {
  if (level === 'balanced') return -1;
  return model.includes('pro') ? 16000 : 12000;
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
    .filter((message) => message.content.trim() || (message.attachments?.length ?? 0) > 0)
    .map((message) => {
      const parts: GeminiRequestPart[] = [];
      const text = message.content.trim();
      if (text) parts.push({ text });
      for (const attachment of message.attachments ?? []) {
        if (!attachment.data || !attachment.mimeType) continue;
        parts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
      }
      return { role: message.role === 'assistant' ? 'model' : 'user', parts } as GeminiContent;
    });
}

function buildBody(messages: ChatRequestMessage[], agentId: AgentId | undefined, temperature: number, options: BodyOptions) {
  const agent = getAgent(agentId);
  const contents = toContents(messages);
  if (contents.length === 0) throw new Error('No valid user message or attachment was provided.');

  const generationConfig: {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
    thinkingConfig?: { includeThoughts: boolean; thinkingBudget: number };
  } = {
    temperature,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192
  };

  if (options.thinking && supportsThinking(options.model)) {
    generationConfig.thinkingConfig = {
      includeThoughts: true,
      thinkingBudget: thinkingBudgetFor(options.model, options.reasoningLevel)
    };
  }

  return {
    systemInstruction: { parts: [{ text: agent.systemPrompt }] },
    contents,
    generationConfig,
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

function splitResponseParts(data: GeminiResponse) {
  let message = '';
  let reasoning = '';

  for (const part of data.candidates?.[0]?.content?.parts ?? []) {
    const text = part.text ?? '';
    if (!text) continue;
    if (part.thought) reasoning += text;
    else message += text;
  }

  return { message: message.trim(), reasoning: reasoning.trim() };
}

function encodeEvent(event: StreamEvent) {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export type GenerateArgs = {
  messages: ChatRequestMessage[];
  agentId?: AgentId;
  model?: GeminiModel;
  temperature?: number;
  thinking?: boolean;
  reasoningLevel?: ReasoningLevel;
};

export async function generateChatResponse({
  messages,
  agentId,
  model = DEFAULT_MODEL,
  temperature = 0.7,
  thinking = true,
  reasoningLevel = 'balanced'
}: GenerateArgs) {
  const apiKey = requireApiKey();
  const response = await fetch(endpointUrl(model, 'generateContent', apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(messages, agentId, temperature, { model, thinking, reasoningLevel })),
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

  const { message, reasoning } = splitResponseParts(data);
  if (!message) {
    const blocked = data.promptFeedback?.blockReason;
    throw new Error(blocked ? `Gemini blocked the response: ${blocked}` : 'Gemini returned an empty response.');
  }
  return { message, reasoning: reasoning || undefined, model, usage: data.usageMetadata ?? null };
}

export async function createChatStream({
  messages,
  agentId,
  model = DEFAULT_MODEL,
  temperature = 0.7,
  thinking = true,
  reasoningLevel = 'balanced'
}: GenerateArgs) {
  const apiKey = requireApiKey();
  const response = await fetch(endpointUrl(model, 'streamGenerateContent', apiKey, true), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody(messages, agentId, temperature, { model, thinking, reasoningLevel })),
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
          for (const part of parsed.candidates?.[0]?.content?.parts ?? []) {
            const text = part.text ?? '';
            if (!text) continue;
            controller.enqueue(encodeEvent({ t: part.thought ? 'think' : 'text', c: text }));
          }
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
