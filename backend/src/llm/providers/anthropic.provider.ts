import { Injectable } from "@nestjs/common";
import { MockLlmProvider } from "./mock.provider";
@Injectable()
export class AnthropicProvider extends MockLlmProvider { providerType = "anthropic" as const; }
