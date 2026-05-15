import { Module } from '@nestjs/common'
import { GroupsModule } from '../groups/groups.module'
import { JoinRequestsController } from './join-requests.controller'
import { JoinRequestsService } from './join-requests.service'

@Module({
  imports: [GroupsModule],
  controllers: [JoinRequestsController],
  providers: [JoinRequestsService],
})
export class JoinRequestsModule {}
