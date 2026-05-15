import { Inject, Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common'
import { createClient, type RedisClientType } from 'redis'
import { AppConfigService } from '../../config/app-config.service'

@Injectable()
export class RedisService implements OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name)
  private readonly client: RedisClientType
  private connectionPromise: Promise<void> | null = null

  constructor(@Inject(AppConfigService) private readonly config: AppConfigService) {
    this.client = createClient({
      url: this.config.redisUrl,
      socket: {
        connectTimeout: 5_000,
        reconnectStrategy: false,
      },
    })

    this.client.on('error', (error) => {
      this.logger.error(`Redis client error: ${error.message || String(error)}`)
    })
  }

  getClient() {
    return this.client
  }

  async ping() {
    await this.ensureConnected()

    return this.client.ping()
  }

  async get(key: string) {
    await this.ensureConnected()

    return this.client.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    await this.ensureConnected()

    if (ttlSeconds !== undefined) {
      if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
        throw new Error('ttlSeconds must be a positive integer')
      }

      await this.client.set(key, value, {
        EX: ttlSeconds,
      })
      return
    }

    await this.client.set(key, value)
  }

  async del(key: string) {
    await this.ensureConnected()

    await this.client.del(key)
  }

  async onApplicationShutdown() {
    if (this.client.isOpen) {
      await this.client.quit()
    }
  }

  private async ensureConnected() {
    if (this.client.isOpen) {
      return
    }

    if (!this.connectionPromise) {
      this.connectionPromise = this.client
        .connect()
        .then(() => undefined)
        .finally(() => {
          this.connectionPromise = null
        })
    }

    await this.connectionPromise
  }
}
