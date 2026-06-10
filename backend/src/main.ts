import "reflect-metadata";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { assertProductionSecrets } from "./config/production-secret.guard";
import { redactPaths } from "./security/redaction.util";

async function bootstrap() {
  assertProductionSecrets();

  const adapter = new FastifyAdapter({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      redact: redactPaths
    }
  });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { bufferLogs: true });
  const config = app.get(ConfigService);

  await app.register(cookie as never);
  await app.register(helmet as never);
  await app.register(cors as never, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      const nodeEnv = config.get<string>("nodeEnv") ?? "development";
      const frontendOrigins = config.get<string[]>("frontendOrigins") ?? [];
      const allowed = !origin
        || frontendOrigins.includes(origin)
        || (nodeEnv !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin));
      cb(null, allowed);
    },
    credentials: true
  });
  await app.register(rateLimit as never, { max: 120, timeWindow: "1 minute" });

  app.useGlobalFilters(new GlobalExceptionFilter());

  if ((process.env.NODE_ENV ?? "development") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("A.L.F.R.E.D. Backend API")
      .setDescription("Agentic Logic Framework for Real-time Execution and Deployment")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  await app.listen(config.get<number>("port") ?? 4000, "0.0.0.0");
}

void bootstrap();
