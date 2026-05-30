import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { WorkspacesController } from "./workspaces.controller";
import { WorkspacesService } from "./workspaces.service";

@Module({ imports: [RepositoriesModule], controllers: [WorkspacesController], providers: [WorkspacesService], exports: [WorkspacesService] })
export class WorkspacesModule {}
