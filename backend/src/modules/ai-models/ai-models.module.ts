import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { AiModelsController } from "./ai-models.controller";
import { AiModelsService } from "./ai-models.service";

@Module({
  imports: [RepositoriesModule],
  controllers: [AiModelsController],
  providers: [AiModelsService],
  exports: [AiModelsService]
})
export class AiModelsModule {}
