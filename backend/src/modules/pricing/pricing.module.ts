import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { PricingService } from "./pricing.service";

@Module({
  imports: [RepositoriesModule],
  providers: [PricingService],
  exports: [PricingService]
})
export class PricingModule {}
