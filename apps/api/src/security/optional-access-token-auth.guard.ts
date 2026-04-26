import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { AuthenticatedRequest } from './auth.types'
import { SessionAuthService } from './session-auth.service'

@Injectable()
export class OptionalAccessTokenAuthGuard implements CanActivate {
  constructor(@Inject(SessionAuthService) private readonly sessionAuthService: SessionAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.headers.authorization) {
      return true
    }

    try {
      const accessToken = this.sessionAuthService.extractAccessTokenFromAuthorizationHeader(
        request.headers.authorization,
      )

      request.auth = await this.sessionAuthService.authenticateAccessToken(accessToken)
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw error
      }

      request.auth = undefined
    }

    return true
  }
}
