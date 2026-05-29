import { Injectable } from "@nestjs/common";
import { MockLlmProvider } from "./mock.provider";
@Injectable()
export class CustomOpenAiCompatibleProvider extends MockLlmProvider { providerType = "custom_openai_compatible" as const; }
