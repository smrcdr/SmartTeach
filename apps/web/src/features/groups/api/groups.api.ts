import type { components, paths } from '../../../shared/api/generated/openapi'
import { apiClient } from '../../../shared/api/client/http'

export type Group = components['schemas']['Group']
export type GroupMember = components['schemas']['GroupMember']
export type GroupJoinRequest = components['schemas']['GroupJoinRequest']
export type GroupSettings = components['schemas']['GroupSettings']
export type ScheduleEntry = components['schemas']['ScheduleEntry']
export type CreateGroupPayload = components['schemas']['CreateGroupRequest']
export type UpdateGroupPayload = components['schemas']['UpdateGroupRequest']
export type UpdateGroupMemberPayload = components['schemas']['UpdateGroupMemberRequest']
export type JoinRequestDecisionPayload = components['schemas']['JoinRequestDecisionRequest']
export type UpdateGroupSettingsPayload = components['schemas']['UpdateGroupSettingsRequest']
export type GroupAccessMode = Group['accessMode']
export type GroupStatus = Group['status']
export type ListGroupsQuery = NonNullable<paths['/groups']['get']['parameters']['query']>
export type ListGroupScheduleQuery = NonNullable<paths['/groups/{groupId}/schedule']['get']['parameters']['query']>
export type ListGroupJoinRequestsQuery = NonNullable<
  paths['/groups/{groupId}/join-requests']['get']['parameters']['query']
>

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

export async function updateGroup(groupId: string, payload: UpdateGroupPayload) {
  const { data, error, response } = await apiClient.PATCH('/groups/{groupId}', {
    params: {
      path: {
        groupId,
      },
    },
    body: payload,
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось обновить группу')
}

export async function deleteGroup(groupId: string) {
  const { error, response } = await apiClient.DELETE('/groups/{groupId}', {
    params: {
      path: {
        groupId,
      },
    },
  })

  if (response.ok) {
    return
  }

  throw new GroupsApiError(error, response.status, 'Не удалось удалить группу')
}

export async function joinGroup(groupId: string) {
  const { data, error, response } = await apiClient.POST('/groups/{groupId}/join', {
    params: {
      path: {
        groupId,
      },
    },
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось вступить в группу')
}

export async function leaveGroup(groupId: string) {
  const { error, response } = await apiClient.POST('/groups/{groupId}/leave', {
    params: {
      path: {
        groupId,
      },
    },
  })

  if (response.ok) {
    return
  }

  throw new GroupsApiError(error, response.status, 'Не удалось покинуть группу')
}

export async function listGroupMembers(groupId: string) {
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/members', {
    params: {
      path: {
        groupId,
      },
    },
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось загрузить участников группы')
}

export async function updateGroupMemberRole(groupId: string, userId: string, payload: UpdateGroupMemberPayload) {
  const { data, error, response } = await apiClient.PATCH('/groups/{groupId}/members/{userId}', {
    params: {
      path: {
        groupId,
        userId,
      },
    },
    body: payload,
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось обновить роль участника')
}

export async function removeGroupMember(groupId: string, userId: string) {
  const { error, response } = await apiClient.DELETE('/groups/{groupId}/members/{userId}', {
    params: {
      path: {
        groupId,
        userId,
      },
    },
  })

  if (response.ok) {
    return
  }

  throw new GroupsApiError(error, response.status, 'Не удалось удалить участника из группы')
}

export async function getGroupSettings(groupId: string) {
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/settings', {
    params: {
      path: {
        groupId,
      },
    },
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось загрузить настройки группы')
}

export async function updateGroupSettings(groupId: string, payload: UpdateGroupSettingsPayload) {
  const { data, error, response } = await apiClient.PATCH('/groups/{groupId}/settings', {
    params: {
      path: {
        groupId,
      },
    },
    body: payload,
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось обновить настройки группы')
}

export async function listGroupSchedule(groupId: string, query: Partial<ListGroupScheduleQuery> = {}) {
  const normalizedQuery = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<ListGroupScheduleQuery>

  const { data, error, response } = await apiClient.GET('/groups/{groupId}/schedule', {
    params: {
      path: {
        groupId,
      },
      query: normalizedQuery,
    },
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось загрузить календарь группы')
}

export async function listGroupJoinRequests(groupId: string, query: Partial<ListGroupJoinRequestsQuery> = {}) {
  const normalizedQuery = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as Partial<ListGroupJoinRequestsQuery>

  const { data, error, response } = await apiClient.GET('/groups/{groupId}/join-requests', {
    params: {
      path: {
        groupId,
      },
      query: normalizedQuery,
    },
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось загрузить заявки на вступление')
}

export async function createJoinRequest(groupId: string) {
  const { data, error, response } = await apiClient.POST('/groups/{groupId}/join-requests', {
    params: {
      path: {
        groupId,
      },
    },
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось отправить заявку на вступление')
}

export async function decideGroupJoinRequest(
  groupId: string,
  requestId: string,
  payload: JoinRequestDecisionPayload,
) {
  const { data, error, response } = await apiClient.PATCH('/groups/{groupId}/join-requests/{requestId}', {
    params: {
      path: {
        groupId,
        requestId,
      },
    },
    body: payload,
  })

  if (data) {
    return data
  }

  throw new GroupsApiError(error, response.status, 'Не удалось обработать заявку на вступление')
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

export function isAlreadyGroupMemberError(error: unknown) {
  return error instanceof GroupsApiError && error.statusCode === 409 && error.message === 'User is already a member of this group'
}

export function isPendingJoinRequestError(error: unknown) {
  return (
    error instanceof GroupsApiError &&
    error.statusCode === 409 &&
    error.message === 'You already have a pending join request for this group'
  )
}
