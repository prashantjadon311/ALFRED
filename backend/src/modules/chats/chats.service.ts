import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { ChatsRepository } from "../../repositories/chats.repository";
import { MessagesRepository } from "../../repositories/messages.repository";
import { LlmRouterService } from "../../llm/llm-router.service";
import { UsageService } from "../usage/usage.service";

@Injectable()
export class ChatsService {
  constructor(
    private readonly chats: ChatsRepository,
    private readonly messages: MessagesRepository,
    private readonly llm: LlmRouterService,
    private readonly usage: UsageService
  ) {}

  async list(userId: ObjectId, page: number, limit: number, projectId?: string) {
    const filter: Record<string, unknown> = {};
    if (projectId) filter.projectId = new ObjectId(projectId);
    const result = await this.chats.listByUser(userId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.chats.serializeMany(result.items), total: result.total };
  }

  async create(userId: ObjectId, body: { title?: string; projectId?: string; mode?: string; systemPrompt?: string; settings?: { temperature?: number; topP?: number; maxTokens?: number } }) {
    const doc = await this.chats.create({
      userId,
      projectId: body.projectId ? new ObjectId(body.projectId) : undefined,
      title: body.title ?? "New Chat",
      mode: (body.mode as any) ?? "single",
      systemPrompt: body.systemPrompt,
      settings: { temperature: body.settings?.temperature ?? 0.7, topP: body.settings?.topP ?? 1, maxTokens: body.settings?.maxTokens ?? 4096 },
      tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { totalUsd: 0 },
      createdAt: new Date()
    } as any);
    return this.chats.serialize(doc);
  }

  async get(userId: ObjectId, id: ObjectId) {
    const doc = await this.chats.findById(id, userId);
    if (!doc) throw new NotFoundException("Chat not found");
    return this.chats.serialize(doc);
  }

  async update(userId: ObjectId, id: ObjectId, body: { title?: string; systemPrompt?: string; settings?: Record<string, unknown> }) {
    const doc = await this.chats.updateById(id, userId, body as any);
    if (!doc) throw new NotFoundException("Chat not found");
    return this.chats.serialize(doc);
  }

  async delete(userId: ObjectId, id: ObjectId) {
    const ok = await this.chats.deleteById(id, userId);
    if (!ok) throw new NotFoundException("Chat not found");
    return { deleted: true };
  }

  async listMessages(userId: ObjectId, chatId: ObjectId, page: number, limit: number) {
    const chat = await this.chats.findById(chatId, userId);
    if (!chat) throw new NotFoundException("Chat not found");
    const result = await this.messages.listByChat(chatId, (page - 1) * limit, limit);
    return { items: this.messages.serializeMany(result.items), total: result.total };
  }

  async addMessage(userId: ObjectId, chatId: ObjectId, body: { content: string; role?: string; modelId?: string; providerType?: string; modelName?: string }) {
    const chat = await this.chats.findById(chatId, userId);
    if (!chat) throw new NotFoundException("Chat not found");

    const userMsg = await this.messages.create({
      userId, chatId, projectId: chat.projectId,
      role: "user", content: body.content,
      createdAt: new Date()
    } as any);

    const llmResult = await this.llm.chat({ prompt: body.content, systemPrompt: chat.systemPrompt, providerType: body.providerType ?? "mock", modelName: body.modelName, nodeKey: "chat" });

    const assistantMsg = await this.messages.create({
      userId, chatId, projectId: chat.projectId,
      role: "assistant", content: llmResult.content,
      modelName: llmResult.modelName, providerType: llmResult.providerType,
      inputTokens: llmResult.inputTokens, outputTokens: llmResult.outputTokens,
      costUsd: llmResult.costUsd, latencyMs: llmResult.latencyMs,
      createdAt: new Date()
    } as any);

    await this.usage.record({ userId, projectId: chat.projectId, chatId, providerType: llmResult.providerType, modelName: llmResult.modelName, inputTokens: llmResult.inputTokens, outputTokens: llmResult.outputTokens, costUsd: llmResult.costUsd, latencyMs: llmResult.latencyMs, source: "chat" });

    return { userMessage: this.messages.serialize(userMsg), assistantMessage: this.messages.serialize(assistantMsg) };
  }

  async branch(userId: ObjectId, chatId: ObjectId, fromMessageId: string) {
    const chat = await this.chats.findById(chatId, userId);
    if (!chat) throw new NotFoundException("Chat not found");
    const sourceMessage = fromMessageId === "latest"
      ? await this.messages.collection().find({ userId, chatId }).sort({ createdAt: -1 }).limit(1).next()
      : await this.messages.findById(new ObjectId(fromMessageId));
    if (!sourceMessage || sourceMessage.userId.toString() !== userId.toString() || sourceMessage.chatId.toString() !== chatId.toString()) {
      throw new NotFoundException("Branch source message not found");
    }
    const branched = await this.chats.create({
      userId, projectId: chat.projectId,
      title: `${chat.title} (branch)`,
      parentChatId: chatId, branchFromMessageId: sourceMessage._id,
      mode: chat.mode, systemPrompt: chat.systemPrompt, settings: chat.settings,
      tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { totalUsd: 0 }, createdAt: new Date()
    } as any);
    return this.chats.serialize(branched);
  }

  async regenerate(userId: ObjectId, chatId: ObjectId, body: { messageId: string; providerType?: string; modelName?: string }) {
    const chat = await this.chats.findById(chatId, userId);
    if (!chat) throw new NotFoundException("Chat not found");
    const original = await this.messages.findById(new ObjectId(body.messageId));
    if (!original || original.userId.toString() !== userId.toString() || original.chatId.toString() !== chatId.toString()) throw new ForbiddenException();
    const history = await this.messages.listByChat(chatId, 0, 50);
    const context = history.items.filter((m: any) => m.role === "user").map((m: any) => m.content).join("\n");
    const llmResult = await this.llm.chat({ prompt: context, systemPrompt: chat.systemPrompt, providerType: body.providerType ?? "mock", modelName: body.modelName, nodeKey: "chat" });
    const newMsg = await this.messages.create({
      userId, chatId, projectId: chat.projectId,
      role: "assistant", content: llmResult.content,
      modelName: llmResult.modelName, providerType: llmResult.providerType,
      inputTokens: llmResult.inputTokens, outputTokens: llmResult.outputTokens,
      costUsd: llmResult.costUsd, latencyMs: llmResult.latencyMs,
      parentMessageId: new ObjectId(body.messageId), createdAt: new Date()
    } as any);
    await this.usage.record({ userId, projectId: chat.projectId, chatId, providerType: llmResult.providerType, modelName: llmResult.modelName, inputTokens: llmResult.inputTokens, outputTokens: llmResult.outputTokens, costUsd: llmResult.costUsd, latencyMs: llmResult.latencyMs, source: "chat" });
    return this.messages.serialize(newMsg);
  }

  async exportChat(userId: ObjectId, chatId: ObjectId, format: "markdown" | "json") {
    const chat = await this.chats.findById(chatId, userId);
    if (!chat) throw new NotFoundException("Chat not found");
    const msgs = await this.messages.listByChat(chatId, 0, 1000);
    if (format === "json") return { chat: this.chats.serialize(chat), messages: msgs.items };
    const md = msgs.items.map((m: any) => `**${m.role.toUpperCase()}**\n${m.content}`).join("\n\n---\n\n");
    return { format: "markdown", content: `# ${chat.title}\n\n${md}` };
  }

  async compare(userId: ObjectId, body: { prompt: string; models: Array<{ providerType: string; modelName?: string }>; chatId?: string }) {
    const results = await Promise.all(body.models.map((m) => this.llm.chat({ prompt: body.prompt, providerType: m.providerType, modelName: m.modelName, nodeKey: "compare" })));
    for (const result of results) {
      await this.usage.record({
        userId,
        chatId: body.chatId ? new ObjectId(body.chatId) : undefined,
        providerType: result.providerType,
        modelName: result.modelName,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUsd: result.costUsd,
        latencyMs: result.latencyMs,
        source: "compare"
      });
    }
    return results.map((r, i) => ({ model: body.models[i], content: r.content, inputTokens: r.inputTokens, outputTokens: r.outputTokens, costUsd: r.costUsd, latencyMs: r.latencyMs }));
  }
}
