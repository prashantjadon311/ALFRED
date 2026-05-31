import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { ProjectMemoryController } from "./project-memory.controller";

@Module({ imports: [RepositoriesModule, WorkspacesModule], controllers: [ProjectMemoryController] })
export class ProjectMemoryModule {}
