import { UnauthorizedException, createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { AuthenticatedRequest } from './auth.types'

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.auth) {
      throw new UnauthorizedException('Authentication context is missing')
    }

    return request.auth
  },
)

export const CurrentOptionalAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    return request.auth ?? null
  },
)
