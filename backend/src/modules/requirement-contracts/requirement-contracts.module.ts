import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { OrchestratorModule } from "../../orchestrator/orchestrator.module";
import { RequirementContractsController } from "./requirement-contracts.controller";
import { RequirementContractsService } from "./requirement-contracts.service";

@Module({ imports: [RepositoriesModule, OrchestratorModule], controllers: [RequirementContractsController], providers: [RequirementContractsService] })
export class RequirementContractsModule {}
