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
import { CreateLessonRequestDto } from './dto/create-lesson-request.dto'
import { LessonDto } from './dto/lesson.dto'
import { ListLessonsQueryDto } from './dto/list-lessons-query.dto'
import { UpdateLessonRequestDto } from './dto/update-lesson-request.dto'
import { LessonsService } from './lessons.service'
import { lessonStatusValues } from './lessons.schemas'

@ApiTags('Lessons')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: 'groups',
  version: '1',
})
export class LessonsController {
  constructor(@Inject(LessonsService) private readonly lessonsService: LessonsService) {}

  @Get(':groupId/lessons')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'status',
    required: false,
    enum: lessonStatusValues,
  })
  @ApiOperation({
    summary: 'Получить список уроков группы',
  })
  @ApiOkResponse({
    type: LessonDto,
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
  listLessons(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Query() query: ListLessonsQueryDto,
  ) {
    return this.lessonsService.listLessons(groupId, auth.userId, query)
  }

  @Post(':groupId/lessons')
  @ApiOperation({
    summary: 'Создать урок',
    description: 'Доступно владельцу и администраторам группы, если lessons_enabled включен.',
  })
  @ApiCreatedResponse({
    type: LessonDto,
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
  createLesson(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() payload: CreateLessonRequestDto,
  ) {
    return this.lessonsService.createLesson(groupId, auth.userId, payload)
  }

  @Get(':groupId/lessons/:lessonId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить урок',
  })
  @ApiOkResponse({
    type: LessonDto,
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
  getLesson(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('lessonId', new ParseUUIDPipe({ version: '4' })) lessonId: string,
  ) {
    return this.lessonsService.getLesson(groupId, lessonId, auth.userId)
  }

  @Patch(':groupId/lessons/:lessonId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обновить урок',
    description: 'Позволяет менять статус, порядок и набор привязанных файлов урока.',
  })
  @ApiOkResponse({
    type: LessonDto,
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
  updateLesson(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('lessonId', new ParseUUIDPipe({ version: '4' })) lessonId: string,
    @Body() payload: UpdateLessonRequestDto,
  ) {
    return this.lessonsService.updateLesson(groupId, lessonId, auth.userId, payload)
  }
}
