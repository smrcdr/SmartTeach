import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { GroupRole, PrismaClient } from '@prisma/client'
import { createApp } from '../main'
import { MinioService } from '../storage/minio/minio.service'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for useful links e2e tests.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})

const createdUserIds = new Set<string>()
const createdGroupIds = new Set<string>()
const createdFileIds = new Set<string>()
let app: INestApplication
let baseUrl: string

before(async () => {
  app = await createApp({
    enableSwagger: false,
  })

  const minioService = app.get(MinioService)

  minioService.getObjectUrl = async (objectName: string) => {
    return `https://files.smarteach.test/${encodeURIComponent(objectName)}`
  }

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

  if (createdFileIds.size > 0) {
    await prisma.file.deleteMany({
      where: {
        id: {
          in: [...createdFileIds],
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

type UsefulLinkResponse = {
  id: string
  groupId: string
  title: string
  url: string
  image: {
    id: string
    originalName: string
    mimeType: string
    sizeBytes: number
    uploadedByUserId: string
    url: string
    createdAt: string
  } | null
  sortOrder: number
  createdByUserId: string
  createdAt: string
  updatedAt: string
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
  const email = `useful-links-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Useful Links ${label}`,
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdUserIds.add(result.body.user.id)

  return result.body
}

async function createGroup(ownerToken: string, usefulLinksEnabled = true) {
  const result = await request<GroupResponse>('/groups', {
    method: 'POST',
    token: ownerToken,
    body: {
      name: `Useful Links Group ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: 'Group for useful links API tests.',
      accessMode: 'BY_REQUEST',
      settings: {
        chatEnabled: true,
        lessonsEnabled: true,
        assignmentsEnabled: true,
        scheduleEnabled: true,
        usefulLinksEnabled,
      },
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdGroupIds.add(result.body.id)

  return result.body
}

async function createOwnedFile(
  userId: string,
  params: {
    label: string
    mimeType: string
  },
) {
  const file = await prisma.file.create({
    data: {
      storageKey: `useful-links/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${params.label}`,
      originalName: params.label,
      mimeType: params.mimeType,
      sizeBytes: BigInt(2048),
      uploadedByUserId: userId,
    },
    select: {
      id: true,
    },
  })

  createdFileIds.add(file.id)

  return file
}

test('useful links endpoints create and list group links', async () => {
  const owner = await registerUser('owner')
  const member = await registerUser('member')
  const group = await createGroup(owner.accessToken)
  const image = await createOwnedFile(owner.user.id, {
    label: 'telegram.png',
    mimeType: 'image/png',
  })

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: member.user.id,
      role: GroupRole.USER,
    },
  })

  const createResult = await request<UsefulLinkResponse>(`/groups/${group.id}/useful-links`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Телеграм',
      url: 'https://t.me/test123',
      imageFileId: image.id,
    },
  })

  assert.equal(createResult.response.status, 201)
  assert.ok(createResult.body)
  assert.equal(createResult.body.title, 'Телеграм')
  assert.equal(createResult.body.url, 'https://t.me/test123')
  assert.equal(createResult.body.sortOrder, 1)
  assert.equal(createResult.body.image?.id, image.id)
  assert.equal(createResult.body.image?.url.includes('telegram.png'), true)

  const listResult = await request<UsefulLinkResponse[]>(`/groups/${group.id}/useful-links`, {
    token: member.accessToken,
  })

  assert.equal(listResult.response.status, 200)
  assert.ok(listResult.body)
  assert.equal(listResult.body.length, 1)
  assert.equal(listResult.body[0].id, createResult.body.id)
})

test('useful links endpoints enforce roles, file type and feature flag', async () => {
  const owner = await registerUser('owner-guards')
  const member = await registerUser('member-guards')
  const group = await createGroup(owner.accessToken)
  const disabledGroup = await createGroup(owner.accessToken, false)
  const document = await createOwnedFile(owner.user.id, {
    label: 'not-image.pdf',
    mimeType: 'application/pdf',
  })

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: member.user.id,
      role: GroupRole.USER,
    },
  })

  const memberCreateResult = await request(`/groups/${group.id}/useful-links`, {
    method: 'POST',
    token: member.accessToken,
    body: {
      title: 'Member link',
      url: 'https://example.com',
    },
  })

  assert.equal(memberCreateResult.response.status, 403)

  const invalidImageResult = await request(`/groups/${group.id}/useful-links`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Document',
      url: 'https://example.com/document',
      imageFileId: document.id,
    },
  })

  assert.equal(invalidImageResult.response.status, 400)

  const disabledListResult = await request(`/groups/${disabledGroup.id}/useful-links`, {
    token: owner.accessToken,
  })

  assert.equal(disabledListResult.response.status, 403)
})
