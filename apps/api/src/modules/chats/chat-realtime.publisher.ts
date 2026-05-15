import { Inject, Injectable, Logger } from '@nestjs/common'
import { ChatType } from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import type { AuthContext } from '../../security/auth.types'
import { AuthorizationService } from '../../security/authorization.service'
import { SessionAuthService } from '../../security/session-auth.service'
import { MessageDto } from './dto/message.dto'
import type { Namespace, Socket } from 'socket.io'

const CHAT_ROOM_PREFIX = 'chat:'

type ChatSocketData = {
  auth?: AuthContext
}

type ChatSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, ChatSocketData>

@Injectable()
export class ChatRealtimePublisher {
  private readonly logger = new Logger(ChatRealtimePublisher.name)
  private server?: Namespace

  constructor(
    @Inject(AuthorizationService)
    private readonly authorizationService: AuthorizationService,
    @Inject(PrismaService)
    private readonly prismaService: PrismaService,
    @Inject(SessionAuthService)
    private readonly sessionAuthService: SessionAuthService,
  ) {}

  attachServer(server: Namespace) {
    this.server = server
  }

  emitMessageCreated(message: MessageDto) {
    void this.emitToChat(message.chatId, 'chat.message.created', message)
  }

  emitMessageUpdated(message: MessageDto) {
    void this.emitToChat(message.chatId, 'chat.message.updated', message)
  }

  emitMessageDeleted(message: MessageDto) {
    void this.emitToChat(message.chatId, 'chat.message.deleted', message)
  }

  getChatRoom(chatId: string) {
    return `${CHAT_ROOM_PREFIX}${chatId}`
  }

  private async emitToChat(chatId: string, event: string, payload: MessageDto) {
    if (!this.server) {
      return
    }

    const roomName = this.getChatRoom(chatId)
    const socketIds = await this.server.in(roomName).allSockets()

    for (const socketId of socketIds) {
      const socket = this.server.sockets.get(socketId) as ChatSocket | undefined

      if (!socket) {
        continue
      }

      const canReceiveEvent = await this.canReceiveChatEvent(socket, chatId, roomName)

      if (canReceiveEvent) {
        ;(socket as Socket).emit(event, payload)
      }
    }
  }

  private async canReceiveChatEvent(socket: ChatSocket, chatId: string, roomName: string) {
    const auth = socket.data.auth

    if (!auth) {
      socket.leave(roomName)

      return false
    }

    try {
      socket.data.auth = await this.sessionAuthService.validateAuthContext(auth)
    } catch {
      this.clearClientAuthorization(socket)

      return false
    }

    try {
      await this.assertChatAccess(chatId, socket.data.auth.userId)

      return true
    } catch (error) {
      socket.leave(roomName)

      if (error instanceof Error) {
        this.logger.debug(`Removed socket ${socket.id} from ${roomName}: ${error.message}`)
      }

      return false
    }
  }

  private async assertChatAccess(chatId: string, userId: string) {
    const chat = await this.prismaService.chat.findUnique({
      where: {
        id: chatId,
      },
      select: {
        id: true,
        chatType: true,
        groupId: true,
      },
    })

    if (!chat) {
      throw new Error('Chat not found')
    }

    if (chat.chatType === ChatType.GROUP) {
      if (!chat.groupId) {
        throw new Error('Chat not found')
      }

      await this.authorizationService.authorizeGroupAccess(chat.groupId, userId, {
        requiredFeature: 'chatEnabled',
        featureErrorMessage: 'Chats module is disabled for this group',
      })

      return
    }

    const membership = await this.prismaService.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
      select: {
        chatId: true,
      },
    })

    if (!membership) {
      throw new Error('You are not a member of this chat')
    }
  }

  private clearClientAuthorization(socket: ChatSocket) {
    socket.data.auth = undefined

    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.leave(room)
      }
    }
  }
}
