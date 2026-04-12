import { Injectable } from '@nestjs/common'
import { sign, verify, type JwtPayload, type SignOptions } from 'jsonwebtoken'
import { AppConfigService } from '../config/app-config.service'

export type TokenPayload = JwtPayload & {
  sub: string
  sessionId?: string
}

@Injectable()
export class TokenService {
  constructor(private readonly config: AppConfigService) {}

  generateAccessToken(payload: TokenPayload) {
    return this.signToken(
      payload,
      this.config.jwtAccessSecret,
      this.config.jwtAccessTtlSeconds,
    )
  }

  generateRefreshToken(payload: TokenPayload) {
    return this.signToken(
      payload,
      this.config.jwtRefreshSecret,
      this.config.jwtRefreshTtlSeconds,
    )
  }

  verifyAccessToken(token: string) {
    return this.verifyToken(token, this.config.jwtAccessSecret)
  }

  verifyRefreshToken(token: string) {
    return this.verifyToken(token, this.config.jwtRefreshSecret)
  }

  private signToken(payload: TokenPayload, secret: string, expiresIn: number) {
    const { sub, ...claims } = payload
    const options: SignOptions = {
      algorithm: 'HS256',
      audience: this.config.jwtAudience,
      issuer: this.config.jwtIssuer,
      expiresIn,
      subject: sub,
    }

    return sign(claims, secret, options)
  }

  private verifyToken(token: string, secret: string) {
    return verify(token, secret, {
      algorithms: ['HS256'],
      audience: this.config.jwtAudience,
      issuer: this.config.jwtIssuer,
    }) as TokenPayload
  }
}
