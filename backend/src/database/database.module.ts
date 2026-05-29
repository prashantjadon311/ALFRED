import { Global, Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { IndexesService } from "./indexes.service";

@Global()
@Module({
  providers: [DatabaseService, IndexesService],
  exports: [DatabaseService]
})
export class DatabaseModule {}
