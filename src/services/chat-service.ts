import { chats as mockChats, compareResponses } from "@/lib/mock-data";
import { api, isApiMode } from "@/lib/api-client";
import type { Chat, Message } from "@/lib/types";

const now = () => new Date().toISOString();
const wait = () => new Promise((resolve) => setTimeout(resolve, 140));

function mockAssistantMessage(content: string, model = "Mock GPT-5"): Message {
  const tokens = Math.max(280, Math.ceil(content.length / 3) + 940);
  return {
    id: `msg-assistant-${Date.now()}`,
    role: "assistant",
    content:
      `A.L.F.R.E.D. mock response:\n\n${content}\n\n` +
      "The next backend-ready step is to keep the requirement contract locked, run the designer and architect agents, then let Claude Critic audit the output before artifact export.",
    model,
    tokens,
    cost: Number((tokens * 0.000018).toFixed(4)),
    latency: 1.8,
    createdAt: now()
  };
}

function normalizeMessage(message: any): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content ?? "",
    model: message.modelName ?? message.model ?? "Mock GPT-5",
    tokens: message.inputTokens || message.outputTokens ? (message.inputTokens ?? 0) + (message.outputTokens ?? 0) : message.tokens ?? 0,
    cost: message.costUsd ?? message.cost ?? 0,
    latency: message.latencyMs ? message.latencyMs / 1000 : message.latency ?? 0,
    createdAt: message.createdAt
  };
}

function normalizeChat(chat: any, messages: Message[] = []): Chat {
  return {
    id: chat.id,
    title: chat.title ?? "New Chat",
    projectId: chat.projectId ?? "alfred-platform",
    folderId: chat.folderId,
    model: chat.modelName ?? chat.activeModelId ?? "Mock GPT-5",
    messages,
    parentId: chat.parentChatId,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt
  };
}

export const chatService = {
  listChats: async (): Promise<Chat[]> => {
    if (isApiMode()) return (await api.get<any[]>("/chats")).map((chat) => normalizeChat(chat));
    await wait();
    return mockChats;
  },

  getChat: async (id: string): Promise<Chat> => {
    if (isApiMode()) return normalizeChat(await api.get<any>(`/chats/${id}`), await chatService.getMessages(id));
    await wait();
    return mockChats.find((chat) => chat.id === id) ?? mockChats[0];
  },

  createChat: async (body: { title?: string; projectId?: string }): Promise<Chat> => {
    if (isApiMode()) return normalizeChat(await api.post<any>("/chats", body));
    await wait();
    const timestamp = now();
    return {
      id: `chat-${Date.now()}`,
      title: body.title ?? "Untitled agent session",
      projectId: body.projectId ?? "alfred-platform",
      model: "Mock GPT-5",
      messages: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
  },

  getMessages: async (chatId: string): Promise<Message[]> => {
    if (isApiMode()) return (await api.get<any[]>(`/chats/${chatId}/messages`)).map(normalizeMessage);
    await wait();
    return mockChats.find((chat) => chat.id === chatId)?.messages ?? [];
  },

  sendMessage: async (chatId: string, content: string, _providerType = "mock") => {
    if (isApiMode()) {
      const result = await api.post<any>(`/chats/${chatId}/messages`, { content, providerType: _providerType });
      return { user: normalizeMessage(result.userMessage), assistant: normalizeMessage(result.assistantMessage) };
    }
    await wait();
    const chat = mockChats.find((item) => item.id === chatId);
    const user: Message = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content,
      model: chat?.model ?? "Mock GPT-5",
      tokens: Math.max(24, Math.ceil(content.length / 4)),
      cost: 0,
      latency: 0,
      createdAt: now()
    };
    return { user, assistant: mockAssistantMessage(content, chat?.model ?? "Mock GPT-5") };
  },

  branchChat: async (chatId: string, fromMessageId?: string): Promise<Chat> => {
    if (isApiMode()) return normalizeChat(await api.post<any>(`/chats/${chatId}/branch`, { fromMessageId: fromMessageId ?? "latest" }));
    await wait();
    const source = mockChats.find((chat) => chat.id === chatId) ?? mockChats[0];
    const cutoff = fromMessageId ? source.messages.findIndex((message) => message.id === fromMessageId) + 1 : source.messages.length;
    const timestamp = now();
    return {
      ...source,
      id: `chat-branch-${Date.now()}`,
      title: `${source.title} branch`,
      parentId: source.id,
      messages: source.messages.slice(0, cutoff > 0 ? cutoff : source.messages.length),
      createdAt: timestamp,
      updatedAt: timestamp
    };
  },

  llmChat: async (prompt: string, options: { providerType?: string; modelName?: string; systemPrompt?: string } = {}) => {
    if (isApiMode()) return api.post("/llm/chat", { prompt, ...options });
    await wait();
    const message = mockAssistantMessage(prompt, options.modelName ?? "Mock GPT-5");
    return {
      content: message.content,
      inputTokens: Math.max(24, Math.ceil(`${options.systemPrompt ?? ""}${prompt}`.length / 4)),
      outputTokens: message.tokens,
      costUsd: message.cost,
      latencyMs: message.latency * 1000
    };
  },

  llmCompare: async (_prompt: string, models: Array<{ providerType: string; modelName?: string }>) => {
    if (isApiMode()) return api.post("/llm/compare", { prompt: _prompt, models });
    await wait();
    return models.map((model, index) => ({
      ...compareResponses[index % compareResponses.length],
      model: model.modelName ?? compareResponses[index % compareResponses.length].model,
      provider: model.providerType
    }));
  }
};
