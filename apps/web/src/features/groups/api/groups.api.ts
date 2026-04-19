import type { components, paths } from '../../../shared/api/generated/openapi'
import { apiClient } from '../../../shared/api/client/http'

export type Group = components['schemas']['Group']
export type CreateGroupPayload = components['schemas']['CreateGroupRequest']
export type GroupAccessMode = Group['accessMode']
export type GroupStatus = Group['status']
export type ListGroupsQuery = NonNullable<paths['/groups']['get']['parameters']['query']>

type ErrorResponse = components['schemas']['ErrorResponse']

export class GroupsApiError extends Error {
  readonly statusCode: number
  readonly errors: string[]

  constructor(error: ErrorResponse | undefined, statusCode: number, fallbackMessage: string) {
    super(error?.message ?? fallbackMessage)
    this.name = 'GroupsApiError'
    this.statusCode = error?.statusCode ?? statusCode
    this.errors = error?.errors ?? []
  }
}

export async function listGroups(query: Partial<ListGroupsQuery> = {}) {
  const { data, error, response } = await apiClient.GET('/groups', {
    params: {
      query,
    },
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось загрузить список групп')
}

export async function createGroup(payload: CreateGroupPayload) {
  const { data, error, response } = await apiClient.POST('/groups', {
    body: payload,
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось создать группу')
}

export async function getGroup(groupId: string) {
  const { data, error, response } = await apiClient.GET('/groups/{groupId}', {
    params: {
      path: {
        groupId,
      },
    },
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось загрузить группу')
}

export async function lookupGroupByCode(code: string) {
  const normalizedCode = code.trim().toUpperCase()
  const { data, error, response } = await apiClient.GET('/groups/by-code/{code}', {
    params: {
      path: {
        code: normalizedCode,
      },
    },
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось найти группу по коду')
}

export function getGroupsErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof GroupsApiError) {
    return error.errors[0] ?? error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}
