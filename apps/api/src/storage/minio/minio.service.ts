import { Inject, Injectable } from '@nestjs/common'
import { Client } from 'minio'
import { AppConfigService } from '../../config/app-config.service'

type UploadObjectOptions = {
  objectName: string
  body: Buffer
  contentType: string
}

export function resolveMinioPort(endpoint: URL, fallbackPort: number) {
  if (endpoint.port) {
    return Number(endpoint.port)
  }

  if (endpoint.protocol === 'https:') {
    return 443
  }

  if (endpoint.protocol === 'http:') {
    return 80
  }

  return fallbackPort
}

@Injectable()
export class MinioService {
  private readonly client: Client
  private readonly publicClient: Client

  constructor(@Inject(AppConfigService) private readonly config: AppConfigService) {
    this.client = this.createClient(this.config.minioEndpoint)
    this.publicClient = this.createClient(this.config.minioPublicEndpoint)
  }

  get bucketName() {
    return this.config.minioBucket
  }

  getClient() {
    return this.client
  }

  async uploadObject(options: UploadObjectOptions) {
    await this.client.putObject(
      this.bucketName,
      options.objectName,
      options.body,
      options.body.length,
      {
        'Content-Type': options.contentType,
      },
    )
  }

  async getObjectUrl(objectName: string, expiresInSeconds = 60 * 60) {
    return this.publicClient.presignedGetObject(this.bucketName, objectName, expiresInSeconds)
  }

  async removeObject(objectName: string) {
    await this.client.removeObject(this.bucketName, objectName)
  }

  async healthCheck() {
    const bucketExists = await this.client.bucketExists(this.bucketName)

    if (!bucketExists) {
      throw new Error(`Bucket "${this.bucketName}" is missing`)
    }
  }

  async ensureBucketExists(bucketName = this.bucketName) {
    const exists = await this.client.bucketExists(bucketName)

    if (!exists) {
      await this.client.makeBucket(bucketName, this.config.minioRegion)
    }
  }

  private createClient(endpointUrl: string) {
    const endpoint = new URL(endpointUrl)

    return new Client({
      endPoint: endpoint.hostname,
      port: resolveMinioPort(endpoint, this.config.minioPort),
      useSSL: endpoint.protocol === 'https:',
      accessKey: this.config.minioRootUser,
      secretKey: this.config.minioRootPassword,
      region: this.config.minioRegion,
      pathStyle: this.config.minioForcePathStyle,
    })
  }
}
