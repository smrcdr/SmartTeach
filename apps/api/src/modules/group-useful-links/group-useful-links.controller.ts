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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { CreateGroupUsefulLinkRequestDto } from './dto/create-group-useful-link-request.dto'
import { GroupUsefulLinkDto } from './dto/group-useful-link.dto'
import { UpdateGroupUsefulLinkRequestDto } from './dto/update-group-useful-link-request.dto'
import { GroupUsefulLinksService } from './group-useful-links.service'

@ApiTags('Group useful links')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: 'groups',
  version: '1',
})
export class GroupUsefulLinksController {
  constructor(
    @Inject(GroupUsefulLinksService)
    private readonly groupUsefulLinksService: GroupUsefulLinksService,
  ) {}

  @Get(':groupId/useful-links')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить полезные ссылки группы',
  })
  @ApiOkResponse({
    type: GroupUsefulLinkDto,
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
  listUsefulLinks(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    return this.groupUsefulLinksService.listUsefulLinks(groupId, auth.userId)
  }

  @Post(':groupId/useful-links')
  @ApiOperation({
    summary: 'Добавить полезную ссылку',
    description: 'Доступно владельцу и администраторам группы, если useful_links_enabled включен.',
  })
  @ApiCreatedResponse({
    type: GroupUsefulLinkDto,
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
  createUsefulLink(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() payload: CreateGroupUsefulLinkRequestDto,
  ) {
    return this.groupUsefulLinksService.createUsefulLink(groupId, auth.userId, payload)
  }

  @Patch(':groupId/useful-links/:linkId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обновить полезную ссылку',
    description: 'Доступно владельцу и администраторам группы, если useful_links_enabled включен.',
  })
  @ApiOkResponse({
    type: GroupUsefulLinkDto,
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
  updateUsefulLink(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('linkId', new ParseUUIDPipe({ version: '4' })) linkId: string,
    @Body() payload: UpdateGroupUsefulLinkRequestDto,
  ) {
    return this.groupUsefulLinksService.updateUsefulLink(groupId, linkId, auth.userId, payload)
  }

  @Delete(':groupId/useful-links/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить полезную ссылку',
    description: 'Доступно владельцу и администраторам группы, если useful_links_enabled включен.',
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
  async deleteUsefulLink(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('linkId', new ParseUUIDPipe({ version: '4' })) linkId: string,
  ) {
    await this.groupUsefulLinksService.deleteUsefulLink(groupId, linkId, auth.userId)
  }
}
