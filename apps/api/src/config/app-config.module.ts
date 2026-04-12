import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { resolve } from 'node:path'
import { AppConfigService } from './app-config.service'
import { validateEnv } from './env.schema'

function resolveEnvPaths() {
  const cwd = process.cwd()

  return [
    resolve(cwd, '.env'),
    resolve(cwd, '../.env'),
    resolve(cwd, '../../.env'),
  ]
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: resolveEnvPaths(),
      validate: validateEnv,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
