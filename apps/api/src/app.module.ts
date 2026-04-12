import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { RedisModule } from './cache/redis/redis.module'
import { CommonModule } from './common/common.module'
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware'
import { AppConfigModule } from './config/app-config.module'
import { PrismaModule } from './database/prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { AssignmentsModule } from './modules/assignments/assignments.module'
import { ChatsModule } from './modules/chats/chats.module'
import { FilesModule } from './modules/files/files.module'
import { GroupSettingsModule } from './modules/group-settings/group-settings.module'
import { GroupMembersModule } from './modules/group-members/group-members.module'
import { GroupsModule } from './modules/groups/groups.module'
import { JoinRequestsModule } from './modules/join-requests/join-requests.module'
import { LessonsModule } from './modules/lessons/lessons.module'
import { ScheduleModule } from './modules/schedule/schedule.module'
import { SecurityModule } from './security/security.module'
import { UsersModule } from './modules/users/users.module'
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
    UsersModule,
    AuthModule,
    AssignmentsModule,
    ChatsModule,
    FilesModule,
    GroupsModule,
    GroupSettingsModule,
    GroupMembersModule,
    JoinRequestsModule,
    LessonsModule,
    ScheduleModule,
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
