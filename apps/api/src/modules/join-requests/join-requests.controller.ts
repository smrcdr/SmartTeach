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
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ErrorResponseDto } from '../../common/dto/error-response.dto'
import { CurrentAuth } from '../../security/current-auth.decorator'
import type { AuthContext } from '../../security/auth.types'
import { AccessTokenAuthGuard } from '../../security/access-token-auth.guard'
import { joinRequestStatusValues } from '../groups/groups.schemas'
import { GroupJoinRequestDto } from './dto/group-join-request.dto'
import { JoinRequestDecisionRequestDto } from './dto/join-request-decision-request.dto'
import { ListJoinRequestsQueryDto } from './dto/list-join-requests-query.dto'
import { JoinRequestsService } from './join-requests.service'

@ApiTags('Join Requests')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: 'groups',
  version: '1',
})
export class JoinRequestsController {
  constructor(
    @Inject(JoinRequestsService) private readonly joinRequestsService: JoinRequestsService,
  ) {}

  @Get(':groupId/join-requests')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'status',
    required: false,
    enum: joinRequestStatusValues,
  })
  @ApiOperation({
    summary: 'Получить заявки на вступление',
    description: 'Доступно владельцу и администраторам группы.',
  })
  @ApiOkResponse({
    type: GroupJoinRequestDto,
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
  listJoinRequests(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Query() query: ListJoinRequestsQueryDto,
  ) {
    return this.joinRequestsService.listJoinRequests(groupId, auth.userId, query)
  }

  @Post(':groupId/join-requests')
  @ApiOperation({
    summary: 'Подать заявку на вступление',
    description: 'Создает заявку в группу с режимом BY_REQUEST.',
  })
  @ApiCreatedResponse({
    type: GroupJoinRequestDto,
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
  createJoinRequest(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    return this.joinRequestsService.createJoinRequest(groupId, auth.userId)
  }

  @Patch(':groupId/join-requests/:requestId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Рассмотреть заявку на вступление',
    description: 'Позволяет одобрить или отклонить заявку.',
  })
  @ApiOkResponse({
    type: GroupJoinRequestDto,
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
  decideJoinRequest(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('requestId', new ParseUUIDPipe({ version: '4' })) requestId: string,
    @Body() payload: JoinRequestDecisionRequestDto,
  ) {
    return this.joinRequestsService.decideJoinRequest(groupId, requestId, auth.userId, payload)
  }
}
