import { Injectable } from "@nestjs/common";
import { MockLlmProvider } from "./mock.provider";
@Injectable()
export class GeminiProvider extends MockLlmProvider { providerType = "gemini" as const; }
