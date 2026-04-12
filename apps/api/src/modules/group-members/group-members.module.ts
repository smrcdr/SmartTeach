import { Module } from '@nestjs/common'
import { GroupsModule } from '../groups/groups.module'
import { GroupMembersController } from './group-members.controller'
import { GroupMembersService } from './group-members.service'

@Module({
  imports: [GroupsModule],
  controllers: [GroupMembersController],
  providers: [GroupMembersService],
})
export class GroupMembersModule {}
