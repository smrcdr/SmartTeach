import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { AppConfigService } from '../../config/app-config.service'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: AppConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: config.databaseUrl,
      }),
    })
  }

  async healthCheck() {
    await this.$queryRaw`SELECT 1`
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
