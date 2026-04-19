import type { components } from '../../../shared/api/generated/openapi'
import { apiClient, requestSessionRefresh, type AccessSession } from '../../../shared/api/client/http'
import { normalizeUserProfile, type UserProfile } from '../../../shared/lib/user-profile'

export type LoginPayload = components['schemas']['LoginRequest']
export type RegisterPayload = components['schemas']['RegisterRequest']
export type AuthUser = UserProfile

type ErrorResponse = components['schemas']['ErrorResponse']

export class AuthApiError extends Error {
  readonly statusCode: number
  readonly errors: string[]

  constructor(error: ErrorResponse | undefined, statusCode: number, fallbackMessage: string) {
    super(error?.message ?? fallbackMessage)
    this.name = 'AuthApiError'
    this.statusCode = error?.statusCode ?? statusCode
    this.errors = error?.errors ?? []
  }
}

export async function login(payload: LoginPayload) {
  const { data, error, response } = await apiClient.POST('/auth/login', {
    body: payload,
  })

  if (data) {
    return data
  }

  throw new AuthApiError(error, response.status, 'Не удалось войти в систему')
}

export async function register(payload: RegisterPayload) {
  const { data, error, response } = await apiClient.POST('/auth/register', {
    body: payload,
  })

  if (data) {
    return data
  }

  throw new AuthApiError(error, response.status, 'Не удалось зарегистрировать аккаунт')
}

export async function logout() {
  const { response } = await apiClient.POST('/auth/logout')

  if (!response.ok) {
    throw new AuthApiError(undefined, response.status, 'Не удалось завершить сессию')
  }
}

export async function getCurrentUser() {
  const { data, error, response } = await apiClient.GET('/auth/me')

  if (data) {
    return normalizeUserProfile(data)
  }

  throw new AuthApiError(error, response.status, 'Не удалось загрузить текущего пользователя')
}

export async function refreshSession(): Promise<AccessSession | null> {
  return requestSessionRefresh()
}

export function getAuthErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthApiError) {
    return error.errors[0] ?? error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}
