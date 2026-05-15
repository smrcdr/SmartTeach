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
import { AccessTokenAuthGuard } from '../../security/access-token-auth.guard'
import { CurrentAuth } from '../../security/current-auth.decorator'
import type { AuthContext } from '../../security/auth.types'
import { CreateScheduleEventRequestDto } from './dto/create-schedule-event-request.dto'
import { ListScheduleEventsQueryDto } from './dto/list-schedule-events-query.dto'
import { ListScheduleQueryDto } from './dto/list-schedule-query.dto'
import { ScheduleEntryDto } from './dto/schedule-entry.dto'
import { ScheduleEventDto } from './dto/schedule-event.dto'
import { UpdateScheduleEventRequestDto } from './dto/update-schedule-event-request.dto'
import { scheduleEventStatusValues } from './schedule.schemas'
import { ScheduleService } from './schedule.service'

@ApiTags('Schedule')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: 'groups',
  version: '1',
})
export class ScheduleController {
  constructor(@Inject(ScheduleService) private readonly scheduleService: ScheduleService) {}

  @Get(':groupId/schedule')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ApiOperation({
    summary: 'Получить единый календарь группы',
  })
  @ApiOkResponse({
    type: ScheduleEntryDto,
    isArray: true,
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
  listSchedule(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Query() query: ListScheduleQueryDto,
  ) {
    return this.scheduleService.listSchedule(groupId, auth.userId, query)
  }

  @Get(':groupId/schedule/events')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'status',
    required: false,
    enum: scheduleEventStatusValues,
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ApiOperation({
    summary: 'Получить кастомные события группы',
  })
  @ApiOkResponse({
    type: ScheduleEventDto,
    isArray: true,
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
  listScheduleEvents(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Query() query: ListScheduleEventsQueryDto,
  ) {
    return this.scheduleService.listScheduleEvents(groupId, auth.userId, query)
  }

  @Post(':groupId/schedule/events')
  @ApiOperation({
    summary: 'Создать кастомное событие',
    description: 'Доступно владельцу и администраторам группы, если schedule_enabled включен.',
  })
  @ApiCreatedResponse({
    type: ScheduleEventDto,
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
  createScheduleEvent(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() payload: CreateScheduleEventRequestDto,
  ) {
    return this.scheduleService.createScheduleEvent(groupId, auth.userId, payload)
  }

  @Get(':groupId/schedule/events/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить кастомное событие',
  })
  @ApiOkResponse({
    type: ScheduleEventDto,
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
  getScheduleEvent(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
  ) {
    return this.scheduleService.getScheduleEvent(groupId, eventId, auth.userId)
  }

  @Patch(':groupId/schedule/events/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обновить кастомное событие',
  })
  @ApiOkResponse({
    type: ScheduleEventDto,
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
  updateScheduleEvent(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Body() payload: UpdateScheduleEventRequestDto,
  ) {
    return this.scheduleService.updateScheduleEvent(groupId, eventId, auth.userId, payload)
  }

  @Delete(':groupId/schedule/events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить кастомное событие',
  })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  deleteScheduleEvent(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
  ) {
    return this.scheduleService.deleteScheduleEvent(groupId, eventId, auth.userId)
  }
}
