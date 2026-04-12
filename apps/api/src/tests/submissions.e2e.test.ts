import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { GroupRole, PrismaClient } from '@prisma/client'
import { createApp } from '../main'
import { MinioService } from '../storage/minio/minio.service'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for submissions e2e tests.')
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

type SubmissionResponse = {
  id: string
  assignmentId: string
  authorId: string
  attemptNumber: number
  text: string | null
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED'
  score: number | null
  feedback: string | null
  submittedAt: string | null
  reviewedByUserId: string | null
  reviewedAt: string | null
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
  author: {
    id: string
    displayName: string
  }
  reviewer: {
    id: string
    displayName: string
  } | null
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
  const email = `submissions-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Submissions ${label}`,
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
      name: `Submissions Group ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: 'Group for submissions API tests.',
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
      storageKey: `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${label}.pdf`,
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

async function createAssignment(groupId: string, userId: string, title: string) {
  return prisma.assignment.create({
    data: {
      groupId,
      title,
      status: 'PUBLISHED',
      createdByUserId: userId,
      publishedAt: new Date(),
    },
    select: {
      id: true,
    },
  })
}

test('submission endpoints create attempts, scope visibility and allow manager review', async () => {
  const owner = await registerUser('owner')
  const admin = await registerUser('admin')
  const student = await registerUser('student')
  const peer = await registerUser('peer')
  const outsider = await registerUser('outsider')
  const group = await createGroup(owner.accessToken)
  const assignment = await createAssignment(group.id, owner.user.id, 'Submission assignment')
  const studentFile = await createOwnedFile(student.user.id, 'student-solution')
  const studentSecondFile = await createOwnedFile(student.user.id, 'student-second-solution')
  const ownerFile = await createOwnedFile(owner.user.id, 'owner-brief')

  await prisma.groupMember.createMany({
    data: [
      {
        groupId: group.id,
        userId: admin.user.id,
        role: GroupRole.ADMIN,
      },
      {
        groupId: group.id,
        userId: student.user.id,
        role: GroupRole.USER,
      },
      {
        groupId: group.id,
        userId: peer.user.id,
        role: GroupRole.USER,
      },
    ],
  })

  const foreignFileCreateResult = await request(
    `/groups/${group.id}/assignments/${assignment.id}/submissions`,
    {
      method: 'POST',
      token: student.accessToken,
      body: {
        text: 'Нельзя прикреплять файл преподавателя.',
        fileIds: [ownerFile.id],
      },
    },
  )

  assert.equal(foreignFileCreateResult.response.status, 403)

  const firstSubmissionCreateResult = await request<SubmissionResponse>(
    `/groups/${group.id}/assignments/${assignment.id}/submissions`,
    {
      method: 'POST',
      token: student.accessToken,
      body: {
        text: 'Первая версия решения.',
        status: 'SUBMITTED',
        fileIds: [studentFile.id],
      },
    },
  )

  assert.equal(firstSubmissionCreateResult.response.status, 201)
  assert.ok(firstSubmissionCreateResult.body)
  assert.equal(firstSubmissionCreateResult.body.authorId, student.user.id)
  assert.equal(firstSubmissionCreateResult.body.attemptNumber, 1)
  assert.equal(firstSubmissionCreateResult.body.status, 'SUBMITTED')
  assert.ok(firstSubmissionCreateResult.body.submittedAt)
  assert.equal(firstSubmissionCreateResult.body.reviewedAt, null)
  assert.deepEqual(firstSubmissionCreateResult.body.files.map((file) => file.id), [studentFile.id])
  assert.equal(firstSubmissionCreateResult.body.author.id, student.user.id)
  assert.equal(firstSubmissionCreateResult.body.reviewer, null)

  const secondSubmissionCreateResult = await request<SubmissionResponse>(
    `/groups/${group.id}/assignments/${assignment.id}/submissions`,
    {
      method: 'POST',
      token: student.accessToken,
      body: {
        text: 'Черновик второй попытки.',
        status: 'DRAFT',
      },
    },
  )

  assert.equal(secondSubmissionCreateResult.response.status, 201)
  assert.ok(secondSubmissionCreateResult.body)
  assert.equal(secondSubmissionCreateResult.body.attemptNumber, 2)
  assert.equal(secondSubmissionCreateResult.body.status, 'DRAFT')
  assert.equal(secondSubmissionCreateResult.body.submittedAt, null)

  const peerSubmissionCreateResult = await request<SubmissionResponse>(
    `/groups/${group.id}/assignments/${assignment.id}/submissions`,
    {
      method: 'POST',
      token: peer.accessToken,
      body: {
        text: 'Решение второго участника.',
        status: 'SUBMITTED',
      },
    },
  )

  assert.equal(peerSubmissionCreateResult.response.status, 201)
  assert.ok(peerSubmissionCreateResult.body)

  const studentListResult = await request<SubmissionResponse[]>(
    `/groups/${group.id}/assignments/${assignment.id}/submissions`,
    {
      method: 'GET',
      token: student.accessToken,
    },
  )

  assert.equal(studentListResult.response.status, 200)
  assert.ok(studentListResult.body)
  assert.deepEqual(
    studentListResult.body.map((submission) => submission.id),
    [firstSubmissionCreateResult.body.id, secondSubmissionCreateResult.body.id],
  )

  const studentMineFalseResult = await request<SubmissionResponse[]>(
    `/groups/${group.id}/assignments/${assignment.id}/submissions?mineOnly=false`,
    {
      method: 'GET',
      token: student.accessToken,
    },
  )

  assert.equal(studentMineFalseResult.response.status, 200)
  assert.ok(studentMineFalseResult.body)
  assert.deepEqual(
    studentMineFalseResult.body.map((submission) => submission.id),
    [firstSubmissionCreateResult.body.id, secondSubmissionCreateResult.body.id],
  )

  const adminListResult = await request<SubmissionResponse[]>(
    `/groups/${group.id}/assignments/${assignment.id}/submissions`,
    {
      method: 'GET',
      token: admin.accessToken,
    },
  )

  assert.equal(adminListResult.response.status, 200)
  assert.ok(adminListResult.body)
  assert.deepEqual(
    adminListResult.body.map((submission) => submission.id).sort(),
    [
      firstSubmissionCreateResult.body.id,
      secondSubmissionCreateResult.body.id,
      peerSubmissionCreateResult.body.id,
    ].sort(),
  )

  const adminMineOnlyResult = await request<SubmissionResponse[]>(
    `/groups/${group.id}/assignments/${assignment.id}/submissions?mineOnly=true`,
    {
      method: 'GET',
      token: admin.accessToken,
    },
  )

  assert.equal(adminMineOnlyResult.response.status, 200)
  assert.deepEqual(adminMineOnlyResult.body, [])

  const peerGetBlockedResult = await request(
    `/groups/${group.id}/assignments/${assignment.id}/submissions/${firstSubmissionCreateResult.body.id}`,
    {
      method: 'GET',
      token: peer.accessToken,
    },
  )

  assert.equal(peerGetBlockedResult.response.status, 403)

  const outsiderListResult = await request(
    `/groups/${group.id}/assignments/${assignment.id}/submissions`,
    {
      method: 'GET',
      token: outsider.accessToken,
    },
  )

  assert.equal(outsiderListResult.response.status, 403)

  const updatedSecondSubmissionResult = await request<SubmissionResponse>(
    `/groups/${group.id}/assignments/${assignment.id}/submissions/${secondSubmissionCreateResult.body.id}`,
    {
      method: 'PATCH',
      token: student.accessToken,
      body: {
        text: 'Финальная версия второй попытки.',
        status: 'SUBMITTED',
        fileIds: [studentSecondFile.id],
      },
    },
  )

  assert.equal(updatedSecondSubmissionResult.response.status, 200)
  assert.ok(updatedSecondSubmissionResult.body)
  assert.equal(updatedSecondSubmissionResult.body.status, 'SUBMITTED')
  assert.ok(updatedSecondSubmissionResult.body.submittedAt)
  assert.deepEqual(updatedSecondSubmissionResult.body.files.map((file) => file.id), [
    studentSecondFile.id,
  ])

  const reviewSubmissionResult = await request<SubmissionResponse>(
    `/groups/${group.id}/assignments/${assignment.id}/submissions/${firstSubmissionCreateResult.body.id}`,
    {
      method: 'PATCH',
      token: admin.accessToken,
      body: {
        score: 93,
        feedback: 'Хорошее решение, добавьте проверку на archived group.',
      },
    },
  )

  assert.equal(reviewSubmissionResult.response.status, 200)
  assert.ok(reviewSubmissionResult.body)
  assert.equal(reviewSubmissionResult.body.status, 'REVIEWED')
  assert.equal(reviewSubmissionResult.body.score, 93)
  assert.equal(
    reviewSubmissionResult.body.feedback,
    'Хорошее решение, добавьте проверку на archived group.',
  )
  assert.equal(reviewSubmissionResult.body.reviewedByUserId, admin.user.id)
  assert.ok(reviewSubmissionResult.body.reviewedAt)
  assert.equal(reviewSubmissionResult.body.reviewer?.id, admin.user.id)

  const authorEditReviewedBlockedResult = await request(
    `/groups/${group.id}/assignments/${assignment.id}/submissions/${firstSubmissionCreateResult.body.id}`,
    {
      method: 'PATCH',
      token: student.accessToken,
      body: {
        text: 'Попытка изменить уже проверенную работу.',
      },
    },
  )

  assert.equal(authorEditReviewedBlockedResult.response.status, 403)

  const studentReviewBlockedResult = await request(
    `/groups/${group.id}/assignments/${assignment.id}/submissions/${secondSubmissionCreateResult.body.id}`,
    {
      method: 'PATCH',
      token: student.accessToken,
      body: {
        score: 10,
      },
    },
  )

  assert.equal(studentReviewBlockedResult.response.status, 403)

  const storedSubmissions = await prisma.submission.findMany({
    where: {
      assignmentId: assignment.id,
      authorId: student.user.id,
    },
    orderBy: {
      attemptNumber: 'asc',
    },
    select: {
      attemptNumber: true,
      status: true,
      submittedAt: true,
      score: true,
      reviewedByUserId: true,
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

  assert.deepEqual(
    storedSubmissions.map((submission) => submission.attemptNumber),
    [1, 2],
  )
  assert.equal(storedSubmissions[0]?.status, 'REVIEWED')
  assert.equal(storedSubmissions[0]?.score, 93)
  assert.equal(storedSubmissions[0]?.reviewedByUserId, admin.user.id)
  assert.deepEqual(storedSubmissions[0]?.files, [
    {
      fileId: studentFile.id,
      sortOrder: 1,
    },
  ])
  assert.equal(storedSubmissions[1]?.status, 'SUBMITTED')
  assert.ok(storedSubmissions[1]?.submittedAt instanceof Date)
  assert.deepEqual(storedSubmissions[1]?.files, [
    {
      fileId: studentSecondFile.id,
      sortOrder: 1,
    },
  ])
})

test('submission endpoints respect assignments_enabled flag and archived group write restrictions', async () => {
  const disabledOwner = await registerUser('disabled-owner')
  const disabledStudent = await registerUser('disabled-student')
  const disabledGroup = await createGroup(disabledOwner.accessToken)
  const disabledAssignment = await createAssignment(
    disabledGroup.id,
    disabledOwner.user.id,
    'Disabled assignment',
  )

  await prisma.groupMember.create({
    data: {
      groupId: disabledGroup.id,
      userId: disabledStudent.user.id,
      role: GroupRole.USER,
    },
  })

  const disableAssignmentsResult = await request(`/groups/${disabledGroup.id}/settings`, {
    method: 'PATCH',
    token: disabledOwner.accessToken,
    body: {
      assignmentsEnabled: false,
    },
  })

  assert.equal(disableAssignmentsResult.response.status, 200)

  const disabledListResult = await request(
    `/groups/${disabledGroup.id}/assignments/${disabledAssignment.id}/submissions`,
    {
      method: 'GET',
      token: disabledStudent.accessToken,
    },
  )

  assert.equal(disabledListResult.response.status, 403)

  const disabledCreateResult = await request(
    `/groups/${disabledGroup.id}/assignments/${disabledAssignment.id}/submissions`,
    {
      method: 'POST',
      token: disabledStudent.accessToken,
      body: {
        text: 'Should not create while assignments are disabled.',
      },
    },
  )

  assert.equal(disabledCreateResult.response.status, 403)

  const archivedOwner = await registerUser('archived-owner')
  const archivedStudent = await registerUser('archived-student')
  const archivedGroup = await createGroup(archivedOwner.accessToken)
  const archivedAssignment = await createAssignment(
    archivedGroup.id,
    archivedOwner.user.id,
    'Archived group assignment',
  )

  await prisma.groupMember.create({
    data: {
      groupId: archivedGroup.id,
      userId: archivedStudent.user.id,
      role: GroupRole.USER,
    },
  })

  const baselineSubmissionResult = await request<SubmissionResponse>(
    `/groups/${archivedGroup.id}/assignments/${archivedAssignment.id}/submissions`,
    {
      method: 'POST',
      token: archivedStudent.accessToken,
      body: {
        text: 'Работа до архивации группы.',
        status: 'SUBMITTED',
      },
    },
  )

  assert.equal(baselineSubmissionResult.response.status, 201)
  assert.ok(baselineSubmissionResult.body)

  const archiveGroupResult = await request(`/groups/${archivedGroup.id}`, {
    method: 'PATCH',
    token: archivedOwner.accessToken,
    body: {
      status: 'ARCHIVED',
    },
  })

  assert.equal(archiveGroupResult.response.status, 200)

  const archivedListResult = await request<SubmissionResponse[]>(
    `/groups/${archivedGroup.id}/assignments/${archivedAssignment.id}/submissions`,
    {
      method: 'GET',
      token: archivedStudent.accessToken,
    },
  )

  assert.equal(archivedListResult.response.status, 200)
  assert.ok(archivedListResult.body)
  assert.deepEqual(
    archivedListResult.body.map((submission) => submission.id),
    [baselineSubmissionResult.body.id],
  )

  const archivedGetResult = await request<SubmissionResponse>(
    `/groups/${archivedGroup.id}/assignments/${archivedAssignment.id}/submissions/${baselineSubmissionResult.body.id}`,
    {
      method: 'GET',
      token: archivedStudent.accessToken,
    },
  )

  assert.equal(archivedGetResult.response.status, 200)
  assert.ok(archivedGetResult.body)

  const archivedCreateBlockedResult = await request(
    `/groups/${archivedGroup.id}/assignments/${archivedAssignment.id}/submissions`,
    {
      method: 'POST',
      token: archivedStudent.accessToken,
      body: {
        text: 'Should not create in archived group.',
      },
    },
  )

  assert.equal(archivedCreateBlockedResult.response.status, 403)

  const archivedUpdateBlockedResult = await request(
    `/groups/${archivedGroup.id}/assignments/${archivedAssignment.id}/submissions/${baselineSubmissionResult.body.id}`,
    {
      method: 'PATCH',
      token: archivedStudent.accessToken,
      body: {
        text: 'Should not update in archived group.',
      },
    },
  )

  assert.equal(archivedUpdateBlockedResult.response.status, 403)
})
