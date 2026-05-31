import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { LlmGatewayModule } from "../llm-gateway/llm-gateway.module";
import { UsageModule } from "../usage/usage.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { ChatsController } from "./chats.controller";
import { ChatsService } from "./chats.service";

@Module({
  imports: [RepositoriesModule, LlmGatewayModule, UsageModule, WorkspacesModule],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService]
})
export class ChatsModule {}
