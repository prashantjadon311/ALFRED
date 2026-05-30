import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest & { requestId?: string }>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : {};
    const message = typeof body === "object" && body && "message" in body ? (body as { message: unknown }).message : "Internal server error";
    const code = typeof body === "object" && body && "code" in body ? (body as { code: string }).code : HttpStatus[status] ?? "ERROR";
    const details = typeof body === "object" && body && "details" in body ? (body as { details: unknown }).details : undefined;
    if (!(exception instanceof HttpException)) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).send({
      error: {
        code,
        message: Array.isArray(message) ? message.join(", ") : String(message),
        details,
        requestId: request.requestId ?? request.id
      }
    });
  }
}
