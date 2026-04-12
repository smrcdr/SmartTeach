import { Injectable } from '@nestjs/common'
import type { Server } from 'socket.io'
import { MessageDto } from './dto/message.dto'

const CHAT_ROOM_PREFIX = 'chat:'

@Injectable()
export class ChatRealtimePublisher {
  private server?: Server

  attachServer(server: Server) {
    this.server = server
  }

  emitMessageCreated(message: MessageDto) {
    this.emitToChat(message.chatId, 'chat.message.created', message)
  }

  emitMessageUpdated(message: MessageDto) {
    this.emitToChat(message.chatId, 'chat.message.updated', message)
  }

  emitMessageDeleted(message: MessageDto) {
    this.emitToChat(message.chatId, 'chat.message.deleted', message)
  }

  getChatRoom(chatId: string) {
    return `${CHAT_ROOM_PREFIX}${chatId}`
  }

  private emitToChat(chatId: string, event: string, payload: MessageDto) {
    this.server?.to(this.getChatRoom(chatId)).emit(event, payload)
  }
}
