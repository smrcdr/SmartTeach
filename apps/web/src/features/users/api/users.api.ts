import { apiRequest } from '@/shared/api/http'

export type PublicUser = {
  id: string
  displayName: string
  bio: string | null
  avatarFileId?: string | null
  avatarUrl?: string | null
}

export type CurrentUser = PublicUser & {
  email: string
  createdAt?: string
  updatedAt?: string
}

export type UpdateMyProfilePayload = {
  displayName?: string
  bio?: string
  avatarFileId?: string | null
}

export function getUser(userId: string, token?: string | null) {
  return apiRequest<PublicUser>(`/users/${userId}`, { token })
}

export function updateMyProfile(payload: UpdateMyProfilePayload, token?: string | null) {
  return apiRequest<CurrentUser>('/users/me', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload)
  })
}
