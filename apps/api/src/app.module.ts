import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { RedisModule } from './cache/redis/redis.module'
import { CommonModule } from './common/common.module'
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware'
import { AppConfigModule } from './config/app-config.module'
import { PrismaModule } from './database/prisma/prisma.module'
import { SecurityModule } from './security/security.module'
import { MinioModule } from './storage/minio/minio.module'
import { SystemModule } from './modules/system/system.module'

@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    PrismaModule,
    RedisModule,
    MinioModule,
    SecurityModule,
    SystemModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes({
      path: '*path',
      method: RequestMethod.ALL,
    })
  }
}
