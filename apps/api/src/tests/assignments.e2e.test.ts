import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { GroupRole, PrismaClient } from '@prisma/client'
import { createApp } from '../main'
import { MinioService } from '../storage/minio/minio.service'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for assignments e2e tests.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})

const createdUserIds = new Set<string>()
const createdGroupIds = new Set<string>()
const createdFileIds = new Set<string>()
const createdLessonIds = new Set<string>()
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

  if (createdLessonIds.size > 0) {
    await prisma.lesson.deleteMany({
      where: {
        id: {
          in: [...createdLessonIds],
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

type AssignmentResponse = {
  id: string
  groupId: string
  lessonId: string | null
  title: string
  content: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  dueAt: string | null
  maxScore: number | null
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
  const email = `assignments-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Assignments ${label}`,
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
    assignmentsEnabled?: boolean
  } = {},
) {
  const result = await request<GroupResponse>('/groups', {
    method: 'POST',
    token: ownerToken,
    body: {
      name: `Assignments Group ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: 'Group for assignments API tests.',
      accessMode: 'BY_REQUEST',
      settings: {
        chatEnabled: true,
        lessonsEnabled: true,
        assignmentsEnabled: options.assignmentsEnabled ?? true,
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
      storageKey: `assignments/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${label}.pdf`,
      originalName: `${label}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: BigInt(2048),
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

async function createLesson(groupId: string, userId: string, title: string) {
  const lesson = await prisma.lesson.create({
    data: {
      groupId,
      title,
      status: 'PUBLISHED',
      sortOrder: 1,
      createdByUserId: userId,
      publishedAt: new Date(),
    },
    select: {
      id: true,
    },
  })

  createdLessonIds.add(lesson.id)

  return lesson
}

test('assignment endpoints create, list, get and update assignments inside one group', async () => {
  const owner = await registerUser('owner')
  const member = await registerUser('member')
  const outsider = await registerUser('outsider')
  const group = await createGroup(owner.accessToken)
  const secondGroup = await createGroup(owner.accessToken)
  const lesson = await createLesson(group.id, owner.user.id, 'Assignment lesson')
  const foreignLesson = await createLesson(secondGroup.id, owner.user.id, 'Foreign lesson')
  const firstFile = await createOwnedFile(owner.user.id, 'criteria')
  const secondFile = await createOwnedFile(owner.user.id, 'brief')

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: member.user.id,
      role: GroupRole.USER,
    },
  })

  const firstAssignmentCreateResult = await request<AssignmentResponse>(
    `/groups/${group.id}/assignments`,
    {
      method: 'POST',
      token: owner.accessToken,
      body: {
        lessonId: lesson.id,
        title: 'Contract review report',
        content: 'Сверьте реализацию с OpenAPI.',
        status: 'PUBLISHED',
        dueAt: '2026-05-01T18:00:00.000Z',
        maxScore: 100,
        fileIds: [firstFile.id, secondFile.id],
      },
    },
  )

  assert.equal(firstAssignmentCreateResult.response.status, 201)
  assert.ok(firstAssignmentCreateResult.body)
  assert.equal(firstAssignmentCreateResult.body.lessonId, lesson.id)
  assert.equal(firstAssignmentCreateResult.body.status, 'PUBLISHED')
  assert.equal(firstAssignmentCreateResult.body.maxScore, 100)
  assert.equal(firstAssignmentCreateResult.body.createdByUserId, owner.user.id)
  assert.deepEqual(
    firstAssignmentCreateResult.body.files.map((file) => file.id),
    [firstFile.id, secondFile.id],
  )
  assert.ok(firstAssignmentCreateResult.body.publishedAt)
  assert.equal(firstAssignmentCreateResult.body.archivedAt, null)

  const secondAssignmentCreateResult = await request<AssignmentResponse>(
    `/groups/${group.id}/assignments`,
    {
      method: 'POST',
      token: owner.accessToken,
      body: {
        title: 'Draft without lesson',
        status: 'DRAFT',
      },
    },
  )

  assert.equal(secondAssignmentCreateResult.response.status, 201)
  assert.ok(secondAssignmentCreateResult.body)
  assert.equal(secondAssignmentCreateResult.body.lessonId, null)
  assert.equal(secondAssignmentCreateResult.body.status, 'DRAFT')
  assert.equal(secondAssignmentCreateResult.body.publishedAt, null)

  const initialListResult = await request<AssignmentResponse[]>(`/groups/${group.id}/assignments`, {
    method: 'GET',
    token: member.accessToken,
  })

  assert.equal(initialListResult.response.status, 200)
  assert.ok(initialListResult.body)
  assert.deepEqual(
    initialListResult.body.map((assignment) => assignment.id),
    [firstAssignmentCreateResult.body.id, secondAssignmentCreateResult.body.id],
  )

  const publishedOnlyResult = await request<AssignmentResponse[]>(
    `/groups/${group.id}/assignments?status=PUBLISHED`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(publishedOnlyResult.response.status, 200)
  assert.ok(publishedOnlyResult.body)
  assert.deepEqual(
    publishedOnlyResult.body.map((assignment) => assignment.id),
    [firstAssignmentCreateResult.body.id],
  )

  const lessonFilteredResult = await request<AssignmentResponse[]>(
    `/groups/${group.id}/assignments?lessonId=${lesson.id}`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(lessonFilteredResult.response.status, 200)
  assert.ok(lessonFilteredResult.body)
  assert.deepEqual(
    lessonFilteredResult.body.map((assignment) => assignment.id),
    [firstAssignmentCreateResult.body.id],
  )

  const updatedFirstAssignmentResult = await request<AssignmentResponse>(
    `/groups/${group.id}/assignments/${firstAssignmentCreateResult.body.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        title: 'Reviewed contract report',
        status: 'ARCHIVED',
        maxScore: 95,
        fileIds: [secondFile.id],
      },
    },
  )

  assert.equal(updatedFirstAssignmentResult.response.status, 200)
  assert.ok(updatedFirstAssignmentResult.body)
  assert.equal(updatedFirstAssignmentResult.body.title, 'Reviewed contract report')
  assert.equal(updatedFirstAssignmentResult.body.status, 'ARCHIVED')
  assert.equal(updatedFirstAssignmentResult.body.maxScore, 95)
  assert.ok(updatedFirstAssignmentResult.body.archivedAt)
  assert.deepEqual(updatedFirstAssignmentResult.body.files.map((file) => file.id), [secondFile.id])

  const getAssignmentResult = await request<AssignmentResponse>(
    `/groups/${group.id}/assignments/${firstAssignmentCreateResult.body.id}`,
    {
      method: 'GET',
      token: member.accessToken,
    },
  )

  assert.equal(getAssignmentResult.response.status, 200)
  assert.ok(getAssignmentResult.body)
  assert.equal(getAssignmentResult.body.id, firstAssignmentCreateResult.body.id)
  assert.equal(getAssignmentResult.body.status, 'ARCHIVED')
  assert.deepEqual(getAssignmentResult.body.files.map((file) => file.id), [secondFile.id])

  const foreignLessonCreateResult = await request(`/groups/${group.id}/assignments`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      lessonId: foreignLesson.id,
      title: 'Wrong lesson',
    },
  })

  assert.equal(foreignLessonCreateResult.response.status, 404)

  const wrongGroupAssignmentResult = await request(
    `/groups/${secondGroup.id}/assignments/${firstAssignmentCreateResult.body.id}`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(wrongGroupAssignmentResult.response.status, 404)

  const outsiderListResult = await request(`/groups/${group.id}/assignments`, {
    method: 'GET',
    token: outsider.accessToken,
  })

  assert.equal(outsiderListResult.response.status, 403)

  const memberCreateResult = await request(`/groups/${group.id}/assignments`, {
    method: 'POST',
    token: member.accessToken,
    body: {
      title: 'Member should not create assignments',
    },
  })

  assert.equal(memberCreateResult.response.status, 403)

  const storedFirstAssignment = await prisma.assignment.findUnique({
    where: {
      id: firstAssignmentCreateResult.body.id,
    },
    select: {
      status: true,
      title: true,
      maxScore: true,
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

  assert.ok(storedFirstAssignment)
  assert.equal(storedFirstAssignment.status, 'ARCHIVED')
  assert.equal(storedFirstAssignment.title, 'Reviewed contract report')
  assert.equal(storedFirstAssignment.maxScore, 95)
  assert.ok(storedFirstAssignment.publishedAt instanceof Date)
  assert.ok(storedFirstAssignment.archivedAt instanceof Date)
  assert.deepEqual(storedFirstAssignment.files, [
    {
      fileId: secondFile.id,
      sortOrder: 1,
    },
  ])
})

test('assignment endpoints respect assignments_enabled flag and archived group write restrictions', async () => {
  const disabledOwner = await registerUser('disabled-owner')
  const disabledGroup = await createGroup(disabledOwner.accessToken, {
    assignmentsEnabled: false,
  })

  const disabledListResult = await request(`/groups/${disabledGroup.id}/assignments`, {
    method: 'GET',
    token: disabledOwner.accessToken,
  })

  assert.equal(disabledListResult.response.status, 403)

  const disabledCreateResult = await request(`/groups/${disabledGroup.id}/assignments`, {
    method: 'POST',
    token: disabledOwner.accessToken,
    body: {
      title: 'Disabled assignments',
    },
  })

  assert.equal(disabledCreateResult.response.status, 403)

  const archivedOwner = await registerUser('archived-owner')
  const archivedGroup = await createGroup(archivedOwner.accessToken)
  const archivedAssignmentResult = await request<AssignmentResponse>(
    `/groups/${archivedGroup.id}/assignments`,
    {
      method: 'POST',
      token: archivedOwner.accessToken,
      body: {
        title: 'Archived group baseline assignment',
      },
    },
  )

  assert.equal(archivedAssignmentResult.response.status, 201)
  assert.ok(archivedAssignmentResult.body)

  const archiveGroupResult = await request(`/groups/${archivedGroup.id}`, {
    method: 'PATCH',
    token: archivedOwner.accessToken,
    body: {
      status: 'ARCHIVED',
    },
  })

  assert.equal(archiveGroupResult.response.status, 200)

  const archivedListResult = await request<AssignmentResponse[]>(
    `/groups/${archivedGroup.id}/assignments`,
    {
      method: 'GET',
      token: archivedOwner.accessToken,
    },
  )

  assert.equal(archivedListResult.response.status, 200)
  assert.ok(archivedListResult.body)
  assert.deepEqual(
    archivedListResult.body.map((assignment) => assignment.id),
    [archivedAssignmentResult.body.id],
  )

  const archivedCreateBlockedResult = await request(`/groups/${archivedGroup.id}/assignments`, {
    method: 'POST',
    token: archivedOwner.accessToken,
    body: {
      title: 'Should not create in archived group',
    },
  })

  assert.equal(archivedCreateBlockedResult.response.status, 403)

  const archivedUpdateBlockedResult = await request(
    `/groups/${archivedGroup.id}/assignments/${archivedAssignmentResult.body.id}`,
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

test('assignment endpoints allow manager-owned attachments and reject regular member files', async () => {
  const owner = await registerUser('collab-owner')
  const admin = await registerUser('collab-admin')
  const member = await registerUser('collab-member')
  const group = await createGroup(owner.accessToken)
  const adminFile = await createOwnedFile(admin.user.id, 'shared-admin-brief')
  const memberFile = await createOwnedFile(member.user.id, 'member-brief')

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

  const memberFileCreateResult = await request(`/groups/${group.id}/assignments`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      title: 'Member file should stay unavailable',
      fileIds: [memberFile.id],
    },
  })

  assert.equal(memberFileCreateResult.response.status, 403)

  const collaborativeCreateResult = await request<AssignmentResponse>(
    `/groups/${group.id}/assignments`,
    {
      method: 'POST',
      token: owner.accessToken,
      body: {
        title: 'Collaborative assignment',
        dueAt: '2026-05-10T12:00:00.000Z',
        fileIds: [adminFile.id],
      },
    },
  )

  assert.equal(collaborativeCreateResult.response.status, 201)
  assert.ok(collaborativeCreateResult.body)
  assert.equal(collaborativeCreateResult.body.dueAt, '2026-05-10T12:00:00.000Z')
  assert.deepEqual(collaborativeCreateResult.body.files.map((file) => file.id), [adminFile.id])

  const storedAssignment = await prisma.assignment.findUnique({
    where: {
      id: collaborativeCreateResult.body.id,
    },
    select: {
      dueAt: true,
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

  assert.ok(storedAssignment)
  assert.equal(storedAssignment.dueAt?.toISOString(), '2026-05-10T12:00:00.000Z')
  assert.deepEqual(storedAssignment.files, [
    {
      fileId: adminFile.id,
      sortOrder: 1,
    },
  ])
})
