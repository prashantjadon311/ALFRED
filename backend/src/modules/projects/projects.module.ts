import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({ imports: [RepositoriesModule, WorkspacesModule], controllers: [ProjectsController], providers: [ProjectsService], exports: [ProjectsService] })
export class ProjectsModule {}
