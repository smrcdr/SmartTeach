import { apiRequest } from '@/shared/api/http'

export type PublicUser = {
  id: string
  displayName: string
  bio: string | null
  avatarFileId?: string | null
  avatarUrl?: string | null
}

export function getUser(userId: string, token?: string | null) {
  return apiRequest<PublicUser>(`/users/${userId}`, { token })
}
