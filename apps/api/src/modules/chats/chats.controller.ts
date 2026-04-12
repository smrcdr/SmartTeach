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
import { CurrentAuth } from '../../security/current-auth.decorator'
import type { AuthContext } from '../../security/auth.types'
import { AccessTokenAuthGuard } from '../../security/access-token-auth.guard'
import { chatTypeValues } from './chats.schemas'
import { ChatsService } from './chats.service'
import { CreateDirectChatRequestDto } from './dto/create-direct-chat-request.dto'
import { ChatDto } from './dto/chat.dto'
import { GroupChatCreateRequestDto } from './dto/group-chat-create-request.dto'
import { GroupChatUpdateRequestDto } from './dto/group-chat-update-request.dto'
import { ListChatsQueryDto } from './dto/list-chats-query.dto'
import { ListMessagesQueryDto } from './dto/list-messages-query.dto'
import { MessageCreateRequestDto } from './dto/message-create-request.dto'
import { MessageDto } from './dto/message.dto'
import { MessageUpdateRequestDto } from './dto/message-update-request.dto'

@ApiTags('Chats')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: '',
  version: '1',
})
export class ChatsController {
  constructor(@Inject(ChatsService) private readonly chatsService: ChatsService) {}

  @Get('groups/:groupId/chats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить групповые чаты группы',
  })
  @ApiOkResponse({
    type: ChatDto,
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
  listGroupChats(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    return this.chatsService.listGroupChats(groupId, auth.userId)
  }

  @Post('groups/:groupId/chats')
  @ApiOperation({
    summary: 'Создать групповой чат',
    description: 'Доступно владельцу и администраторам группы, если chat_enabled включен.',
  })
  @ApiCreatedResponse({
    type: ChatDto,
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
  createGroupChat(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() payload: GroupChatCreateRequestDto,
  ) {
    return this.chatsService.createGroupChat(groupId, auth.userId, payload)
  }

  @Patch('groups/:groupId/chats/:chatId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обновить групповой чат',
  })
  @ApiOkResponse({
    type: ChatDto,
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
  updateGroupChat(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
    @Body() payload: GroupChatUpdateRequestDto,
  ) {
    return this.chatsService.updateGroupChat(groupId, chatId, auth.userId, payload)
  }

  @Delete('groups/:groupId/chats/:chatId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить групповой чат',
  })
  @ApiNoContentResponse({
    description: 'Чат успешно удален.',
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
  async deleteGroupChat(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
  ) {
    await this.chatsService.deleteGroupChat(groupId, chatId, auth.userId)
  }

  @Get('chats')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'chatType',
    required: false,
    enum: chatTypeValues,
  })
  @ApiQuery({
    name: 'groupId',
    required: false,
    type: String,
    format: 'uuid',
  })
  @ApiOperation({
    summary: 'Получить доступные чаты текущего пользователя',
  })
  @ApiOkResponse({
    type: ChatDto,
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
  listChats(
    @CurrentAuth() auth: AuthContext,
    @Query() query: ListChatsQueryDto,
  ) {
    return this.chatsService.listChats(auth.userId, query)
  }

  @Post('chats/direct')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Создать или получить личный чат',
    description: 'Возвращает существующий direct-чат 1 на 1 или создает новый, если его еще нет.',
  })
  @ApiOkResponse({
    type: ChatDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  createDirectChat(
    @CurrentAuth() auth: AuthContext,
    @Body() payload: CreateDirectChatRequestDto,
  ) {
    return this.chatsService.createOrGetDirectChat(auth.userId, payload)
  }

  @Get('chats/:chatId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить чат по идентификатору',
  })
  @ApiOkResponse({
    type: ChatDto,
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
  getChat(
    @CurrentAuth() auth: AuthContext,
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
  ) {
    return this.chatsService.getChat(chatId, auth.userId)
  }

  @Get('chats/:chatId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'before',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ApiOperation({
    summary: 'Получить сообщения чата',
  })
  @ApiOkResponse({
    type: MessageDto,
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
  listMessages(
    @CurrentAuth() auth: AuthContext,
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.chatsService.listMessages(chatId, auth.userId, query)
  }

  @Post('chats/:chatId/messages')
  @ApiOperation({
    summary: 'Отправить сообщение',
  })
  @ApiCreatedResponse({
    type: MessageDto,
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
  createMessage(
    @CurrentAuth() auth: AuthContext,
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
    @Body() payload: MessageCreateRequestDto,
  ) {
    return this.chatsService.createMessage(chatId, auth.userId, payload)
  }

  @Patch('chats/:chatId/messages/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Отредактировать сообщение',
  })
  @ApiOkResponse({
    type: MessageDto,
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
  updateMessage(
    @CurrentAuth() auth: AuthContext,
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
    @Body() payload: MessageUpdateRequestDto,
  ) {
    return this.chatsService.updateMessage(chatId, messageId, auth.userId, payload)
  }

  @Delete('chats/:chatId/messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить сообщение',
    description: 'Выполняет мягкое удаление сообщения.',
  })
  @ApiNoContentResponse({
    description: 'Сообщение успешно удалено.',
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
  async deleteMessage(
    @CurrentAuth() auth: AuthContext,
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
    @Param('messageId', new ParseUUIDPipe({ version: '4' })) messageId: string,
  ) {
    await this.chatsService.deleteMessage(chatId, messageId, auth.userId)
  }
}
