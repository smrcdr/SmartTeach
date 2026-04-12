import 'reflect-metadata'
import helmet from 'helmet'
import { Logger, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/exception-filters/all-exceptions.filter'
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe'
import { AppConfigService } from './config/app-config.service'

type CreateAppOptions = {
  enableSwagger?: boolean
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = await NestFactory.create(AppModule)

  app.enableShutdownHooks()
  app.use(helmet())
  const config = app.get(AppConfigService)

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  })
  app.setGlobalPrefix('api')
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })
  app.useGlobalPipes(new ZodValidationPipe())
  app.useGlobalFilters(new AllExceptionsFilter())

  const shouldEnableSwagger = options.enableSwagger ?? config.swaggerEnabled

  if (shouldEnableSwagger) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('SmartTeach API')
        .setDescription('Backend API for SmartTeach MVP.')
        .setVersion('0.2.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          'bearerAuth',
        )
        .addServer(`${config.publicApiBaseUrl}/api/v1`, 'Local REST API')
        .build(),
    )

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'SmartTeach API Docs',
    })
  }

  return app
}

export async function bootstrap() {
  const app = await createApp()
  const logger = new Logger('Bootstrap')
  const config = app.get(AppConfigService)

  await app.listen(config.apiPort, config.apiHost)

  logger.log(`API is listening on ${config.publicApiBaseUrl}/api/v1`)
  if (config.swaggerEnabled) {
    logger.log(`Swagger UI is available at ${config.publicApiBaseUrl}/api/docs`)
  }
}

if (require.main === module) {
  void bootstrap()
}
