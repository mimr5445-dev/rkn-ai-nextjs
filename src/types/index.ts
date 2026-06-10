export type Role = 'user' | 'assistant';
export type AttachmentKind = 'image' | 'file';
export type ReasoningLevel = 'balanced' | 'deep';

export type Attachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: string;
  kind: AttachmentKind;
};

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
  reasoning?: string;
  thinkingMs?: number;
  pending?: boolean;
  error?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export type AgentId = 'general' | 'developer' | 'analyst' | 'creative' | 'teacher';

export type Agent = {
  id: AgentId;
  name: string;
  description: string;
  systemPrompt: string;
};

export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-1.5-pro';

export type ChatRequestMessage = Pick<Message, 'role' | 'content' | 'attachments'>;

export type ChatRequest = {
  messages: ChatRequestMessage[];
  conversationId?: string;
  agentId?: AgentId;
  model?: GeminiModel;
  temperature?: number;
  stream?: boolean;
  thinking?: boolean;
  reasoningLevel?: ReasoningLevel;
};

export type ChatResponse = {
  message: string;
  reasoning?: string;
  model: string;
  usage?: unknown;
};

export type StreamEvent = { t: 'think' | 'text'; c: string };
