import type { Request } from 'express'
import type { TokenPayload } from './token.service'

export type AuthContext = {
  userId: string
  sessionId: string
  accessTokenPayload: TokenPayload
}

export type AuthenticatedRequest = Request & {
  auth?: AuthContext
}
