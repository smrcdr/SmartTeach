import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { GroupRole, PrismaClient } from '@prisma/client'
import { createApp } from '../main'
import { MinioService } from '../storage/minio/minio.service'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for lessons e2e tests.')
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

type LessonResponse = {
  id: string
  groupId: string
  title: string
  content: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  sortOrder: number
  startsAt: string | null
  endsAt: string | null
  publishedAt: string | null
  archivedAt: string | null
  createdByUserId: string
  files: Array<{
    id: string
    originalName: string
    mimeType: string
    sizeBytes: number
    uploadedByUserId: string
    url: string
    createdAt: string
  }>
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
  const email = `lessons-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Lessons ${label}`,
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
    lessonsEnabled?: boolean
  } = {},
) {
  const result = await request<GroupResponse>('/groups', {
    method: 'POST',
    token: ownerToken,
    body: {
      name: `Lessons Group ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: 'Group for lessons API tests.',
      accessMode: 'BY_REQUEST',
      settings: {
        chatEnabled: true,
        lessonsEnabled: options.lessonsEnabled ?? true,
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

async function createOwnedFile(userId: string, label: string) {
  const file = await prisma.file.create({
    data: {
      storageKey: `lessons/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${label}.pdf`,
      originalName: `${label}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: BigInt(1024),
      uploadedByUserId: userId,
    },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      uploadedByUserId: true,
      createdAt: true,
    },
  })

  createdFileIds.add(file.id)

  return file
}

test('lessons endpoints create, list, get and update lessons inside one group', async () => {
  const owner = await registerUser('owner')
  const member = await registerUser('member')
  const outsider = await registerUser('outsider')
  const group = await createGroup(owner.accessToken)
  const secondGroup = await createGroup(owner.accessToken)
  const firstFile = await createOwnedFile(owner.user.id, 'intro-guide')
  const secondFile = await createOwnedFile(owner.user.id, 'api-checklist')

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: member.user.id,
      role: GroupRole.USER,
    },
  })

  const firstLessonCreateResult = await request<LessonResponse>(`/groups/${group.id}/lessons`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Intro to API Contracts',
      content: 'Сначала проектируем контракт.',
      status: 'PUBLISHED',
      sortOrder: 20,
      startsAt: '2026-04-15T09:00:00.000Z',
      endsAt: '2026-04-15T10:30:00.000Z',
      fileIds: [firstFile.id, secondFile.id],
    },
  })

  assert.equal(firstLessonCreateResult.response.status, 201)
  assert.ok(firstLessonCreateResult.body)
  assert.equal(firstLessonCreateResult.body.status, 'PUBLISHED')
  assert.equal(firstLessonCreateResult.body.sortOrder, 20)
  assert.equal(firstLessonCreateResult.body.createdByUserId, owner.user.id)
  assert.equal(firstLessonCreateResult.body.files.length, 2)
  assert.deepEqual(
    firstLessonCreateResult.body.files.map((file) => file.id),
    [firstFile.id, secondFile.id],
  )
  assert.ok(firstLessonCreateResult.body.publishedAt)
  assert.equal(firstLessonCreateResult.body.archivedAt, null)

  const secondLessonCreateResult = await request<LessonResponse>(`/groups/${group.id}/lessons`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Workshop Prep',
      status: 'DRAFT',
      sortOrder: 10,
    },
  })

  assert.equal(secondLessonCreateResult.response.status, 201)
  assert.ok(secondLessonCreateResult.body)
  assert.equal(secondLessonCreateResult.body.status, 'DRAFT')
  assert.equal(secondLessonCreateResult.body.publishedAt, null)

  const initialListResult = await request<LessonResponse[]>(`/groups/${group.id}/lessons`, {
    method: 'GET',
    token: member.accessToken,
  })

  assert.equal(initialListResult.response.status, 200)
  assert.ok(initialListResult.body)
  assert.deepEqual(
    initialListResult.body.map((lesson) => lesson.id),
    [secondLessonCreateResult.body.id, firstLessonCreateResult.body.id],
  )

  const updatedFirstLessonResult = await request<LessonResponse>(
    `/groups/${group.id}/lessons/${firstLessonCreateResult.body.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        status: 'ARCHIVED',
        sortOrder: 5,
        fileIds: [secondFile.id],
      },
    },
  )

  assert.equal(updatedFirstLessonResult.response.status, 200)
  assert.ok(updatedFirstLessonResult.body)
  assert.equal(updatedFirstLessonResult.body.status, 'ARCHIVED')
  assert.equal(updatedFirstLessonResult.body.sortOrder, 5)
  assert.ok(updatedFirstLessonResult.body.archivedAt)
  assert.deepEqual(updatedFirstLessonResult.body.files.map((file) => file.id), [secondFile.id])

  const updatedSecondLessonResult = await request<LessonResponse>(
    `/groups/${group.id}/lessons/${secondLessonCreateResult.body.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        status: 'PUBLISHED',
      },
    },
  )

  assert.equal(updatedSecondLessonResult.response.status, 200)
  assert.ok(updatedSecondLessonResult.body)
  assert.equal(updatedSecondLessonResult.body.status, 'PUBLISHED')
  assert.ok(updatedSecondLessonResult.body.publishedAt)
  assert.equal(updatedSecondLessonResult.body.archivedAt, null)

  const getLessonResult = await request<LessonResponse>(
    `/groups/${group.id}/lessons/${firstLessonCreateResult.body.id}`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(getLessonResult.response.status, 200)
  assert.ok(getLessonResult.body)
  assert.equal(getLessonResult.body.id, firstLessonCreateResult.body.id)
  assert.equal(getLessonResult.body.status, 'ARCHIVED')
  assert.deepEqual(getLessonResult.body.files.map((file) => file.id), [secondFile.id])

  const publishedOnlyResult = await request<LessonResponse[]>(
    `/groups/${group.id}/lessons?status=PUBLISHED`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(publishedOnlyResult.response.status, 200)
  assert.ok(publishedOnlyResult.body)
  assert.deepEqual(publishedOnlyResult.body.map((lesson) => lesson.id), [secondLessonCreateResult.body.id])

  const reorderedListResult = await request<LessonResponse[]>(`/groups/${group.id}/lessons`, {
    method: 'GET',
    token: member.accessToken,
  })

  assert.equal(reorderedListResult.response.status, 200)
  assert.ok(reorderedListResult.body)
  assert.deepEqual(
    reorderedListResult.body.map((lesson) => lesson.id),
    [firstLessonCreateResult.body.id, secondLessonCreateResult.body.id],
  )

  const wrongGroupLessonResult = await request(
    `/groups/${secondGroup.id}/lessons/${firstLessonCreateResult.body.id}`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(wrongGroupLessonResult.response.status, 404)

  const outsiderListResult = await request(`/groups/${group.id}/lessons`, {
    method: 'GET',
    token: outsider.accessToken,
  })

  assert.equal(outsiderListResult.response.status, 403)

  const memberCreateResult = await request(`/groups/${group.id}/lessons`, {
    method: 'POST',
    token: member.accessToken,
    body: {
      title: 'Member should not create lessons',
    },
  })

  assert.equal(memberCreateResult.response.status, 403)

  const storedFirstLesson = await prisma.lesson.findUnique({
    where: {
      id: firstLessonCreateResult.body.id,
    },
    select: {
      status: true,
      sortOrder: true,
      publishedAt: true,
      archivedAt: true,
      files: {
        select: {
          fileId: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  })

  assert.ok(storedFirstLesson)
  assert.equal(storedFirstLesson.status, 'ARCHIVED')
  assert.equal(storedFirstLesson.sortOrder, 5)
  assert.ok(storedFirstLesson.publishedAt instanceof Date)
  assert.ok(storedFirstLesson.archivedAt instanceof Date)
  assert.deepEqual(storedFirstLesson.files, [
    {
      fileId: secondFile.id,
      sortOrder: 1,
    },
  ])
})

test('lessons endpoints respect lessons_enabled flag and archived group write restrictions', async () => {
  const disabledOwner = await registerUser('disabled-owner')
  const disabledGroup = await createGroup(disabledOwner.accessToken, {
    lessonsEnabled: false,
  })

  const disabledListResult = await request(`/groups/${disabledGroup.id}/lessons`, {
    method: 'GET',
    token: disabledOwner.accessToken,
  })

  assert.equal(disabledListResult.response.status, 403)

  const disabledCreateResult = await request(`/groups/${disabledGroup.id}/lessons`, {
    method: 'POST',
    token: disabledOwner.accessToken,
    body: {
      title: 'Disabled lessons',
    },
  })

  assert.equal(disabledCreateResult.response.status, 403)

  const archivedOwner = await registerUser('archived-owner')
  const archivedGroup = await createGroup(archivedOwner.accessToken)
  const archivedLessonResult = await request<LessonResponse>(`/groups/${archivedGroup.id}/lessons`, {
    method: 'POST',
    token: archivedOwner.accessToken,
    body: {
      title: 'Archived group baseline lesson',
      status: 'DRAFT',
    },
  })

  assert.equal(archivedLessonResult.response.status, 201)
  assert.ok(archivedLessonResult.body)

  const archiveGroupResult = await request(`/groups/${archivedGroup.id}`, {
    method: 'PATCH',
    token: archivedOwner.accessToken,
    body: {
      status: 'ARCHIVED',
    },
  })

  assert.equal(archiveGroupResult.response.status, 200)

  const archivedListResult = await request<LessonResponse[]>(`/groups/${archivedGroup.id}/lessons`, {
    method: 'GET',
    token: archivedOwner.accessToken,
  })

  assert.equal(archivedListResult.response.status, 200)
  assert.ok(archivedListResult.body)
  assert.deepEqual(archivedListResult.body.map((lesson) => lesson.id), [archivedLessonResult.body.id])

  const archivedCreateBlockedResult = await request(`/groups/${archivedGroup.id}/lessons`, {
    method: 'POST',
    token: archivedOwner.accessToken,
    body: {
      title: 'Should not create in archived group',
    },
  })

  assert.equal(archivedCreateBlockedResult.response.status, 403)

  const archivedUpdateBlockedResult = await request(
    `/groups/${archivedGroup.id}/lessons/${archivedLessonResult.body.id}`,
    {
      method: 'PATCH',
      token: archivedOwner.accessToken,
      body: {
        title: 'Should not update in archived group',
      },
    },
  )

  assert.equal(archivedUpdateBlockedResult.response.status, 403)
})

test('lessons endpoints allow manager-owned attachments to be reused and lesson dates to be cleared', async () => {
  const owner = await registerUser('collab-owner')
  const admin = await registerUser('collab-admin')
  const member = await registerUser('collab-member')
  const group = await createGroup(owner.accessToken)
  const adminFile = await createOwnedFile(admin.user.id, 'shared-admin-material')
  const memberFile = await createOwnedFile(member.user.id, 'member-material')

  await prisma.groupMember.createMany({
    data: [
      {
        groupId: group.id,
        userId: admin.user.id,
        role: GroupRole.ADMIN,
      },
      {
        groupId: group.id,
        userId: member.user.id,
        role: GroupRole.USER,
      },
    ],
  })

  const memberFileCreateResult = await request(`/groups/${group.id}/lessons`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Member file should stay unavailable',
      fileIds: [memberFile.id],
    },
  })

  assert.equal(memberFileCreateResult.response.status, 403)

  const collaborativeCreateResult = await request<LessonResponse>(`/groups/${group.id}/lessons`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Collaborative lesson',
      startsAt: '2026-05-10T09:00:00.000Z',
      endsAt: '2026-05-10T10:00:00.000Z',
      fileIds: [adminFile.id],
    },
  })

  assert.equal(collaborativeCreateResult.response.status, 201)
  assert.ok(collaborativeCreateResult.body)
  assert.equal(collaborativeCreateResult.body.startsAt, '2026-05-10T09:00:00.000Z')
  assert.equal(collaborativeCreateResult.body.endsAt, '2026-05-10T10:00:00.000Z')
  assert.deepEqual(collaborativeCreateResult.body.files.map((file) => file.id), [adminFile.id])

  const clearDatesResult = await request<LessonResponse>(
    `/groups/${group.id}/lessons/${collaborativeCreateResult.body.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        startsAt: null,
        endsAt: null,
        fileIds: [adminFile.id],
      },
    },
  )

  assert.equal(clearDatesResult.response.status, 200)
  assert.ok(clearDatesResult.body)
  assert.equal(clearDatesResult.body.startsAt, null)
  assert.equal(clearDatesResult.body.endsAt, null)
  assert.deepEqual(clearDatesResult.body.files.map((file) => file.id), [adminFile.id])

  const storedLesson = await prisma.lesson.findUnique({
    where: {
      id: collaborativeCreateResult.body.id,
    },
    select: {
      startsAt: true,
      endsAt: true,
      files: {
        select: {
          fileId: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  })

  assert.ok(storedLesson)
  assert.equal(storedLesson.startsAt, null)
  assert.equal(storedLesson.endsAt, null)
  assert.deepEqual(storedLesson.files, [
    {
      fileId: adminFile.id,
      sortOrder: 1,
    },
  ])
})

test('lessons endpoints reject endsAt without startsAt on create and update', async () => {
  const owner = await registerUser('date-guard-owner')
  const group = await createGroup(owner.accessToken)

  const createWithoutStartResult = await request(`/groups/${group.id}/lessons`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Invalid lesson slot',
      endsAt: '2026-06-10T10:00:00.000Z',
    },
  })

  assert.equal(createWithoutStartResult.response.status, 400)
  assert.ok(createWithoutStartResult.body)
  assert.ok(
    Array.isArray(createWithoutStartResult.body.errors) &&
      createWithoutStartResult.body.errors.includes('endsAt: cannot be set without startsAt'),
  )

  const validLessonCreateResult = await request<LessonResponse>(`/groups/${group.id}/lessons`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Valid lesson slot',
      startsAt: '2026-06-10T09:00:00.000Z',
    },
  })

  assert.equal(validLessonCreateResult.response.status, 201)
  assert.ok(validLessonCreateResult.body)

  const updateWithoutStartResult = await request(`/groups/${group.id}/lessons/${validLessonCreateResult.body.id}`, {
    method: 'PATCH',
    token: owner.accessToken,
    body: {
      startsAt: null,
      endsAt: '2026-06-10T10:00:00.000Z',
    },
  })

  assert.equal(updateWithoutStartResult.response.status, 400)
  assert.ok(updateWithoutStartResult.body)
  assert.ok(
    Array.isArray(updateWithoutStartResult.body.errors) &&
      updateWithoutStartResult.body.errors.includes('endsAt: cannot be set without startsAt'),
  )
})
