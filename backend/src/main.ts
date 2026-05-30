import "reflect-metadata";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { redactPaths } from "./security/redaction.util";

async function bootstrap() {
  const adapter = new FastifyAdapter({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      redact: redactPaths
    }
  });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { bufferLogs: true });
  const config = app.get(ConfigService);

  await app.register(helmet as never);
  await app.register(cors as never, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      // Allow any localhost port in development, plus configured frontend URL
      const allowed = !origin || /^https?:\/\/localhost(:\d+)?$/.test(origin) || origin === (config.get<string>("frontendUrl") ?? "http://localhost:3000");
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
