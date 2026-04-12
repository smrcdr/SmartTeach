import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'

type NormalizedException = {
  statusCode: number
  message: string
  errors?: string[]
  logDetails?: string
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()
    const normalized = this.normalizeException(exception)
    const logPayload = JSON.stringify({
      method: request.method,
      path: request.originalUrl,
      statusCode: normalized.statusCode,
      message: normalized.message,
      errors: normalized.errors,
    })

    if (normalized.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logPayload, normalized.logDetails)
    } else if (normalized.statusCode >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(logPayload)
    }

    response.status(normalized.statusCode).json({
      statusCode: normalized.statusCode,
      message: normalized.message,
      ...(normalized.errors && normalized.errors.length > 0
        ? { errors: normalized.errors }
        : {}),
    })
  }

  private normalizeException(exception: unknown): NormalizedException {
    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception)
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        logDetails: exception.stack ?? exception.message,
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      logDetails: String(exception),
    }
  }

  private normalizeHttpException(exception: HttpException): NormalizedException {
    const statusCode = exception.getStatus()
    const payload = exception.getResponse()

    if (typeof payload === 'string') {
      return {
        statusCode,
        message: payload,
      }
    }

    if (typeof payload === 'object' && payload !== null) {
      const response = payload as {
        message?: string | string[]
        error?: string
        errors?: string[]
      }
      const validationErrors =
        response.errors ??
        (Array.isArray(response.message) ? response.message.map(String) : undefined)
      const message =
        typeof response.message === 'string'
          ? response.message
          : validationErrors && validationErrors.length > 0
            ? 'Validation failed'
            : response.error ?? this.getDefaultMessage(statusCode)

      return {
        statusCode,
        message,
        errors: validationErrors,
      }
    }

    return {
      statusCode,
      message: this.getDefaultMessage(statusCode),
    }
  }

  private getDefaultMessage(statusCode: number) {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Validation failed'
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized'
      case HttpStatus.FORBIDDEN:
        return 'Forbidden'
      case HttpStatus.NOT_FOUND:
        return 'Resource not found'
      case HttpStatus.CONFLICT:
        return 'Conflict'
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service unavailable'
      default:
        return 'Request failed'
    }
  }
}
