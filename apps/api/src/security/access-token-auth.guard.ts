import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from '../database/prisma/prisma.service'
import type { AuthenticatedRequest } from './auth.types'
import { TokenService } from './token.service'

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(
    @Inject(PrismaService)
    private readonly prismaService: PrismaService,
    @Inject(TokenService)
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const accessToken = this.extractAccessToken(request.headers.authorization)
    const payload = this.verifyAccessToken(accessToken)

    if (typeof payload.sub !== 'string' || typeof payload.sessionId !== 'string') {
      throw new UnauthorizedException('Invalid access token')
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
      throw new UnauthorizedException()
    }

    request.auth = {
      userId: payload.sub,
      sessionId: payload.sessionId,
      accessTokenPayload: payload,
    }

    return true
  }

  private extractAccessToken(authorizationHeader?: string) {
    if (!authorizationHeader) {
      throw new UnauthorizedException()
    }

    const [scheme, token] = authorizationHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException()
    }

    return token
  }

  private verifyAccessToken(accessToken: string) {
    try {
      return this.tokenService.verifyAccessToken(accessToken)
    } catch {
      throw new UnauthorizedException('Invalid access token')
    }
  }
}
