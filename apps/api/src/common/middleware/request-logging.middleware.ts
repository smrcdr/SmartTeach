import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = Date.now()
    const requestId = request.header('x-request-id') ?? randomUUID()

    response.setHeader('x-request-id', requestId)

    response.on('finish', () => {
      const payload = {
        requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt,
        ip: request.ip ?? request.socket.remoteAddress ?? 'unknown',
      }
      const line = JSON.stringify(payload)

      if (response.statusCode >= 500) {
        this.logger.error(line)
        return
      }

      if (response.statusCode >= 400) {
        this.logger.warn(line)
        return
      }

      this.logger.log(line)
    })

    next()
  }
}
