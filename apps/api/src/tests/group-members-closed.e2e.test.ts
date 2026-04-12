import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { createApp } from '../main'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for closed-group membership e2e tests.')
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

type GroupMemberResponse = {
  groupId: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'USER'
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
  const email = `closed-groups-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Closed Groups ${label}`,
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdUserIds.add(String(result.body.user.id))

  return result.body
}

async function createClosedGroup(ownerToken: string) {
  const result = await request<GroupResponse>('/groups', {
    method: 'POST',
    token: ownerToken,
    body: {
      name: `Closed Group ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      accessMode: 'CLOSED',
      settings: {
        chatEnabled: true,
        lessonsEnabled: true,
        assignmentsEnabled: true,
        scheduleEnabled: true,
      },
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdGroupIds.add(result.body.id)

  return result.body
}

test('closed groups allow manual member adds while rejecting self-service joins', async () => {
  const owner = await registerUser('owner')
  const invitedMember = await registerUser('invited')
  const outsider = await registerUser('outsider')
  const group = await createClosedGroup(owner.accessToken)

  const selfJoinResult = await request(`/groups/${group.id}/join`, {
    method: 'POST',
    token: outsider.accessToken,
  })

  assert.equal(selfJoinResult.response.status, 403)

  const manualAddResult = await request<GroupMemberResponse>(`/groups/${group.id}/members`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      userId: invitedMember.user.id,
    },
  })

  assert.equal(manualAddResult.response.status, 201)
  assert.ok(manualAddResult.body)
  assert.equal(manualAddResult.body.userId, invitedMember.user.id)
  assert.equal(manualAddResult.body.role, 'USER')

  const memberListResult = await request<GroupMemberResponse[]>(`/groups/${group.id}/members`, {
    method: 'GET',
    token: invitedMember.accessToken,
  })

  assert.equal(memberListResult.response.status, 200)
  assert.ok(memberListResult.body)
  assert.deepEqual(
    memberListResult.body
      .map((member) => ({
        userId: member.userId,
        role: member.role,
      }))
      .sort((left, right) => left.userId.localeCompare(right.userId)),
    [
      {
        userId: invitedMember.user.id,
        role: 'USER',
      },
      {
        userId: owner.user.id,
        role: 'OWNER',
      },
    ].sort((left, right) => left.userId.localeCompare(right.userId)),
  )
})
