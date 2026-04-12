import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { createApp } from '../main'
import { MinioService } from '../storage/minio/minio.service'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for files e2e tests.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})

const createdUserIds = new Set<string>()
const createdFileIds = new Set<string>()
const uploadedObjectKeys: string[] = []
let app: INestApplication
let baseUrl: string

before(async () => {
  app = await createApp({
    enableSwagger: false,
  })

  const minioService = app.get(MinioService)

  minioService.uploadObject = async ({ objectName }) => {
    uploadedObjectKeys.push(objectName)
  }
  minioService.getObjectUrl = async (objectName: string) => {
    return `https://files.smarteach.test/${encodeURIComponent(objectName)}`
  }

  await app.listen(0, '127.0.0.1')
  baseUrl = await app.getUrl()
})

after(async () => {
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

type RawRequestOptions = Omit<RequestInit, 'headers'> & {
  token?: string
  headers?: Record<string, string>
}

type AuthSessionResponse = {
  user: {
    id: string
  }
  accessToken: string
}

type FileResponse = {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  uploadedByUserId: string
  url: string
  createdAt: string
}

type UserResponse = {
  id: string
  email?: string
  displayName: string
  bio: string | null
  avatarFileId: string | null
  avatarUrl: string | null
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

async function requestMultipart<T = JsonRecord>(
  path: string,
  formData: FormData,
  init: RawRequestOptions = {},
) {
  const headers = new Headers(init.headers)

  if (init.token) {
    headers.set('authorization', `Bearer ${init.token}`)
  }

  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    method: init.method,
    headers,
    body: formData,
  })
  const rawBody = await response.text()

  return {
    response,
    body: rawBody.length > 0 ? (JSON.parse(rawBody) as T) : null,
  }
}

async function registerUser(label: string) {
  const email = `files-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Files ${label}`,
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdUserIds.add(String(result.body.user.id))

  return result.body
}

test('files endpoints upload metadata and soft-delete files', async () => {
  uploadedObjectKeys.length = 0
  const session = await registerUser('owner')
  const formData = new FormData()

  formData.set('folder', 'avatars')
  formData.set(
    'file',
    new Blob(['hello from file upload test'], {
      type: 'text/plain',
    }),
    'greeting.txt',
  )

  const uploadResult = await requestMultipart<FileResponse>('/files', formData, {
    method: 'POST',
    token: session.accessToken,
  })

  assert.equal(uploadResult.response.status, 201)
  assert.ok(uploadResult.body)
  assert.equal(uploadResult.body.originalName, 'greeting.txt')
  assert.equal(uploadResult.body.mimeType, 'text/plain')
  assert.equal(uploadResult.body.sizeBytes, 27)
  assert.equal(uploadResult.body.uploadedByUserId, session.user.id)
  assert.match(uploadResult.body.url, /^https:\/\/files\.smarteach\.test\//)
  createdFileIds.add(uploadResult.body.id)

  const storedFile = await prisma.file.findUnique({
    where: {
      id: uploadResult.body.id,
    },
    select: {
      storageKey: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      uploadedByUserId: true,
      deletedAt: true,
    },
  })

  assert.ok(storedFile)
  assert.equal(storedFile.originalName, 'greeting.txt')
  assert.equal(storedFile.mimeType, 'text/plain')
  assert.equal(storedFile.sizeBytes, BigInt(27))
  assert.equal(storedFile.uploadedByUserId, session.user.id)
  assert.equal(storedFile.deletedAt, null)
  assert.match(storedFile.storageKey, /^avatars\/\d{4}\/\d{2}\/\d{2}\/[A-Za-z0-9]{24}\.txt$/)
  assert.deepEqual(uploadedObjectKeys, [storedFile.storageKey])

  const getResult = await request<FileResponse>(`/files/${uploadResult.body.id}`, {
    method: 'GET',
    token: session.accessToken,
  })

  assert.equal(getResult.response.status, 200)
  assert.ok(getResult.body)
  assert.equal(getResult.body.id, uploadResult.body.id)

  const deleteResult = await request(`/files/${uploadResult.body.id}`, {
    method: 'DELETE',
    token: session.accessToken,
  })

  assert.equal(deleteResult.response.status, 204)
  assert.equal(deleteResult.body, null)

  const deletedFile = await prisma.file.findUnique({
    where: {
      id: uploadResult.body.id,
    },
    select: {
      deletedAt: true,
    },
  })

  assert.ok(deletedFile?.deletedAt instanceof Date)

  const getDeletedResult = await request(`/files/${uploadResult.body.id}`, {
    method: 'GET',
    token: session.accessToken,
  })

  assert.equal(getDeletedResult.response.status, 404)
})

test('file upload requires authentication', async () => {
  const formData = new FormData()

  formData.set('folder', 'misc')
  formData.set(
    'file',
    new Blob(['unauthenticated upload'], {
      type: 'text/plain',
    }),
    'unauthenticated.txt',
  )

  const uploadResult = await requestMultipart('/files', formData, {
    method: 'POST',
  })

  assert.equal(uploadResult.response.status, 401)
})

test('file deletion is forbidden for users who did not upload the file', async () => {
  const ownerSession = await registerUser('deleter-owner')
  const otherSession = await registerUser('deleter-other')
  const formData = new FormData()

  formData.set('folder', 'messages')
  formData.set(
    'file',
    new Blob(['chat attachment'], {
      type: 'text/plain',
    }),
    'message.txt',
  )

  const uploadResult = await requestMultipart<FileResponse>('/files', formData, {
    method: 'POST',
    token: ownerSession.accessToken,
  })

  assert.equal(uploadResult.response.status, 201)
  assert.ok(uploadResult.body)
  createdFileIds.add(uploadResult.body.id)

  const forbiddenDeleteResult = await request(`/files/${uploadResult.body.id}`, {
    method: 'DELETE',
    token: otherSession.accessToken,
  })

  assert.equal(forbiddenDeleteResult.response.status, 403)

  const otherGetResult = await request(`/files/${uploadResult.body.id}`, {
    method: 'GET',
    token: otherSession.accessToken,
  })

  assert.equal(otherGetResult.response.status, 404)

  const ownerGetResult = await request<FileResponse>(`/files/${uploadResult.body.id}`, {
    method: 'GET',
    token: ownerSession.accessToken,
  })

  assert.equal(ownerGetResult.response.status, 200)
  assert.ok(ownerGetResult.body)
})

test('avatar file must belong to the current user and must be detached before deletion', async () => {
  const ownerSession = await registerUser('avatar-owner')
  const otherSession = await registerUser('avatar-other')
  const formData = new FormData()

  formData.set('folder', 'avatars')
  formData.set(
    'file',
    new Blob(['avatar attachment'], {
      type: 'text/plain',
    }),
    'avatar.txt',
  )

  const uploadResult = await requestMultipart<FileResponse>('/files', formData, {
    method: 'POST',
    token: ownerSession.accessToken,
  })

  assert.equal(uploadResult.response.status, 201)
  assert.ok(uploadResult.body)
  createdFileIds.add(uploadResult.body.id)

  const foreignAvatarResult = await request('/users/me', {
    method: 'PATCH',
    token: otherSession.accessToken,
    body: {
      avatarFileId: uploadResult.body.id,
    },
  })

  assert.equal(foreignAvatarResult.response.status, 400)
  assert.deepEqual(foreignAvatarResult.body, {
    statusCode: 400,
    message: 'Validation failed',
    errors: ['avatarFileId: File not found'],
  })

  const attachAvatarResult = await request<UserResponse>('/users/me', {
    method: 'PATCH',
    token: ownerSession.accessToken,
    body: {
      avatarFileId: uploadResult.body.id,
    },
  })

  assert.equal(attachAvatarResult.response.status, 200)
  assert.ok(attachAvatarResult.body)
  assert.equal(attachAvatarResult.body.avatarFileId, uploadResult.body.id)
  assert.match(String(attachAvatarResult.body.avatarUrl), /^https:\/\/files\.smarteach\.test\//)

  const publicProfileResult = await request<UserResponse>(`/users/${ownerSession.user.id}`, {
    method: 'GET',
    token: otherSession.accessToken,
  })

  assert.equal(publicProfileResult.response.status, 200)
  assert.ok(publicProfileResult.body)
  assert.equal(publicProfileResult.body.avatarFileId, uploadResult.body.id)
  assert.match(String(publicProfileResult.body.avatarUrl), /^https:\/\/files\.smarteach\.test\//)

  const otherUserGetAvatarFileResult = await request(`/files/${uploadResult.body.id}`, {
    method: 'GET',
    token: otherSession.accessToken,
  })

  assert.equal(otherUserGetAvatarFileResult.response.status, 404)

  const deleteAttachedAvatarResult = await request(`/files/${uploadResult.body.id}`, {
    method: 'DELETE',
    token: ownerSession.accessToken,
  })

  assert.equal(deleteAttachedAvatarResult.response.status, 409)
  assert.deepEqual(deleteAttachedAvatarResult.body, {
    statusCode: 409,
    message: 'File is still attached to existing resources',
  })

  const clearAvatarResult = await request<UserResponse>('/users/me', {
    method: 'PATCH',
    token: ownerSession.accessToken,
    body: {
      avatarFileId: null,
    },
  })

  assert.equal(clearAvatarResult.response.status, 200)
  assert.ok(clearAvatarResult.body)
  assert.equal(clearAvatarResult.body.avatarFileId, null)

  const authMeResult = await request<UserResponse>('/auth/me', {
    method: 'GET',
    token: ownerSession.accessToken,
  })

  assert.equal(authMeResult.response.status, 200)
  assert.ok(authMeResult.body)
  assert.equal(authMeResult.body.avatarFileId, null)

  const deleteDetachedAvatarResult = await request(`/files/${uploadResult.body.id}`, {
    method: 'DELETE',
    token: ownerSession.accessToken,
  })

  assert.equal(deleteDetachedAvatarResult.response.status, 204)
})
