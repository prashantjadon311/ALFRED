import { create } from "zustand";
import { chatFolders as mockFolders, chats as mockChats } from "@/lib/mock-data";
import { chatService } from "@/services/chat-service";
import { isApiMode } from "@/lib/api-client";
import type { Chat, ChatFolder, Message } from "@/lib/types";

const now = () => new Date().toISOString();

interface ChatStore {
  chats: Chat[];
  folders: ChatFolder[];
  activeChatId: string;
  loaded: boolean;
  messagesLoadedByChatId: Record<string, boolean>;
  messagesLoadingByChatId: Record<string, boolean>;
  loadFromApi: () => Promise<void>;
  loadMessagesForChat: (chatId: string) => Promise<void>;
  createChat: (title?: string, folderId?: string) => string;
  createFolder: (name: string, projectId?: string) => string;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  moveChatToFolder: (chatId: string, folderId?: string) => void;
  branchChat: (chatId: string, messageId?: string) => string;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, title: string) => void;
  appendMessage: (chatId: string, message: Omit<Message, "id" | "createdAt">) => void;
  setActiveChatId: (chatId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: mockChats,
  folders: mockFolders,
  activeChatId: mockChats[0]?.id ?? "",
  loaded: false,
  messagesLoadedByChatId: {},
  messagesLoadingByChatId: {},
  loadFromApi: async () => {
    if (!isApiMode() || get().loaded) return;
    const chats = await chatService.listChats();
    set((state) => {
      const currentById = new Map(state.chats.map((chat) => [chat.id, chat]));
      const nextChats = chats.map((chat) => ({ ...chat, messages: currentById.get(chat.id)?.messages ?? chat.messages ?? [] }));
      return {
        chats: nextChats,
        activeChatId: nextChats.some((chat) => chat.id === state.activeChatId) ? state.activeChatId : nextChats[0]?.id ?? "",
        loaded: true
      };
    });
  },
  loadMessagesForChat: async (chatId: string) => {
    if (!isApiMode() || !chatId || get().messagesLoadedByChatId[chatId] || get().messagesLoadingByChatId[chatId]) return;
    set((state) => ({ messagesLoadingByChatId: { ...state.messagesLoadingByChatId, [chatId]: true } }));
    try {
      const messages = await chatService.getMessages(chatId);
      set((state) => ({
        chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, messages } : chat)),
        messagesLoadedByChatId: { ...state.messagesLoadedByChatId, [chatId]: true },
        messagesLoadingByChatId: { ...state.messagesLoadingByChatId, [chatId]: false }
      }));
    } catch {
      set((state) => ({ messagesLoadingByChatId: { ...state.messagesLoadingByChatId, [chatId]: false } }));
    }
  },
  createChat: (title = "Untitled agent session", folderId) => {
    const id = `chat-${Date.now()}`;
    const timestamp = now();
    const chat: Chat = {
      id,
      title,
      projectId: "alfred-platform",
      folderId,
      model: "GPT-5",
      messages: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    set((state) => ({ chats: [chat, ...state.chats], activeChatId: id }));
    if (isApiMode()) {
      void chatService.createChat({ title, projectId: chat.projectId }).then((created) => {
        set((state) => ({
          chats: state.chats.map((item) => item.id === id ? { ...created, messages: [] } : item),
          activeChatId: state.activeChatId === id ? created.id : state.activeChatId,
          messagesLoadedByChatId: { ...state.messagesLoadedByChatId, [created.id]: true },
          messagesLoadingByChatId: { ...state.messagesLoadingByChatId, [created.id]: false }
        }));
      }).catch(() => undefined);
    }
    return id;
  },
  createFolder: (name, projectId = "alfred-platform") => {
    const id = `folder-${Date.now()}`;
    const timestamp = now();
    const folder: ChatFolder = {
      id,
      name: name.trim() || "Untitled folder",
      projectId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    set((state) => ({ folders: [folder, ...state.folders] }));
    return id;
  },
  renameFolder: (folderId, name) =>
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === folderId ? { ...folder, name: name.trim() || folder.name, updatedAt: now() } : folder
      )
    })),
  deleteFolder: (folderId) =>
    set((state) => ({
      folders: state.folders.filter((folder) => folder.id !== folderId),
      chats: state.chats.map((chat) => (chat.folderId === folderId ? { ...chat, folderId: undefined, updatedAt: now() } : chat))
    })),
  moveChatToFolder: (chatId, folderId) =>
    set((state) => ({
      chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, folderId, updatedAt: now() } : chat))
    })),
  branchChat: (chatId, messageId) => {
    const source = get().chats.find((chat) => chat.id === chatId);
    const id = `chat-${Date.now()}`;
    const timestamp = now();
    const messages = source?.messages ?? [];
    const cutoff = messageId ? messages.findIndex((message) => message.id === messageId) + 1 : messages.length;
    const branched: Chat = {
      id,
      title: `${source?.title ?? "Session"} branch`,
      projectId: source?.projectId ?? "alfred-platform",
      folderId: source?.folderId,
      model: source?.model ?? "GPT-5",
      messages: messages.slice(0, cutoff > 0 ? cutoff : messages.length),
      parentId: chatId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    set((state) => ({ chats: [branched, ...state.chats], activeChatId: id }));
    return id;
  },
  deleteChat: (chatId) =>
    set((state) => {
      const chats = state.chats.filter((chat) => chat.id !== chatId);
      return { chats, activeChatId: state.activeChatId === chatId ? chats[0]?.id ?? "" : state.activeChatId };
    }),
  renameChat: (chatId, title) =>
    set((state) => ({
      chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, title, updatedAt: now() } : chat))
    })),
  appendMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, { ...message, id: `msg-${Date.now()}`, createdAt: now() }],
              updatedAt: now()
            }
          : chat
      )
    })),
  setActiveChatId: (chatId) => set({ activeChatId: chatId })
}));
