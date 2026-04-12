import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../database/prisma/prisma.service'
import type { AuthContext } from './auth.types'
import { TokenService } from './token.service'

@Injectable()
export class SessionAuthService {
  constructor(
    @Inject(PrismaService)
    private readonly prismaService: PrismaService,
    @Inject(TokenService)
    private readonly tokenService: TokenService,
  ) {}

  extractAccessTokenFromAuthorizationHeader(authorizationHeader?: string) {
    if (!authorizationHeader) {
      throw new UnauthorizedException()
    }

    const [scheme, token] = authorizationHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException()
    }

    return token
  }

  async authenticateAccessToken(accessToken: string): Promise<AuthContext> {
    const payload = this.verifyAccessToken(accessToken)

    if (typeof payload.sub !== 'string' || typeof payload.sessionId !== 'string') {
      throw new UnauthorizedException('Invalid access token')
    }

    await this.assertActiveSession(payload.sub, payload.sessionId)

    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
      accessTokenPayload: payload,
    }
  }

  async validateAuthContext(auth: AuthContext): Promise<AuthContext> {
    if (
      typeof auth.userId !== 'string' ||
      typeof auth.sessionId !== 'string' ||
      typeof auth.accessTokenPayload.sub !== 'string' ||
      typeof auth.accessTokenPayload.sessionId !== 'string' ||
      auth.accessTokenPayload.sub !== auth.userId ||
      auth.accessTokenPayload.sessionId !== auth.sessionId
    ) {
      throw new UnauthorizedException('Invalid access token')
    }

    const expiresAt = auth.accessTokenPayload.exp

    if (typeof expiresAt !== 'number' || expiresAt * 1000 <= Date.now()) {
      throw new UnauthorizedException('Invalid access token')
    }

    await this.assertActiveSession(auth.userId, auth.sessionId)

    return auth
  }

  private verifyAccessToken(accessToken: string) {
    try {
      return this.tokenService.verifyAccessToken(accessToken)
    } catch {
      throw new UnauthorizedException('Invalid access token')
    }
  }

  private async assertActiveSession(userId: string, sessionId: string) {
    const session = await this.prismaService.session.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        userId: true,
        expiresAt: true,
        revokedAt: true,
      },
    })

    if (
      !session ||
      session.userId !== userId ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException()
    }
  }
}
