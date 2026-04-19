import type { components } from '../../../shared/api/generated/openapi'
import { apiClient } from '../../../shared/api/client/http'

type ErrorResponse = components['schemas']['ErrorResponse']

type RawPublicProfile = components['schemas']['PublicUser']

export type PublicProfile = Omit<RawPublicProfile, 'bio' | 'avatarFileId' | 'avatarUrl'> & {
  bio: string | null
  avatarFileId: string | null
  avatarUrl: string | null
}

export class ProfileApiError extends Error {
  readonly statusCode: number
  readonly errors: string[]

  constructor(error: ErrorResponse | undefined, statusCode: number, fallbackMessage: string) {
    super(error?.message ?? fallbackMessage)
    this.name = 'ProfileApiError'
    this.statusCode = error?.statusCode ?? statusCode
    this.errors = error?.errors ?? []
  }
}

export async function getPublicProfile(userId: string) {
  const { data, error, response } = await apiClient.GET('/users/{userId}', {
    params: {
      path: {
        userId,
      },
    },
  })

  if (data) {
    return normalizePublicProfile(data as RawPublicProfile)
  }

  throw new ProfileApiError(error, response.status, 'Не удалось загрузить публичный профиль')
}

export function getProfileErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ProfileApiError) {
    return error.errors[0] ?? error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

function normalizePublicProfile(profile: RawPublicProfile): PublicProfile {
  return {
    ...profile,
    bio: normalizeNullableString(profile.bio),
    avatarFileId: normalizeNullableString(profile.avatarFileId),
    avatarUrl: normalizeNullableString(profile.avatarUrl),
  }
}

function normalizeNullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}
