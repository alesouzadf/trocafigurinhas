import path from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { FigurinhasModule } from "./figurinhas/figurinhas.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, "../.env"),
        path.resolve(process.cwd(), ".env"),
      ],
    }),
    AuthModule,
    FigurinhasModule,
  ],
})
export class AppModule {}
