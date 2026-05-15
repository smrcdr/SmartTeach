import { Inject, Injectable } from '@nestjs/common'
import { GroupSettingsDto } from '../groups/dto/group-settings.dto'
import { GroupsService } from '../groups/groups.service'
import { UpdateGroupSettingsRequestDto } from './dto/update-group-settings-request.dto'

@Injectable()
export class GroupSettingsService {
  constructor(@Inject(GroupsService) private readonly groupsService: GroupsService) {}

  async getGroupSettings(groupId: string, userId: string): Promise<GroupSettingsDto> {
    return this.groupsService.getGroupSettingsOrThrow(groupId, userId)
  }

  async updateGroupSettings(
    groupId: string,
    userId: string,
    payload: UpdateGroupSettingsRequestDto,
  ): Promise<GroupSettingsDto> {
    return this.groupsService.updateGroupSettings(groupId, userId, payload)
  }
}
