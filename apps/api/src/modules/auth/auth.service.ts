import { randomUUID } from 'node:crypto'
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { AppConfigService } from '../../config/app-config.service'
import { PrismaService } from '../../database/prisma/prisma.service'
import { PasswordHashService } from '../../security/password-hash.service'
import type { AuthContext } from '../../security/auth.types'
import { TokenHashService } from '../../security/token-hash.service'
import { TokenService } from '../../security/token.service'
import { UsersService } from '../users/users.service'
import { LoginRequestDto } from './dto/login-request.dto'
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto'
import { RegisterRequestDto } from './dto/register-request.dto'
import { authUserSelect, mapUserToDto, userSelect } from '../users/users.mapper'

export type SessionMetadata = {
  userAgent: string | null
  ipAddress: string | null
}

type SessionTokenPair = {
  accessToken: string
  refreshToken: string
  sessionId: string
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(AppConfigService)
    private readonly appConfigService: AppConfigService,
    @Inject(PrismaService)
    private readonly prismaService: PrismaService,
    @Inject(PasswordHashService)
    private readonly passwordHashService: PasswordHashService,
    @Inject(TokenHashService)
    private readonly tokenHashService: TokenHashService,
    @Inject(TokenService)
    private readonly tokenService: TokenService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  async register(payload: RegisterRequestDto, metadata: SessionMetadata) {
    try {
      const passwordHash = await this.passwordHashService.hash(payload.password)
      const authSession = await this.prismaService.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: payload.email,
            passwordHash,
            displayName: payload.displayName,
          },
          select: userSelect,
        })
        const tokenPair = await this.createSession(tx, user.id, metadata)

        return {
          user,
          ...tokenPair,
        }
      })

      return {
        user: mapUserToDto(authSession.user),
        accessToken: authSession.accessToken,
        refreshToken: authSession.refreshToken,
        sessionId: authSession.sessionId,
      }
    } catch (error) {
      this.rethrowKnownErrors(error)
      throw error
    }
  }

  async login(payload: LoginRequestDto, metadata: SessionMetadata) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: payload.email,
      },
      select: authUserSelect,
    })

    if (!user) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const isPasswordValid = await this.passwordHashService.compare(
      payload.password,
      user.passwordHash,
    )

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const tokenPair = await this.createSession(this.prismaService, user.id, metadata)

    return {
      user: mapUserToDto(user),
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      sessionId: tokenPair.sessionId,
    }
  }

  async refresh(payload: RefreshTokenRequestDto) {
    const session = await this.validateRefreshToken(payload.refreshToken)
    const nextRefreshToken = this.generateRefreshToken(
      session.userId,
      session.sessionId,
    )
    const nextAccessToken = this.generateAccessToken(
      session.userId,
      session.sessionId,
    )

    await this.prismaService.session.update({
      where: {
        id: session.sessionId,
      },
      data: {
        refreshTokenHash: this.tokenHashService.hash(nextRefreshToken),
        expiresAt: this.buildRefreshExpiryDate(),
        lastUsedAt: new Date(),
      },
    })

    return {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      sessionId: session.sessionId,
    }
  }

  async logout(auth: AuthContext, payload: RefreshTokenRequestDto) {
    const session = await this.validateRefreshToken(payload.refreshToken)

    if (session.userId !== auth.userId || session.sessionId !== auth.sessionId) {
      throw new UnauthorizedException()
    }

    await this.prismaService.session.update({
      where: {
        id: session.sessionId,
      },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    })
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.getCurrentUserOrThrow(userId)

    return mapUserToDto(user)
  }

  private async createSession(
    client: PrismaService | Prisma.TransactionClient,
    userId: string,
    metadata: SessionMetadata,
  ): Promise<SessionTokenPair> {
    const sessionId = randomUUID()
    const accessToken = this.generateAccessToken(userId, sessionId)
    const refreshToken = this.generateRefreshToken(userId, sessionId)

    await client.session.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash: this.tokenHashService.hash(refreshToken),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        lastUsedAt: new Date(),
        expiresAt: this.buildRefreshExpiryDate(),
      },
    })

    return {
      accessToken,
      refreshToken,
      sessionId,
    }
  }

  private async validateRefreshToken(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken)

    if (typeof payload.sub !== 'string' || typeof payload.sessionId !== 'string') {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const session = await this.prismaService.session.findUnique({
      where: {
        id: payload.sessionId,
      },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
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

    const isTokenValid = this.tokenHashService.matches(
      refreshToken,
      session.refreshTokenHash,
    )

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    return {
      userId: session.userId,
      sessionId: session.id,
    }
  }

  private verifyRefreshToken(refreshToken: string) {
    try {
      return this.tokenService.verifyRefreshToken(refreshToken)
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  private buildRefreshExpiryDate() {
    return new Date(
      Date.now() + this.appConfigService.jwtRefreshTtlSeconds * 1000,
    )
  }

  private generateAccessToken(userId: string, sessionId: string) {
    return this.tokenService.generateAccessToken({
      sub: userId,
      sessionId,
      jti: randomUUID(),
    })
  }

  private generateRefreshToken(userId: string, sessionId: string) {
    return this.tokenService.generateRefreshToken({
      sub: userId,
      sessionId,
      jti: randomUUID(),
    })
  }

  private rethrowKnownErrors(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('User with this email already exists')
    }
  }
}
