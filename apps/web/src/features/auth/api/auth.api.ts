import { apiRequest } from '@/shared/api/http'

export type AuthUser = {
  id: string
  email: string
  displayName: string
  bio?: string | null
  avatarUrl?: string | null
}

export type AuthSession = {
  user: AuthUser
  accessToken: string
  sessionId: string
}

export type TokenPair = {
  accessToken: string
  sessionId: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = LoginPayload & {
  displayName: string
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function getMe(token: string) {
  return apiRequest<AuthUser>('/auth/me', { token })
}

export function refresh() {
  return apiRequest<TokenPair>('/auth/refresh', {
    method: 'POST'
  })
}

export function logout(token: string | null) {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    token
  })
}
