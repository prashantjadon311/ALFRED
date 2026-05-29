import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { UsersController } from "./users.controller";

@Module({
  imports: [RepositoriesModule],
  controllers: [UsersController]
})
export class UsersModule {}
