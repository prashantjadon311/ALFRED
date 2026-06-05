import { Injectable } from "@nestjs/common";
import { EncryptionService } from "../../security/encryption.service";
import { OpenAiProvider } from "./openai.provider";

@Injectable()
export class CustomOpenAiCompatibleProvider extends OpenAiProvider {
  providerType = "custom_openai_compatible" as const;
  protected readonly defaultBaseUrl = "http://localhost:8000/v1";

  constructor(encryption: EncryptionService) {
    super(encryption);
  }
}
