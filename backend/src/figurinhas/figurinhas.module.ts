import { Module } from "@nestjs/common";
import { FigurinhasController } from "./figurinhas.controller";
import { FigurinhasService } from "./figurinhas.service";

@Module({
  controllers: [FigurinhasController],
  providers: [FigurinhasService],
})
export class FigurinhasModule {}
