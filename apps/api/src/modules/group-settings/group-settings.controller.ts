import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
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
import { GroupSettingsDto } from '../groups/dto/group-settings.dto'
import { GroupSettingsService } from './group-settings.service'
import { UpdateGroupSettingsRequestDto } from './dto/update-group-settings-request.dto'

@ApiTags('Group Settings')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: 'groups',
  version: '1',
})
export class GroupSettingsController {
  constructor(
    @Inject(GroupSettingsService) private readonly groupSettingsService: GroupSettingsService,
  ) {}

  @Get(':groupId/settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить настройки группы',
  })
  @ApiOkResponse({
    type: GroupSettingsDto,
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
  getGroupSettings(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    return this.groupSettingsService.getGroupSettings(groupId, auth.userId)
  }

  @Patch(':groupId/settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обновить настройки группы',
    description: 'Позволяет владельцу или администратору включать и отключать функции группы.',
  })
  @ApiOkResponse({
    type: GroupSettingsDto,
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
  updateGroupSettings(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() payload: UpdateGroupSettingsRequestDto,
  ) {
    return this.groupSettingsService.updateGroupSettings(groupId, auth.userId, payload)
  }
}
