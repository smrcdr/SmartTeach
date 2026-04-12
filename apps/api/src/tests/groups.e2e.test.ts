import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { GroupRole, GroupStatus, PrismaClient } from '@prisma/client'
import { createApp } from '../main'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for groups e2e tests.')
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

type GroupSettingsResponse = {
  chatEnabled: boolean
  lessonsEnabled: boolean
  assignmentsEnabled: boolean
  scheduleEnabled: boolean
}

type GroupResponse = {
  id: string
  code: string
  name: string
  description: string | null
  ownerId: string
  owner: {
    id: string
    displayName: string
    bio: string | null
    avatarFileId: string | null
  }
  accessMode: 'OPEN' | 'BY_REQUEST' | 'CLOSED'
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  settings: GroupSettingsResponse
  membersCount: number
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  deletedAt: string | null
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
  const email = `groups-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Groups ${label}`,
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdUserIds.add(String(result.body.user.id))

  return result.body
}

test('groups endpoints create, filter, update and soft-delete groups', async () => {
  const owner = await registerUser('owner')
  const outsider = await registerUser('outsider')

  const createResult = await request<GroupResponse>('/groups', {
    method: 'POST',
    token: owner.accessToken,
    body: {
      name: 'Frontend Patterns Lab',
      description: 'Группа для разбора интерфейсных паттернов.',
      accessMode: 'BY_REQUEST',
      settings: {
        chatEnabled: true,
        lessonsEnabled: true,
        assignmentsEnabled: false,
        scheduleEnabled: true,
      },
    },
  })

  assert.equal(createResult.response.status, 201)
  assert.ok(createResult.body)
  const createdGroup = createResult.body

  assert.equal(createdGroup.name, 'Frontend Patterns Lab')
  assert.equal(createdGroup.ownerId, owner.user.id)
  assert.equal(createdGroup.accessMode, 'BY_REQUEST')
  assert.equal(createdGroup.status, 'ACTIVE')
  assert.equal(createdGroup.membersCount, 1)
  assert.equal(createdGroup.settings.assignmentsEnabled, false)
  assert.match(createdGroup.code, /^[A-Z0-9]{6}$/)
  createdGroupIds.add(createdGroup.id)

  const storedGroup = await prisma.group.findUnique({
    where: {
      id: createdGroup.id,
    },
    include: {
      settings: true,
      members: true,
    },
  })

  assert.ok(storedGroup)
  assert.equal(storedGroup.ownerId, owner.user.id)
  assert.ok(storedGroup.settings)
  assert.equal(storedGroup.settings?.assignmentsEnabled, false)
  assert.equal(storedGroup.members.length, 1)
  assert.equal(storedGroup.members[0]?.role, GroupRole.OWNER)

  const searchResult = await request<GroupResponse[]>('/groups?search=patterns', {
    method: 'GET',
    token: owner.accessToken,
  })

  assert.equal(searchResult.response.status, 200)
  assert.ok(searchResult.body)
  assert.ok(searchResult.body.some((group) => group.id === createdGroup.id))

  const joinedOnlyResult = await request<GroupResponse[]>('/groups?joinedOnly=true', {
    method: 'GET',
    token: owner.accessToken,
  })

  assert.equal(joinedOnlyResult.response.status, 200)
  assert.ok(joinedOnlyResult.body)
  assert.ok(joinedOnlyResult.body.some((group) => group.id === createdGroup.id))

  const codeFilterResult = await request<GroupResponse[]>(
    `/groups?code=${encodeURIComponent(createdGroup.code)}`,
    {
      method: 'GET',
      token: outsider.accessToken,
    },
  )

  assert.equal(codeFilterResult.response.status, 200)
  assert.ok(codeFilterResult.body)
  assert.ok(codeFilterResult.body.some((group) => group.id === createdGroup.id))

  const getByCodeResult = await request<GroupResponse>(
    `/groups/by-code/${encodeURIComponent(createdGroup.code.toLowerCase())}`,
    {
      method: 'GET',
      token: outsider.accessToken,
    },
  )

  assert.equal(getByCodeResult.response.status, 200)
  assert.ok(getByCodeResult.body)
  assert.equal(getByCodeResult.body.id, createdGroup.id)

  const getByIdResult = await request<GroupResponse>(`/groups/${createdGroup.id}`, {
    method: 'GET',
    token: outsider.accessToken,
  })

  assert.equal(getByIdResult.response.status, 200)
  assert.ok(getByIdResult.body)
  assert.equal(getByIdResult.body.id, createdGroup.id)

  const invalidStatusUpdateResult = await request(`/groups/${createdGroup.id}`, {
    method: 'PATCH',
    token: owner.accessToken,
    body: {
      status: 'DELETED',
    },
  })

  assert.equal(invalidStatusUpdateResult.response.status, 400)

  const forbiddenUpdateResult = await request(`/groups/${createdGroup.id}`, {
    method: 'PATCH',
    token: outsider.accessToken,
    body: {
      name: 'Unauthorized rename',
    },
  })

  assert.equal(forbiddenUpdateResult.response.status, 403)

  const archiveResult = await request<GroupResponse>(`/groups/${createdGroup.id}`, {
    method: 'PATCH',
    token: owner.accessToken,
    body: {
      name: 'Frontend Patterns Archive',
      description: '',
      accessMode: 'OPEN',
      status: 'ARCHIVED',
    },
  })

  assert.equal(archiveResult.response.status, 200)
  assert.ok(archiveResult.body)
  assert.equal(archiveResult.body.name, 'Frontend Patterns Archive')
  assert.equal(archiveResult.body.description, null)
  assert.equal(archiveResult.body.accessMode, 'OPEN')
  assert.equal(archiveResult.body.status, 'ARCHIVED')
  assert.ok(archiveResult.body.archivedAt)

  const restoreResult = await request<GroupResponse>(`/groups/${createdGroup.id}`, {
    method: 'PATCH',
    token: owner.accessToken,
    body: {
      status: 'ACTIVE',
    },
  })

  assert.equal(restoreResult.response.status, 200)
  assert.ok(restoreResult.body)
  assert.equal(restoreResult.body.status, 'ACTIVE')
  assert.equal(restoreResult.body.archivedAt, null)

  const forbiddenDeleteResult = await request(`/groups/${createdGroup.id}`, {
    method: 'DELETE',
    token: outsider.accessToken,
  })

  assert.equal(forbiddenDeleteResult.response.status, 403)

  const deleteResult = await request(`/groups/${createdGroup.id}`, {
    method: 'DELETE',
    token: owner.accessToken,
  })

  assert.equal(deleteResult.response.status, 204)
  assert.equal(deleteResult.body, null)

  const deletedGroup = await prisma.group.findUnique({
    where: {
      id: createdGroup.id,
    },
    select: {
      status: true,
      deletedAt: true,
    },
  })

  assert.ok(deletedGroup)
  assert.equal(deletedGroup.status, GroupStatus.DELETED)
  assert.ok(deletedGroup.deletedAt)

  const deletedJoinedGroupsResult = await request<GroupResponse[]>(
    '/groups?joinedOnly=true&status=DELETED',
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(deletedJoinedGroupsResult.response.status, 200)
  assert.ok(deletedJoinedGroupsResult.body)
  assert.equal(
    deletedJoinedGroupsResult.body.some((group) => group.id === createdGroup.id),
    false,
  )

  const deletedGetByIdResult = await request(`/groups/${createdGroup.id}`, {
    method: 'GET',
    token: owner.accessToken,
  })

  assert.equal(deletedGetByIdResult.response.status, 404)

  const deletedGetByCodeResult = await request(
    `/groups/by-code/${encodeURIComponent(createdGroup.code)}`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(deletedGetByCodeResult.response.status, 404)

  const deletedSettingsResult = await request(`/groups/${createdGroup.id}/settings`, {
    method: 'GET',
    token: owner.accessToken,
  })

  assert.equal(deletedSettingsResult.response.status, 404)
})

test('group settings endpoints require membership for read and admin role for updates', async () => {
  const owner = await registerUser('settings-owner')
  const admin = await registerUser('settings-admin')
  const member = await registerUser('settings-member')
  const outsider = await registerUser('settings-outsider')

  const createResult = await request<GroupResponse>('/groups', {
    method: 'POST',
    token: owner.accessToken,
    body: {
      name: 'Group Settings Access',
      accessMode: 'OPEN',
      settings: {
        chatEnabled: true,
        lessonsEnabled: true,
        assignmentsEnabled: true,
        scheduleEnabled: true,
      },
    },
  })

  assert.equal(createResult.response.status, 201)
  assert.ok(createResult.body)
  const createdGroup = createResult.body

  createdGroupIds.add(createdGroup.id)

  await prisma.groupMember.createMany({
    data: [
      {
        groupId: createdGroup.id,
        userId: admin.user.id,
        role: GroupRole.ADMIN,
      },
      {
        groupId: createdGroup.id,
        userId: member.user.id,
        role: GroupRole.USER,
      },
    ],
  })

  const memberSettingsResult = await request<GroupSettingsResponse>(
    `/groups/${createdGroup.id}/settings`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(memberSettingsResult.response.status, 200)
  assert.ok(memberSettingsResult.body)
  assert.equal(memberSettingsResult.body.chatEnabled, true)

  const outsiderSettingsResult = await request(`/groups/${createdGroup.id}/settings`, {
    method: 'GET',
    token: outsider.accessToken,
  })

  assert.equal(outsiderSettingsResult.response.status, 403)

  const memberUpdateResult = await request(`/groups/${createdGroup.id}/settings`, {
    method: 'PATCH',
    token: member.accessToken,
    body: {
      chatEnabled: false,
    },
  })

  assert.equal(memberUpdateResult.response.status, 403)

  const adminUpdateResult = await request<GroupSettingsResponse>(
    `/groups/${createdGroup.id}/settings`,
    {
      method: 'PATCH',
      token: admin.accessToken,
      body: {
        chatEnabled: false,
        assignmentsEnabled: false,
      },
    },
  )

  assert.equal(adminUpdateResult.response.status, 200)
  assert.ok(adminUpdateResult.body)
  assert.equal(adminUpdateResult.body.chatEnabled, false)
  assert.equal(adminUpdateResult.body.assignmentsEnabled, false)
  assert.equal(adminUpdateResult.body.lessonsEnabled, true)

  const ownerReadBackResult = await request<GroupSettingsResponse>(
    `/groups/${createdGroup.id}/settings`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(ownerReadBackResult.response.status, 200)
  assert.ok(ownerReadBackResult.body)
  assert.equal(ownerReadBackResult.body.chatEnabled, false)
  assert.equal(ownerReadBackResult.body.assignmentsEnabled, false)

  const storedSettings = await prisma.groupSettings.findUnique({
    where: {
      groupId: createdGroup.id,
    },
    select: {
      chatEnabled: true,
      assignmentsEnabled: true,
      lessonsEnabled: true,
      scheduleEnabled: true,
    },
  })

  assert.deepEqual(storedSettings, {
    chatEnabled: false,
    assignmentsEnabled: false,
    lessonsEnabled: true,
    scheduleEnabled: true,
  })
})

test('archived groups keep settings readable but reject settings updates', async () => {
  const owner = await registerUser('archived-settings-owner')

  const createResult = await request<GroupResponse>('/groups', {
    method: 'POST',
    token: owner.accessToken,
    body: {
      name: 'Archived Settings Controls',
      accessMode: 'OPEN',
      settings: {
        chatEnabled: true,
        lessonsEnabled: true,
        assignmentsEnabled: true,
        scheduleEnabled: true,
      },
    },
  })

  assert.equal(createResult.response.status, 201)
  assert.ok(createResult.body)
  createdGroupIds.add(createResult.body.id)

  const archiveResult = await request<GroupResponse>(`/groups/${createResult.body.id}`, {
    method: 'PATCH',
    token: owner.accessToken,
    body: {
      status: 'ARCHIVED',
    },
  })

  assert.equal(archiveResult.response.status, 200)
  assert.ok(archiveResult.body)
  assert.equal(archiveResult.body.status, 'ARCHIVED')

  const readSettingsResult = await request<GroupSettingsResponse>(
    `/groups/${createResult.body.id}/settings`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(readSettingsResult.response.status, 200)
  assert.ok(readSettingsResult.body)
  assert.equal(readSettingsResult.body.chatEnabled, true)

  const updateSettingsResult = await request(`/groups/${createResult.body.id}/settings`, {
    method: 'PATCH',
    token: owner.accessToken,
    body: {
      chatEnabled: false,
    },
  })

  assert.equal(updateSettingsResult.response.status, 403)
  assert.deepEqual(updateSettingsResult.body, {
    statusCode: 403,
    message: 'Archived groups are read-only',
  })
})
