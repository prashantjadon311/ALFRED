import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { PromptLibraryController } from "./prompt-library.controller";
import { PromptLibraryService } from "./prompt-library.service";

@Module({
  imports: [RepositoriesModule, WorkspacesModule],
  controllers: [PromptLibraryController],
  providers: [PromptLibraryService],
  exports: [PromptLibraryService]
})
export class PromptLibraryModule {}
