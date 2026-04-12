import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { GroupRole, PrismaClient } from '@prisma/client'
import { createApp } from '../main'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for schedule e2e tests.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})

const createdUserIds = new Set<string>()
const createdGroupIds = new Set<string>()
let app: INestApplication
let baseUrl: string

before(async () => {
  app = await createApp({
    enableSwagger: false,
  })
  await app.listen(0, '127.0.0.1')
  baseUrl = await app.getUrl()
})

after(async () => {
  if (createdGroupIds.size > 0) {
    await prisma.group.deleteMany({
      where: {
        id: {
          in: [...createdGroupIds],
        },
      },
    })
  }

  if (createdUserIds.size > 0) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [...createdUserIds],
        },
      },
    })
  }

  if (app) {
    await app.close()
  }

  await prisma.$disconnect()
})

type JsonRecord = Record<string, unknown>

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: JsonRecord
  token?: string
  headers?: Record<string, string>
}

type AuthSessionResponse = {
  user: {
    id: string
  }
  accessToken: string
}

type GroupResponse = {
  id: string
}

type ErrorResponse = {
  statusCode: number
  message: string
  errors?: string[]
}

type ScheduleEventResponse = {
  id: string
  groupId: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  location: string | null
  status: 'PLANNED' | 'CANCELLED'
  createdByUserId: string
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

type ScheduleEntryResponse = {
  sourceType: 'LESSON' | 'ASSIGNMENT_DEADLINE' | 'CUSTOM_EVENT'
  sourceId: string
  groupId: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string | null
}

async function request<T = JsonRecord>(
  path: string,
  init: RequestOptions = {},
) {
  const headers = new Headers(init.headers)

  if (init.body !== undefined) {
    headers.set('content-type', 'application/json')
  }

  if (init.token) {
    headers.set('authorization', `Bearer ${init.token}`)
  }

  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  const rawBody = await response.text()

  return {
    response,
    body: rawBody.length > 0 ? (JSON.parse(rawBody) as T) : null,
  }
}

async function registerUser(label: string) {
  const email = `schedule-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Schedule ${label}`,
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdUserIds.add(result.body.user.id)

  return result.body
}

async function createGroup(
  ownerToken: string,
  options: {
    scheduleEnabled?: boolean
  } = {},
) {
  const result = await request<GroupResponse>('/groups', {
    method: 'POST',
    token: ownerToken,
    body: {
      name: `Schedule Group ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: 'Group for schedule API tests.',
      accessMode: 'BY_REQUEST',
      settings: {
        chatEnabled: true,
        lessonsEnabled: true,
        assignmentsEnabled: true,
        scheduleEnabled: options.scheduleEnabled ?? true,
      },
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdGroupIds.add(result.body.id)

  return result.body
}

test('schedule endpoints aggregate lessons, deadlines and custom events', async () => {
  const owner = await registerUser('owner')
  const member = await registerUser('member')
  const group = await createGroup(owner.accessToken)

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: member.user.id,
      role: GroupRole.USER,
    },
  })

  const lesson = await prisma.lesson.create({
    data: {
      groupId: group.id,
      title: 'Architecture workshop',
      content: 'Разбираем boundaries и инварианты.',
      status: 'PUBLISHED',
      sortOrder: 1,
      startsAt: new Date('2026-04-15T09:00:00.000Z'),
      endsAt: new Date('2026-04-15T10:30:00.000Z'),
      createdByUserId: owner.user.id,
      publishedAt: new Date('2026-04-10T08:00:00.000Z'),
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
    },
  })

  await prisma.lesson.create({
    data: {
      groupId: group.id,
      title: 'Lesson without slot',
      status: 'DRAFT',
      sortOrder: 2,
      createdByUserId: owner.user.id,
    },
  })

  const assignment = await prisma.assignment.create({
    data: {
      groupId: group.id,
      title: 'Submit API review',
      content: 'Сверьте runtime и OpenAPI.',
      status: 'PUBLISHED',
      dueAt: new Date('2026-04-18T18:00:00.000Z'),
      createdByUserId: owner.user.id,
      publishedAt: new Date('2026-04-10T08:00:00.000Z'),
    },
    select: {
      id: true,
      title: true,
      dueAt: true,
    },
  })

  await prisma.assignment.create({
    data: {
      groupId: group.id,
      title: 'Assignment without deadline',
      status: 'DRAFT',
      createdByUserId: owner.user.id,
    },
  })

  const duplicateLessonResult = await request<ErrorResponse>(`/groups/${group.id}/schedule/events`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: lesson.title,
      startsAt: lesson.startsAt!.toISOString(),
      endsAt: lesson.endsAt!.toISOString(),
    },
  })

  assert.equal(duplicateLessonResult.response.status, 400)
  assert.ok(duplicateLessonResult.body?.errors?.some((error) => error.includes('lesson-derived')))

  const duplicateAssignmentResult = await request<ErrorResponse>(
    `/groups/${group.id}/schedule/events`,
    {
      method: 'POST',
      token: owner.accessToken,
      body: {
        title: assignment.title,
        startsAt: assignment.dueAt!.toISOString(),
        endsAt: assignment.dueAt!.toISOString(),
      },
    },
  )

  assert.equal(duplicateAssignmentResult.response.status, 400)
  assert.ok(
    duplicateAssignmentResult.body?.errors?.some((error) => error.includes('assignment-derived')),
  )

  const createEventResult = await request<ScheduleEventResponse>(
    `/groups/${group.id}/schedule/events`,
    {
      method: 'POST',
      token: owner.accessToken,
      body: {
        title: 'Demo day rehearsal',
        description: 'Готовим финальный прогон презентаций.',
        startsAt: '2026-04-16T12:00:00.000Z',
        endsAt: '2026-04-16T13:30:00.000Z',
        location: 'Zoom / Room 204',
      },
    },
  )

  assert.equal(createEventResult.response.status, 201)
  assert.ok(createEventResult.body)
  assert.equal(createEventResult.body.status, 'PLANNED')
  assert.equal(createEventResult.body.createdByUserId, owner.user.id)
  assert.equal(createEventResult.body.cancelledAt, null)

  const createdEvent = createEventResult.body

  const fullScheduleResult = await request<ScheduleEntryResponse[]>(`/groups/${group.id}/schedule`, {
    method: 'GET',
    token: member.accessToken,
  })

  assert.equal(fullScheduleResult.response.status, 200)
  assert.ok(fullScheduleResult.body)
  assert.equal(fullScheduleResult.body.length, 3)
  assert.deepEqual(
    fullScheduleResult.body.map((entry) => entry.sourceType),
    ['LESSON', 'CUSTOM_EVENT', 'ASSIGNMENT_DEADLINE'],
  )
  assert.deepEqual(
    fullScheduleResult.body.map((entry) => entry.title),
    ['Architecture workshop', 'Demo day rehearsal', 'Submit API review'],
  )

  const filteredScheduleResult = await request<ScheduleEntryResponse[]>(
    `/groups/${group.id}/schedule?from=${encodeURIComponent('2026-04-16T00:00:00.000Z')}&to=${encodeURIComponent('2026-04-16T23:59:59.999Z')}`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(filteredScheduleResult.response.status, 200)
  assert.ok(filteredScheduleResult.body)
  assert.equal(filteredScheduleResult.body.length, 1)
  assert.equal(filteredScheduleResult.body[0]?.sourceType, 'CUSTOM_EVENT')
  assert.equal(filteredScheduleResult.body[0]?.sourceId, createdEvent.id)

  const listEventsResult = await request<ScheduleEventResponse[]>(
    `/groups/${group.id}/schedule/events?status=PLANNED&from=${encodeURIComponent('2026-04-16T00:00:00.000Z')}&to=${encodeURIComponent('2026-04-16T23:59:59.999Z')}`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(listEventsResult.response.status, 200)
  assert.ok(listEventsResult.body)
  assert.equal(listEventsResult.body.length, 1)
  assert.equal(listEventsResult.body[0]?.id, createdEvent.id)

  const getEventResult = await request<ScheduleEventResponse>(
    `/groups/${group.id}/schedule/events/${createdEvent.id}`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(getEventResult.response.status, 200)
  assert.ok(getEventResult.body)
  assert.equal(getEventResult.body.title, 'Demo day rehearsal')

  const updateEventResult = await request<ScheduleEventResponse>(
    `/groups/${group.id}/schedule/events/${createdEvent.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        title: 'Demo day rehearsal updated',
        status: 'CANCELLED',
        location: '',
      },
    },
  )

  assert.equal(updateEventResult.response.status, 200)
  assert.ok(updateEventResult.body)
  assert.equal(updateEventResult.body.title, 'Demo day rehearsal updated')
  assert.equal(updateEventResult.body.status, 'CANCELLED')
  assert.equal(updateEventResult.body.location, null)
  assert.ok(updateEventResult.body.cancelledAt)

  const cancelledEventsResult = await request<ScheduleEventResponse[]>(
    `/groups/${group.id}/schedule/events?status=CANCELLED`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(cancelledEventsResult.response.status, 200)
  assert.ok(cancelledEventsResult.body)
  assert.equal(cancelledEventsResult.body.length, 1)
  assert.equal(cancelledEventsResult.body[0]?.id, createdEvent.id)

  const scheduleWithoutCancelledEvent = await request<ScheduleEntryResponse[]>(
    `/groups/${group.id}/schedule`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(scheduleWithoutCancelledEvent.response.status, 200)
  assert.ok(scheduleWithoutCancelledEvent.body)
  assert.equal(scheduleWithoutCancelledEvent.body.length, 2)
  assert.ok(
    scheduleWithoutCancelledEvent.body.every((entry) => entry.sourceType !== 'CUSTOM_EVENT'),
  )

  const deleteEventResult = await request(`/groups/${group.id}/schedule/events/${createdEvent.id}`, {
    method: 'DELETE',
    token: owner.accessToken,
  })

  assert.equal(deleteEventResult.response.status, 204)
  assert.equal(deleteEventResult.body, null)

  const missingEventResult = await request<ErrorResponse>(
    `/groups/${group.id}/schedule/events/${createdEvent.id}`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(missingEventResult.response.status, 404)
})

test('schedule endpoints enforce membership, role, feature flag and archive rules', async () => {
  const owner = await registerUser('owner-guards')
  const member = await registerUser('member-guards')
  const outsider = await registerUser('outsider-guards')
  const group = await createGroup(owner.accessToken)
  const disabledGroup = await createGroup(owner.accessToken, {
    scheduleEnabled: false,
  })
  const archivedGroup = await createGroup(owner.accessToken)

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: member.user.id,
      role: GroupRole.USER,
    },
  })

  await prisma.group.update({
    where: {
      id: archivedGroup.id,
    },
    data: {
      status: 'ARCHIVED',
      archivedAt: new Date('2026-04-20T08:00:00.000Z'),
    },
  })

  const memberWriteResult = await request<ErrorResponse>(`/groups/${group.id}/schedule/events`, {
    method: 'POST',
    token: member.accessToken,
    body: {
      title: 'Member cannot create',
      startsAt: '2026-04-20T09:00:00.000Z',
      endsAt: '2026-04-20T10:00:00.000Z',
    },
  })

  assert.equal(memberWriteResult.response.status, 403)

  const outsiderReadResult = await request<ErrorResponse>(`/groups/${group.id}/schedule`, {
    method: 'GET',
    token: outsider.accessToken,
  })

  assert.equal(outsiderReadResult.response.status, 403)

  const disabledReadResult = await request<ErrorResponse>(`/groups/${disabledGroup.id}/schedule`, {
    method: 'GET',
    token: owner.accessToken,
  })

  assert.equal(disabledReadResult.response.status, 403)
  assert.equal(disabledReadResult.body?.message, 'Schedule module is disabled for this group')

  const disabledWriteResult = await request<ErrorResponse>(
    `/groups/${disabledGroup.id}/schedule/events`,
    {
      method: 'POST',
      token: owner.accessToken,
      body: {
        title: 'Disabled schedule',
        startsAt: '2026-04-20T09:00:00.000Z',
        endsAt: '2026-04-20T10:00:00.000Z',
      },
    },
  )

  assert.equal(disabledWriteResult.response.status, 403)

  const archivedReadResult = await request<ScheduleEntryResponse[]>(
    `/groups/${archivedGroup.id}/schedule`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(archivedReadResult.response.status, 200)
  assert.deepEqual(archivedReadResult.body, [])

  const archivedWriteResult = await request<ErrorResponse>(
    `/groups/${archivedGroup.id}/schedule/events`,
    {
      method: 'POST',
      token: owner.accessToken,
      body: {
        title: 'Archived write blocked',
        startsAt: '2026-04-20T09:00:00.000Z',
        endsAt: '2026-04-20T10:00:00.000Z',
      },
    },
  )

  assert.equal(archivedWriteResult.response.status, 403)
  assert.equal(archivedWriteResult.body?.message, 'Archived groups are read-only')
})
