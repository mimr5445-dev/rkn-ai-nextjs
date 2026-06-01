export type Role = 'user' | 'assistant' | 'system';

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  pending?: boolean;
  error?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
};

export type AgentId = 'general' | 'developer' | 'analyst' | 'creative' | 'teacher';

export type Agent = {
  id: AgentId;
  name: string;
  description: string;
  systemPrompt: string;
  tone: string;
};

export type DeviceMetrics = {
  innerWidth: number;
  innerHeight: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  isMobile: boolean;
};

export type ChatRequest = {
  messages: Pick<Message, 'role' | 'content'>[];
  conversationId?: string;
  agentId?: AgentId;
  temperature?: number;
  stream?: boolean;
};

export type ChatResponse = {
  message: string;
  model: string;
  usage?: unknown;
};
