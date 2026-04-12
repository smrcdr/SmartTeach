import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { createApp } from '../main'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for auth/users e2e tests.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})

const createdUserIds = new Set<string>()
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
    email: string
    displayName: string
    bio: string | null
    avatarFileId: string | null
  }
  accessToken: string
  refreshToken: string
  sessionId: string
}

type UserResponse = {
  id: string
  email: string
  displayName: string
  bio: string | null
  avatarFileId: string | null
}

type PublicUserResponse = {
  id: string
  displayName: string
  bio: string | null
  avatarFileId: string | null
}

type TokenPairResponse = {
  accessToken: string
  refreshToken: string
  sessionId: string
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

test('auth and users endpoints support full session lifecycle', async () => {
  const email = `auth-user-${Date.now()}@smarteach.local`
  const registerPayload = {
    email,
    password: 'Password123!',
    displayName: 'Auth Test User',
  }

  const registerResult = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: registerPayload,
  })

  assert.equal(registerResult.response.status, 201)
  assert.ok(registerResult.body)
  assert.equal(registerResult.body.user.email, email)
  assert.equal(registerResult.body.user.displayName, registerPayload.displayName)
  assert.match(String(registerResult.body.sessionId), /^[0-9a-f-]{36}$/i)
  assert.ok(registerResult.body.accessToken)
  assert.ok(registerResult.body.refreshToken)
  createdUserIds.add(String(registerResult.body.user.id))

  const duplicateRegistrationResult = await request('/auth/register', {
    method: 'POST',
    body: registerPayload,
  })

  assert.equal(duplicateRegistrationResult.response.status, 409)

  const invalidLoginResult = await request('/auth/login', {
    method: 'POST',
    body: {
      email,
      password: 'WrongPassword123!',
    },
  })

  assert.equal(invalidLoginResult.response.status, 401)

  const loginResult = await request<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: {
      email,
      password: registerPayload.password,
    },
  })

  assert.equal(loginResult.response.status, 200)
  assert.ok(loginResult.body)
  assert.notEqual(loginResult.body.sessionId, registerResult.body.sessionId)

  const authMeResult = await request<UserResponse>('/auth/me', {
    method: 'GET',
    token: String(loginResult.body.accessToken),
  })

  assert.equal(authMeResult.response.status, 200)
  assert.ok(authMeResult.body)
  assert.equal(authMeResult.body.email, email)

  const updateProfileResult = await request<UserResponse>('/users/me', {
    method: 'PATCH',
    token: String(loginResult.body.accessToken),
    body: {
      displayName: 'Updated Auth User',
      bio: 'Updated bio from e2e test.',
    },
  })

  assert.equal(updateProfileResult.response.status, 200)
  assert.ok(updateProfileResult.body)
  assert.equal(updateProfileResult.body.displayName, 'Updated Auth User')
  assert.equal(updateProfileResult.body.bio, 'Updated bio from e2e test.')

  const publicProfileResult = await request<PublicUserResponse>(
    `/users/${String(registerResult.body.user.id)}`,
    {
      method: 'GET',
      token: String(loginResult.body.accessToken),
    },
  )

  assert.equal(publicProfileResult.response.status, 200)
  assert.ok(publicProfileResult.body)
  assert.equal(publicProfileResult.body.displayName, 'Updated Auth User')
  assert.equal('email' in publicProfileResult.body, false)

  const refreshResult = await request<TokenPairResponse>('/auth/refresh', {
    method: 'POST',
    body: {
      refreshToken: String(loginResult.body.refreshToken),
    },
  })

  assert.equal(refreshResult.response.status, 200)
  assert.ok(refreshResult.body)
  assert.equal(refreshResult.body.sessionId, loginResult.body.sessionId)
  assert.notEqual(refreshResult.body.refreshToken, loginResult.body.refreshToken)

  const oldRefreshTokenResult = await request('/auth/refresh', {
    method: 'POST',
    body: {
      refreshToken: String(loginResult.body.refreshToken),
    },
  })

  assert.equal(oldRefreshTokenResult.response.status, 401)

  const logoutResult = await request('/auth/logout', {
    method: 'POST',
    token: String(refreshResult.body.accessToken),
    body: {
      refreshToken: String(refreshResult.body.refreshToken),
    },
  })

  assert.equal(logoutResult.response.status, 204)
  assert.equal(logoutResult.body, null)

  const revokedSessionMeResult = await request('/auth/me', {
    method: 'GET',
    token: String(refreshResult.body.accessToken),
  })

  assert.equal(revokedSessionMeResult.response.status, 401)
})
