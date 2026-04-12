import { HttpException, Inject, Injectable, Logger } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import type { AuthContext } from '../../security/auth.types'
import { SessionAuthService } from '../../security/session-auth.service'
import { ChatRealtimePublisher } from './chat-realtime.publisher'
import { subscribeToChatSchema } from './chats.schemas'
import { ChatsService } from './chats.service'
import type { Namespace, Socket } from 'socket.io'

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
    @Inject(SessionAuthService)
    private readonly sessionAuthService: SessionAuthService,
  ) {}

  afterInit(server: Namespace) {
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

    let auth: AuthContext

    try {
      auth = await this.revalidateClientAuth(client)
    } catch {
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
      client.leave(this.realtimePublisher.getChatRoom(parsedPayload.data.chatId))

      return {
        ok: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  private async authenticateClient(client: ChatSocket) {
    const accessToken = this.extractAccessToken(client)
    client.data.auth = await this.sessionAuthService.authenticateAccessToken(accessToken)
  }

  private async revalidateClientAuth(client: ChatSocket) {
    const auth = client.data.auth

    if (!auth) {
      throw new Error('Unauthorized')
    }

    try {
      const validatedAuth = await this.sessionAuthService.validateAuthContext(auth)

      client.data.auth = validatedAuth

      return validatedAuth
    } catch {
      this.clearClientAuthorization(client)

      throw new Error('Unauthorized')
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

    try {
      return this.sessionAuthService.extractAccessTokenFromAuthorizationHeader(authorizationHeader)
    } catch {
      throw new Error('Invalid authorization header')
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

  private clearClientAuthorization(client: ChatSocket) {
    client.data.auth = undefined

    for (const room of client.rooms) {
      if (room !== client.id) {
        client.leave(room)
      }
    }
  }
}
