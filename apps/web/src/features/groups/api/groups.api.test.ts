import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAssignment,
  createGroup,
  createJoinRequest,
  createLesson,
  createMaterialSection,
  createMaterialSubsection,
  createSubmission,
  listMaterials,
  createUsefulLink,
  createScheduleEvent,
  decideJoinRequest,
  listUsefulLinks,
  listGroups,
  getGroupByCode,
  updateGroup,
  updateGroupSettings
} from './groups.api'

describe('groups api', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads the public catalog without an authorization token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    )

    await listGroups()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/groups', expect.objectContaining({
      credentials: 'include',
      headers: expect.any(Headers)
    }))

    const headers = fetchMock.mock.calls[0]?.[1]?.headers
    expect(headers).toBeInstanceOf(Headers)
    expect((headers as Headers).has('Authorization')).toBe(false)
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
        scheduleEnabled: false,
        usefulLinksEnabled: true
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
      new Response(JSON.stringify({ chatEnabled: false, usefulLinksEnabled: true }), { status: 200 })
    )
    const payload = {
      chatEnabled: false,
      scheduleEnabled: true,
      usefulLinksEnabled: true
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

  it('creates lessons, assignments, schedule events and useful links through resource endpoints', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 'resource-id' }), { status: 201 }))
    )
    const lessonPayload = {
      title: 'Intro',
      materialSubsectionId: 'subsection-id',
      status: 'PUBLISHED' as const
    }
    const assignmentPayload = {
      title: 'Homework',
      materialSubsectionId: 'subsection-id',
      dueAt: '2026-04-26T12:00:00.000Z'
    }
    const sectionPayload = {
      title: 'Раздел 1'
    }
    const subsectionPayload = {
      title: 'Подраздел 1'
    }
    const submissionPayload = {
      text: 'Готовое решение',
      status: 'SUBMITTED' as const
    }
    const eventPayload = {
      title: 'Live lesson',
      startsAt: '2026-04-26T10:00:00.000Z',
      endsAt: '2026-04-26T11:00:00.000Z'
    }
    const usefulLinkPayload = {
      title: 'Телеграм',
      url: 'https://t.me/test123',
      imageFileId: 'file-id'
    }

    await createMaterialSection('group-id', sectionPayload, 'access-token')
    await createMaterialSubsection('group-id', 'section-id', subsectionPayload, 'access-token')
    await listMaterials('group-id', 'access-token')
    await createLesson('group-id', lessonPayload, 'access-token')
    await createAssignment('group-id', assignmentPayload, 'access-token')
    await createSubmission('group-id', 'assignment-id', submissionPayload, 'access-token')
    await createScheduleEvent('group-id', eventPayload, 'access-token')
    await createUsefulLink('group-id', usefulLinkPayload, 'access-token')
    await listUsefulLinks('group-id', 'access-token')

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/groups/group-id/materials/sections', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(sectionPayload)
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/groups/group-id/materials/sections/section-id/subsections', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(subsectionPayload)
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/v1/groups/group-id/materials', expect.objectContaining({
      credentials: 'include'
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/v1/groups/group-id/lessons', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(lessonPayload)
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(5, '/api/v1/groups/group-id/assignments', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(assignmentPayload)
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(6, '/api/v1/groups/group-id/assignments/assignment-id/submissions', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(submissionPayload)
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(7, '/api/v1/groups/group-id/schedule/events', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(eventPayload)
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(8, '/api/v1/groups/group-id/useful-links', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(usefulLinkPayload)
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(9, '/api/v1/groups/group-id/useful-links', expect.objectContaining({
      credentials: 'include'
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
