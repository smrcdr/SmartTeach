import { Module } from '@nestjs/common'
import { ChatGateway } from './chat.gateway'
import { ChatRealtimePublisher } from './chat-realtime.publisher'
import { ChatsController } from './chats.controller'
import { ChatsService } from './chats.service'

@Module({
  controllers: [ChatsController],
  providers: [ChatsService, ChatRealtimePublisher, ChatGateway],
})
export class ChatsModule {}
