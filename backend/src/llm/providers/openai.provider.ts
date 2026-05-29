import { Injectable } from "@nestjs/common";
import { MockLlmProvider } from "./mock.provider";
@Injectable()
export class OpenAiProvider extends MockLlmProvider { providerType = "openai" as const; }
