import { Injectable } from "@nestjs/common";
import { MockLlmProvider } from "./mock.provider";
@Injectable()
export class OllamaProvider extends MockLlmProvider { providerType = "ollama" as const; }
