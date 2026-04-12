import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { RedisService } from '../../cache/redis/redis.service'
import { PrismaService } from '../../database/prisma/prisma.service'
import { MinioService } from '../../storage/minio/minio.service'
import { HealthResponseDto } from './dto/health-response.dto'

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name)

  constructor(
    @Inject(PrismaService)
    private readonly prismaService: PrismaService,
    @Inject(RedisService)
    private readonly redisService: RedisService,
    @Inject(MinioService)
    private readonly minioService: MinioService,
  ) {}

  async getHealth(): Promise<HealthResponseDto> {
    const results = await Promise.allSettled([
      this.runCheck('database', () => this.prismaService.healthCheck()),
      this.runCheck('redis', () => this.redisService.ping()),
      this.runCheck('minio', () => this.minioService.healthCheck()),
    ])
    const errors = results.flatMap((result) => {
      if (result.status === 'fulfilled') {
        return []
      }

      return [result.reason instanceof Error ? result.reason.message : String(result.reason)]
    })

    if (errors.length > 0) {
      this.logger.error(`Health check failed: ${errors.join('; ')}`)

      throw new ServiceUnavailableException({
        message: 'Service dependencies are unavailable',
        errors,
      })
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }

  private async runCheck(name: string, check: () => Promise<unknown>) {
    try {
      await check()
    } catch (error) {
      throw new Error(`${name}: ${this.formatError(error)}`)
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof AggregateError) {
      const nestedErrors = error.errors
        .map((nestedError) => this.formatError(nestedError))
        .filter(Boolean)

      return nestedErrors.length > 0 ? nestedErrors.join('; ') : error.name
    }

    const errorCode = this.getErrorCode(error)

    if (error instanceof Error) {
      const normalizedMessage = error.message.replace(/\s+/g, ' ').trim()

      if (normalizedMessage && errorCode && !normalizedMessage.includes(errorCode)) {
        return `${errorCode}: ${normalizedMessage}`
      }

      return normalizedMessage || errorCode || error.name
    }

    return errorCode || String(error)
  }

  private getErrorCode(error: unknown) {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return null
    }

    return typeof error.code === 'string' ? error.code : null
  }
}
