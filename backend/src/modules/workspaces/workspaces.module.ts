import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { WorkspacesController } from "./workspaces.controller";
import { WorkspacesService } from "./workspaces.service";
import { WorkspaceScopeService } from "./workspace-scope.service";

@Module({ imports: [RepositoriesModule], controllers: [WorkspacesController], providers: [WorkspacesService, WorkspaceScopeService], exports: [WorkspacesService, WorkspaceScopeService] })
export class WorkspacesModule {}
