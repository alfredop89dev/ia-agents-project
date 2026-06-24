export type FileAttachment = {
  name: string;
  url: string;
  type: string;
  size: number;
  extractedText?: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: FileAttachment[];
  createdAt?: Date;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  tokensUsed: number;
  maxTokens: number;
  maxCompletionTokens: number;
  systemPrompt: string;
  createdAt: Date;
};

export type FreeModel = {
  id: string;
  name: string;
  contextLength: number;
  supportsVision: boolean;
};

export type MsgData = {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  files?: FileAttachment[];
};

export type ConvData = {
  _id: string;
  title: string;
  messages: MsgData[];
  model: string;
  tokensUsed: number;
  maxTokens: number;
  maxCompletionTokens?: number;
  systemPrompt?: string;
};

export function toConversation(d: ConvData): Conversation {
  return {
    id: d._id ?? crypto.randomUUID(),
    title: d.title ?? "Chat nuevo",
    messages: (d.messages ?? []).map((m) => ({
      id: m._id ?? crypto.randomUUID(),
      role: m.role ?? "user",
      content: m.content ?? "",
      files: m.files ?? [],
    })),
    model: d.model ?? "",
    tokensUsed: d.tokensUsed ?? 0,
    maxTokens: d.maxTokens ?? 8192,
    maxCompletionTokens: d.maxCompletionTokens ?? 2048,
    systemPrompt: d.systemPrompt ?? "",
    createdAt: new Date(),
  };
}

export const FREE_DAILY_LIMIT = 200;
