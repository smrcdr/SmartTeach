import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { createApp } from '../main'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for public groups e2e tests.')
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
  accessMode: 'OPEN' | 'BY_REQUEST' | 'CLOSED'
  viewerMembershipRole: 'OWNER' | 'ADMIN' | 'USER' | null
  viewerJoinRequestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
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
  const email = `groups-public-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Public Groups ${label}`,
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdUserIds.add(String(result.body.user.id))

  return result.body
}

test('public catalog and group preview are available without authentication', async () => {
  const owner = await registerUser('owner')

  const createResult = await request<GroupResponse>('/groups', {
    method: 'POST',
    token: owner.accessToken,
    body: {
      name: 'Public Catalog Access',
      description: 'Visible without a session.',
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

  const catalogResult = await request<GroupResponse[]>('/groups', {
    method: 'GET',
  })

  assert.equal(catalogResult.response.status, 200)
  assert.ok(catalogResult.body)
  const publicGroup = catalogResult.body.find((group) => group.id === createResult.body?.id)
  assert.ok(publicGroup)
  assert.equal(publicGroup.viewerMembershipRole, null)
  assert.equal(publicGroup.viewerJoinRequestStatus, null)

  const previewResult = await request<GroupResponse>(`/groups/${createResult.body.id}`, {
    method: 'GET',
  })

  assert.equal(previewResult.response.status, 200)
  assert.ok(previewResult.body)
  assert.equal(previewResult.body.id, createResult.body.id)
  assert.equal(previewResult.body.viewerMembershipRole, null)

  const joinedOnlyResult = await request('/groups?joinedOnly=true', {
    method: 'GET',
  })

  assert.equal(joinedOnlyResult.response.status, 401)
})
