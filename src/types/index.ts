export type Role = 'user' | 'assistant';
export type AttachmentKind = 'image' | 'file';

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
};

export type ChatResponse = {
  message: string;
  model: string;
  usage?: unknown;
};
