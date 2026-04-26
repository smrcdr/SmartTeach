import type { DemoGroup } from '@/app/demo/types'
import { apiRequest } from '@/shared/api/http'

export type GroupListQuery = {
  search?: string
  mine?: boolean
}

function toQuery(query: GroupListQuery = {}) {
  const params = new URLSearchParams()

  if (query.search) {
    params.set('search', query.search)
  }

  if (query.mine) {
    params.set('membership', 'mine')
  }

  const value = params.toString()
  return value ? `?${value}` : ''
}

export function listGroups(query?: GroupListQuery, token?: string | null) {
  return apiRequest<DemoGroup[]>(`/groups${toQuery(query)}`, { token })
}

export function getGroup(groupId: string, token?: string | null) {
  return apiRequest<DemoGroup>(`/groups/${groupId}`, { token })
}

export function createGroup(payload: Partial<DemoGroup>, token?: string | null) {
  return apiRequest<DemoGroup>('/groups', {
    method: 'POST',
    token,
    body: JSON.stringify(payload)
  })
}

export function joinGroup(groupId: string, token?: string | null) {
  return apiRequest<DemoGroup>(`/groups/${groupId}/join`, {
    method: 'POST',
    token
  })
}
