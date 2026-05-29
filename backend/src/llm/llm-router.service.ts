import { Injectable } from "@nestjs/common";
import { ChatInput } from "./interfaces/llm.types";
import { MockLlmProvider } from "./providers/mock.provider";

@Injectable()
export class LlmRouterService {
  constructor(private readonly mock: MockLlmProvider) {}
  selectProvider(_providerType?: string) {
    return this.mock;
  }
  chat(input: ChatInput) {
    return this.selectProvider(input.providerType).chat(input);
  }
  estimateTokens(input: string) {
    return this.mock.estimateTokens(input);
  }
}
