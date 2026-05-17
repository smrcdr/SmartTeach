import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { AppEnvironment } from './env.schema'

function parseDurationToSeconds(duration: string) {
  const match = duration.match(/^(\d+)([smhd])$/)

  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`)
  }

  const [, rawValue, unit] = match
  const value = Number(rawValue)

  switch (unit) {
    case 's':
      return value
    case 'm':
      return value * 60
    case 'h':
      return value * 60 * 60
    case 'd':
      return value * 60 * 60 * 24
    default:
      throw new Error(`Unsupported duration unit: ${unit}`)
  }
}

@Injectable()
export class AppConfigService {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService<AppEnvironment, true>,
  ) {}

  get apiPublicUrl() {
    return this.configService.get('API_PUBLIC_URL', { infer: true }) ?? null
  }

  get nodeEnv() {
    return this.getValue('NODE_ENV')
  }

  get apiHost() {
    return this.getValue('API_HOST')
  }

  get apiPort() {
    return this.getValue('API_PORT')
  }

  get webUrl() {
    return this.getValue('WEB_URL')
  }

  get corsOrigins() {
    return [this.webUrl]
  }

  get databaseUrl() {
    return this.getValue('DATABASE_URL')
  }

  get redisUrl() {
    return this.getValue('REDIS_URL')
  }

  get minioEndpoint() {
    return this.getValue('MINIO_ENDPOINT')
  }

  get minioPublicEndpoint() {
    return this.configService.get('MINIO_PUBLIC_ENDPOINT', { infer: true }) ?? this.minioEndpoint
  }

  get minioPort() {
    return this.getValue('MINIO_PORT')
  }

  get minioBucket() {
    return this.getValue('MINIO_BUCKET')
  }

  get minioRegion() {
    return this.getValue('MINIO_REGION')
  }

  get minioRootUser() {
    return this.getValue('MINIO_ROOT_USER')
  }

  get minioRootPassword() {
    return this.getValue('MINIO_ROOT_PASSWORD')
  }

  get minioForcePathStyle() {
    return this.getValue('MINIO_FORCE_PATH_STYLE')
  }

  get jwtAccessSecret() {
    return this.getValue('JWT_ACCESS_SECRET')
  }

  get jwtRefreshSecret() {
    return this.getValue('JWT_REFRESH_SECRET')
  }

  get jwtAccessTtl() {
    return this.getValue('JWT_ACCESS_TTL')
  }

  get jwtRefreshTtl() {
    return this.getValue('JWT_REFRESH_TTL')
  }

  get jwtAccessTtlSeconds() {
    return parseDurationToSeconds(this.jwtAccessTtl)
  }

  get jwtRefreshTtlSeconds() {
    return parseDurationToSeconds(this.jwtRefreshTtl)
  }

  get jwtIssuer() {
    return this.getValue('JWT_ISSUER')
  }

  get jwtAudience() {
    return this.getValue('JWT_AUDIENCE')
  }

  get passwordHashRounds() {
    return this.getValue('PASSWORD_HASH_ROUNDS')
  }

  get swaggerEnabled() {
    return this.getValue('SWAGGER_ENABLED')
  }

  get publicApiBaseUrl() {
    if (this.apiPublicUrl) {
      return this.apiPublicUrl.replace(/\/$/, '')
    }

    const publicUrl = new URL('http://localhost')

    publicUrl.hostname = this.resolvePublicApiHostname()
    publicUrl.port = String(this.apiPort)

    return publicUrl.toString().replace(/\/$/, '')
  }

  private getValue<Key extends keyof AppEnvironment>(key: Key) {
    return this.configService.getOrThrow(key, { infer: true })
  }

  private resolvePublicApiHostname() {
    if (this.apiHost === '0.0.0.0' || this.apiHost === '::') {
      return 'localhost'
    }

    return this.apiHost
  }
}
