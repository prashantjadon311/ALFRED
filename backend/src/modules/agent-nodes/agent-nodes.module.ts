import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { AgentNodesController } from "./agent-nodes.controller";
import { AgentNodesService } from "./agent-nodes.service";

@Module({
  imports: [RepositoriesModule],
  controllers: [AgentNodesController],
  providers: [AgentNodesService],
  exports: [AgentNodesService]
})
export class AgentNodesModule {}
