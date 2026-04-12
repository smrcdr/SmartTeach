import { Module } from '@nestjs/common'
import { GroupsModule } from '../groups/groups.module'
import { GroupSettingsController } from './group-settings.controller'
import { GroupSettingsService } from './group-settings.service'

@Module({
  imports: [GroupsModule],
  controllers: [GroupSettingsController],
  providers: [GroupSettingsService],
})
export class GroupSettingsModule {}
