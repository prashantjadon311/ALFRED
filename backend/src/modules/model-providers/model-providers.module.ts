import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { SecurityModule } from "../../security/security.module";
import { AnthropicProvider } from "../../llm/providers/anthropic.provider";
import { CustomOpenAiCompatibleProvider } from "../../llm/providers/custom-openai.provider";
import { GeminiProvider } from "../../llm/providers/gemini.provider";
import { MockLlmProvider } from "../../llm/providers/mock.provider";
import { OllamaProvider } from "../../llm/providers/ollama.provider";
import { OpenAiProvider } from "../../llm/providers/openai.provider";
import { ModelProvidersController } from "./model-providers.controller";
import { ModelProvidersService } from "./model-providers.service";

@Module({
  imports: [RepositoriesModule, SecurityModule],
  controllers: [ModelProvidersController],
  providers: [ModelProvidersService, MockLlmProvider, OpenAiProvider, AnthropicProvider, GeminiProvider, OllamaProvider, CustomOpenAiCompatibleProvider],
  exports: [ModelProvidersService]
})
export class ModelProvidersModule {}
