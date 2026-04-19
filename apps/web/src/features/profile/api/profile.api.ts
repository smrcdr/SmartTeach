import type { components, paths } from '../../../shared/api/generated/openapi'
import { apiClient } from '../../../shared/api/client/http'
import {
  normalizePublicProfile,
  normalizeUserProfile,
  type PublicProfile,
  type UserProfile,
} from '../../../shared/lib/user-profile'

type ErrorResponse = components['schemas']['ErrorResponse']
type RawPublicProfile = components['schemas']['PublicUser']
type RawUserProfile = components['schemas']['User']
type UploadFileBody = paths['/files']['post']['requestBody']['content']['multipart/form-data']
type UpdateMyProfileRequestBody = paths['/users/me']['patch']['requestBody']['content']['application/json']

export type ProfileFile = components['schemas']['FileObject']
export type UpdateMyProfilePayload = {
  displayName?: string
  bio?: string
  avatarFileId?: string | null
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

export async function updateMyProfile(payload: UpdateMyProfilePayload) {
  const { data, error, response } = await apiClient.PATCH('/users/me', {
    body: payload as UpdateMyProfileRequestBody,
  })

  if (data) {
    return normalizeUserProfile(data as RawUserProfile)
  }

  throw new ProfileApiError(error, response.status, 'Не удалось обновить профиль')
}

export async function uploadProfileAvatar(file: File) {
  const formData = new FormData()

  formData.set('file', file)
  formData.set('folder', 'avatars')

  const { data, error, response } = await apiClient.POST('/files', {
    body: formData as unknown as UploadFileBody,
  })

  if (data) {
    return data
  }

  throw new ProfileApiError(error, response.status, 'Не удалось загрузить аватар')
}

export async function deleteUploadedProfileFile(fileId: string) {
  const { error, response } = await apiClient.DELETE('/files/{fileId}', {
    params: {
      path: {
        fileId,
      },
    },
  })

  if (response.ok) {
    return
  }

  throw new ProfileApiError(error, response.status, 'Не удалось удалить загруженный файл')
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
