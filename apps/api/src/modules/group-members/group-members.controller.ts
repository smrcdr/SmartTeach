import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ErrorResponseDto } from '../../common/dto/error-response.dto'
import { CurrentAuth } from '../../security/current-auth.decorator'
import type { AuthContext } from '../../security/auth.types'
import { AccessTokenAuthGuard } from '../../security/access-token-auth.guard'
import { CreateGroupMemberRequestDto } from './dto/create-group-member-request.dto'
import { UpdateGroupMemberRequestDto } from './dto/update-group-member-request.dto'
import { GroupMemberDto } from './dto/group-member.dto'
import { GroupMembersService } from './group-members.service'

@ApiTags('Group Members')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: 'groups',
  version: '1',
})
export class GroupMembersController {
  constructor(
    @Inject(GroupMembersService) private readonly groupMembersService: GroupMembersService,
  ) {}

  @Post(':groupId/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Вступить в открытую группу',
    description:
      'Работает только для групп с режимом OPEN. Для групп BY_REQUEST нужно использовать заявки на вступление.',
  })
  @ApiOkResponse({
    type: GroupMemberDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
  })
  joinGroup(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    return this.groupMembersService.joinGroup(groupId, auth.userId)
  }

  @Post(':groupId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Покинуть группу',
  })
  @ApiNoContentResponse({
    description: 'Пользователь успешно покинул группу.',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  async leaveGroup(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    await this.groupMembersService.leaveGroup(groupId, auth.userId)
  }

  @Get(':groupId/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить участников группы',
  })
  @ApiOkResponse({
    type: GroupMemberDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  listMembers(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    return this.groupMembersService.listMembers(groupId, auth.userId)
  }

  @Post(':groupId/members')
  @ApiOperation({
    summary: 'Добавить участника в группу вручную',
    description: 'Используется владельцем или администратором, в том числе для закрытых групп.',
  })
  @ApiCreatedResponse({
    type: GroupMemberDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
  })
  createMember(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() payload: CreateGroupMemberRequestDto,
  ) {
    return this.groupMembersService.createMember(groupId, auth.userId, payload)
  }

  @Patch(':groupId/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Изменить роль участника',
  })
  @ApiOkResponse({
    type: GroupMemberDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  updateMemberRole(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() payload: UpdateGroupMemberRequestDto,
  ) {
    return this.groupMembersService.updateMemberRole(groupId, userId, auth.userId, payload)
  }

  @Delete(':groupId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить участника из группы',
  })
  @ApiNoContentResponse({
    description: 'Участник успешно удален из группы.',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  async removeMember(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    await this.groupMembersService.removeMember(groupId, userId, auth.userId)
  }
}
