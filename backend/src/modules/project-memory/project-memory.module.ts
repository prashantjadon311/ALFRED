import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { ProjectMemoryController } from "./project-memory.controller";

@Module({ imports: [RepositoriesModule], controllers: [ProjectMemoryController] })
export class ProjectMemoryModule {}
