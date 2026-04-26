import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAssignment,
  createGroup,
  createJoinRequest,
  createLesson,
  createScheduleEvent,
  decideJoinRequest,
  getGroupByCode,
  updateGroup,
  updateGroupSettings
} from './groups.api'

describe('groups api', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads groups by code through the backend lookup endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'group-id' }), { status: 200 })
    )

    await getGroupByCode('web 101', 'access-token')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/groups/by-code/web%20101', expect.objectContaining({
      credentials: 'include',
      headers: expect.any(Headers)
    }))
  })

  it('creates groups through the backend create endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'group-id' }), { status: 201 })
    )
    const payload = {
      name: 'Physics 101',
      description: 'Механика и задачи',
      accessMode: 'BY_REQUEST' as const,
      settings: {
        chatEnabled: true,
        lessonsEnabled: true,
        assignmentsEnabled: true,
        scheduleEnabled: false
      }
    }

    await createGroup(payload, 'access-token')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/groups', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload)
    }))
  })

  it('updates group details through the backend update endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'group-id' }), { status: 200 })
    )
    const payload = {
      name: 'Updated group',
      description: '',
      accessMode: 'CLOSED' as const
    }

    await updateGroup('group-id', payload, 'access-token')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/groups/group-id', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify(payload)
    }))
  })

  it('updates group module settings through the backend settings endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ chatEnabled: false }), { status: 200 })
    )
    const payload = {
      chatEnabled: false,
      scheduleEnabled: true
    }

    await updateGroupSettings('group-id', payload, 'access-token')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/groups/group-id/settings', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify(payload)
    }))
  })

  it('creates join requests for groups that require approval', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'request-id' }), { status: 201 })
    )

    await createJoinRequest('group-id', 'access-token')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/groups/group-id/join-requests', expect.objectContaining({
      method: 'POST'
    }))
  })

  it('creates lessons, assignments and schedule events through resource endpoints', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 'resource-id' }), { status: 201 }))
    )
    const lessonPayload = {
      title: 'Intro',
      status: 'PUBLISHED' as const
    }
    const assignmentPayload = {
      title: 'Homework',
      dueAt: '2026-04-26T12:00:00.000Z'
    }
    const eventPayload = {
      title: 'Live lesson',
      startsAt: '2026-04-26T10:00:00.000Z',
      endsAt: '2026-04-26T11:00:00.000Z'
    }

    await createLesson('group-id', lessonPayload, 'access-token')
    await createAssignment('group-id', assignmentPayload, 'access-token')
    await createScheduleEvent('group-id', eventPayload, 'access-token')

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/groups/group-id/lessons', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(lessonPayload)
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/groups/group-id/assignments', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(assignmentPayload)
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/v1/groups/group-id/schedule/events', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(eventPayload)
    }))
  })

  it('sends join request decisions to the backend', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'request-id', status: 'APPROVED' }), { status: 200 })
    )

    await decideJoinRequest('group-id', 'request-id', 'APPROVED', 'access-token')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/groups/group-id/join-requests/request-id', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ decision: 'APPROVED' })
    }))
  })
})
