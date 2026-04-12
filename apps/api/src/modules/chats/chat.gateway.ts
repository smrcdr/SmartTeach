import { HttpException, Inject, Injectable, Logger } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { PrismaService } from '../../database/prisma/prisma.service'
import type { AuthContext } from '../../security/auth.types'
import { TokenService } from '../../security/token.service'
import { ChatRealtimePublisher } from './chat-realtime.publisher'
import { subscribeToChatSchema } from './chats.schemas'
import { ChatsService } from './chats.service'
import type { Server, Socket } from 'socket.io'

type ChatSocketData = {
  auth?: AuthContext
}

type ChatSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, ChatSocketData>

type ChatSubscriptionResponse =
  | {
      ok: true
      chatId: string
    }
  | {
      ok: false
      error: string
    }

@Injectable()
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.WEB_URL ?? true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit {
  private readonly logger = new Logger(ChatGateway.name)

  constructor(
    @Inject(ChatsService) private readonly chatsService: ChatsService,
    @Inject(ChatRealtimePublisher)
    private readonly realtimePublisher: ChatRealtimePublisher,
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject(PrismaService) private readonly prismaService: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.realtimePublisher.attachServer(server)
    server.use((client, next) => {
      void this.authenticateClient(client as ChatSocket)
        .then(() => next())
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Unauthorized'

          this.logger.warn(`Rejected chat websocket connection: ${message}`)
          next(new Error(message))
        })
    })
  }

  @SubscribeMessage('chat.subscribe')
  async subscribeToChat(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() payload: unknown,
  ): Promise<ChatSubscriptionResponse> {
    const parsedPayload = subscribeToChatSchema.safeParse(payload)

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: 'chatId must be a valid UUID',
      }
    }

    const auth = client.data.auth

    if (!auth) {
      return {
        ok: false,
        error: 'Unauthorized',
      }
    }

    try {
      await this.chatsService.ensureChatAccess(parsedPayload.data.chatId, auth.userId)
      await client.join(this.realtimePublisher.getChatRoom(parsedPayload.data.chatId))

      return {
        ok: true,
        chatId: parsedPayload.data.chatId,
      }
    } catch (error) {
      return {
        ok: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  private async authenticateClient(client: ChatSocket) {
    const accessToken = this.extractAccessToken(client)
    const payload = this.verifyAccessToken(accessToken)

    if (typeof payload.sub !== 'string' || typeof payload.sessionId !== 'string') {
      throw new Error('Invalid access token')
    }

    const session = await this.prismaService.session.findUnique({
      where: {
        id: payload.sessionId,
      },
      select: {
        userId: true,
        expiresAt: true,
        revokedAt: true,
      },
    })

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date()
    ) {
      throw new Error('Unauthorized')
    }

    client.data.auth = {
      userId: payload.sub,
      sessionId: payload.sessionId,
      accessTokenPayload: payload,
    }
  }

  private extractAccessToken(client: ChatSocket) {
    const handshakeToken =
      typeof client.handshake.auth?.token === 'string' ? client.handshake.auth.token : undefined

    if (handshakeToken) {
      return handshakeToken
    }

    const authorizationHeader =
      typeof client.handshake.headers.authorization === 'string'
        ? client.handshake.headers.authorization
        : undefined

    if (!authorizationHeader) {
      throw new Error('Missing access token')
    }

    const [scheme, token] = authorizationHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
      throw new Error('Invalid authorization header')
    }

    return token
  }

  private verifyAccessToken(accessToken: string) {
    try {
      return this.tokenService.verifyAccessToken(accessToken)
    } catch {
      throw new Error('Invalid access token')
    }
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof HttpException) {
      const response = error.getResponse()

      if (typeof response === 'string') {
        return response
      }

      if (
        response &&
        typeof response === 'object' &&
        'message' in response &&
        typeof response.message === 'string'
      ) {
        return response.message
      }
    }

    if (error instanceof Error) {
      return error.message
    }

    return 'Unknown websocket error'
  }
}
