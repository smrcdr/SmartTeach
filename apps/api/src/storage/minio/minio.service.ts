import { Inject, Injectable } from '@nestjs/common'
import { Client } from 'minio'
import { AppConfigService } from '../../config/app-config.service'

type UploadObjectOptions = {
  objectName: string
  body: Buffer
  contentType: string
}

@Injectable()
export class MinioService {
  private readonly client: Client

  constructor(@Inject(AppConfigService) private readonly config: AppConfigService) {
    const endpoint = new URL(this.config.minioEndpoint)

    this.client = new Client({
      endPoint: endpoint.hostname,
      port: endpoint.port ? Number(endpoint.port) : this.config.minioPort,
      useSSL: endpoint.protocol === 'https:',
      accessKey: this.config.minioRootUser,
      secretKey: this.config.minioRootPassword,
      region: this.config.minioRegion,
      pathStyle: this.config.minioForcePathStyle,
    })
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
    return this.client.presignedGetObject(this.bucketName, objectName, expiresInSeconds)
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
}
