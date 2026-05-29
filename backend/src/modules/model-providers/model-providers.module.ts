import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { SecurityModule } from "../../security/security.module";
import { ModelProvidersController } from "./model-providers.controller";
import { ModelProvidersService } from "./model-providers.service";

@Module({
  imports: [RepositoriesModule, SecurityModule],
  controllers: [ModelProvidersController],
  providers: [ModelProvidersService],
  exports: [ModelProvidersService]
})
export class ModelProvidersModule {}
