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
import { AssignmentDto } from './dto/assignment.dto'
import { CreateAssignmentRequestDto } from './dto/create-assignment-request.dto'
import { ListAssignmentsQueryDto } from './dto/list-assignments-query.dto'
import { UpdateAssignmentRequestDto } from './dto/update-assignment-request.dto'
import { assignmentStatusValues } from './assignments.schemas'
import { AssignmentsService } from './assignments.service'

@ApiTags('Assignments')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: 'groups',
  version: '1',
})
export class AssignmentsController {
  constructor(@Inject(AssignmentsService) private readonly assignmentsService: AssignmentsService) {}

  @Get(':groupId/assignments')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'status',
    required: false,
    enum: assignmentStatusValues,
  })
  @ApiQuery({
    name: 'lessonId',
    required: false,
    type: String,
    format: 'uuid',
  })
  @ApiOperation({
    summary: 'Получить список заданий группы',
  })
  @ApiOkResponse({
    type: AssignmentDto,
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
  listAssignments(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Query() query: ListAssignmentsQueryDto,
  ) {
    return this.assignmentsService.listAssignments(groupId, auth.userId, query)
  }

  @Post(':groupId/assignments')
  @ApiOperation({
    summary: 'Создать задание',
    description: 'Доступно владельцу и администраторам группы, если assignments_enabled включен.',
  })
  @ApiCreatedResponse({
    type: AssignmentDto,
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
  createAssignment(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() payload: CreateAssignmentRequestDto,
  ) {
    return this.assignmentsService.createAssignment(groupId, auth.userId, payload)
  }

  @Get(':groupId/assignments/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить задание',
  })
  @ApiOkResponse({
    type: AssignmentDto,
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
  getAssignment(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('assignmentId', new ParseUUIDPipe({ version: '4' })) assignmentId: string,
  ) {
    return this.assignmentsService.getAssignment(groupId, assignmentId, auth.userId)
  }

  @Patch(':groupId/assignments/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обновить задание',
    description: 'Позволяет менять статус, дедлайн, lessonId и набор привязанных файлов задания.',
  })
  @ApiOkResponse({
    type: AssignmentDto,
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
  updateAssignment(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('assignmentId', new ParseUUIDPipe({ version: '4' })) assignmentId: string,
    @Body() payload: UpdateAssignmentRequestDto,
  ) {
    return this.assignmentsService.updateAssignment(groupId, assignmentId, auth.userId, payload)
  }
}
