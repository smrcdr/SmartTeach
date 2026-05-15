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
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ErrorResponseDto } from '../../common/dto/error-response.dto'
import { CurrentAuth, CurrentOptionalAuth } from '../../security/current-auth.decorator'
import type { AuthContext } from '../../security/auth.types'
import { AccessTokenAuthGuard } from '../../security/access-token-auth.guard'
import { OptionalAccessTokenAuthGuard } from '../../security/optional-access-token-auth.guard'
import { CreateGroupRequestDto } from './dto/create-group-request.dto'
import { GroupDto } from './dto/group.dto'
import { ListGroupsQueryDto } from './dto/list-groups-query.dto'
import { UpdateGroupRequestDto } from './dto/update-group-request.dto'
import { GroupsService } from './groups.service'

@ApiTags('Groups')
@Controller({
  path: 'groups',
  version: '1',
})
export class GroupsController {
  constructor(@Inject(GroupsService) private readonly groupsService: GroupsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAccessTokenAuthGuard)
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'code',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'accessMode',
    required: false,
    enum: ['OPEN', 'BY_REQUEST', 'CLOSED'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'ARCHIVED', 'DELETED'],
  })
  @ApiQuery({
    name: 'joinedOnly',
    required: false,
    type: Boolean,
  })
  @ApiOperation({
    summary: 'Получить список групп',
    description: 'Возвращает публичные группы без входа в аккаунт и дополняет ответ данными участия, если передан access token.',
  })
  @ApiOkResponse({
    type: GroupDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  listGroups(
    @CurrentOptionalAuth() auth: AuthContext | null,
    @Query() query: ListGroupsQueryDto,
  ) {
    return this.groupsService.listGroups(auth?.userId ?? null, query)
  }

  @Post()
  @UseGuards(AccessTokenAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Создать группу',
    description: 'Создает группу, настройки группы и запись владельца в составе участников.',
  })
  @ApiCreatedResponse({
    type: GroupDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  createGroup(
    @CurrentAuth() auth: AuthContext,
    @Body() payload: CreateGroupRequestDto,
  ) {
    return this.groupsService.createGroup(auth.userId, payload)
  }

  @Get('by-code/:code')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAccessTokenAuthGuard)
  @ApiOperation({
    summary: 'Найти группу по коду',
  })
  @ApiOkResponse({
    type: GroupDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  getGroupByCode(
    @CurrentOptionalAuth() auth: AuthContext | null,
    @Param('code') code: string,
  ) {
    return this.groupsService.getGroupByCodeOrThrow(auth?.userId ?? null, code)
  }

  @Get(':groupId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAccessTokenAuthGuard)
  @ApiOperation({
    summary: 'Получить группу по идентификатору',
  })
  @ApiOkResponse({
    type: GroupDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  getGroupById(
    @CurrentOptionalAuth() auth: AuthContext | null,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    return this.groupsService.getGroupByIdOrThrow(auth?.userId ?? null, groupId)
  }

  @Patch(':groupId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Обновить группу',
    description: 'Позволяет владельцу или администратору обновить базовые поля группы.',
  })
  @ApiOkResponse({
    type: GroupDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
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
  updateGroup(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() payload: UpdateGroupRequestDto,
  ) {
    return this.groupsService.updateGroup(groupId, auth.userId, payload)
  }

  @Delete(':groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Удалить группу',
    description: 'Выполняет мягкое удаление группы и переводит ее в статус DELETED.',
  })
  @ApiNoContentResponse({
    description: 'Группа успешно удалена.',
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
  async deleteGroup(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    await this.groupsService.deleteGroup(groupId, auth.userId)
  }
}
