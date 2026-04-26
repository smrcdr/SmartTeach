import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createGroup,
  createJoinRequest,
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
