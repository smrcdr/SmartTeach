import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { createApp } from '../main'
import { AUTH_REFRESH_COOKIE_NAME } from '../modules/auth/auth-refresh-cookie'
import {
  applyCookieJar,
  cloneCookieJar,
  createCookieJar,
  getCookieValue,
  storeResponseCookies,
  type CookieJar,
} from './test-cookie-jar'

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
  cookieJar?: CookieJar
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
  applyCookieJar(headers, init.cookieJar)

  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  storeResponseCookies(response, init.cookieJar)
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
  const registerCookieJar = createCookieJar()

  const registerResult = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: registerPayload,
    cookieJar: registerCookieJar,
  })

  assert.equal(registerResult.response.status, 201)
  assert.ok(registerResult.body)
  assert.equal(registerResult.body.user.email, email)
  assert.equal(registerResult.body.user.displayName, registerPayload.displayName)
  assert.match(String(registerResult.body.sessionId), /^[0-9a-f-]{36}$/i)
  assert.ok(registerResult.body.accessToken)
  assert.ok(getCookieValue(registerCookieJar, AUTH_REFRESH_COOKIE_NAME))
  assert.equal('refreshToken' in registerResult.body, false)
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

  const loginCookieJar = createCookieJar()
  const loginResult = await request<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: {
      email,
      password: registerPayload.password,
    },
    cookieJar: loginCookieJar,
  })

  assert.equal(loginResult.response.status, 200)
  assert.ok(loginResult.body)
  assert.notEqual(loginResult.body.sessionId, registerResult.body.sessionId)
  const loginRefreshToken = getCookieValue(
    loginCookieJar,
    AUTH_REFRESH_COOKIE_NAME,
  )
  assert.ok(loginRefreshToken)

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
    cookieJar: loginCookieJar,
  })

  assert.equal(refreshResult.response.status, 200)
  assert.ok(refreshResult.body)
  assert.equal(refreshResult.body.sessionId, loginResult.body.sessionId)
  assert.equal('refreshToken' in refreshResult.body, false)
  const rotatedRefreshToken = getCookieValue(
    loginCookieJar,
    AUTH_REFRESH_COOKIE_NAME,
  )
  assert.ok(rotatedRefreshToken)
  assert.notEqual(rotatedRefreshToken, loginRefreshToken)

  const staleRefreshCookieJar = createCookieJar()
  staleRefreshCookieJar.set(AUTH_REFRESH_COOKIE_NAME, loginRefreshToken)
  const oldRefreshTokenResult = await request('/auth/refresh', {
    method: 'POST',
    cookieJar: staleRefreshCookieJar,
  })

  assert.equal(oldRefreshTokenResult.response.status, 401)

  const logoutResult = await request('/auth/logout', {
    method: 'POST',
    cookieJar: loginCookieJar,
  })

  assert.equal(logoutResult.response.status, 204)
  assert.equal(logoutResult.body, null)
  assert.equal(getCookieValue(loginCookieJar, AUTH_REFRESH_COOKIE_NAME), undefined)

  const revokedSessionMeResult = await request('/auth/me', {
    method: 'GET',
    token: String(refreshResult.body.accessToken),
  })

  assert.equal(revokedSessionMeResult.response.status, 401)

  const missingRefreshCookieResult = await request('/auth/refresh', {
    method: 'POST',
  })

  assert.equal(missingRefreshCookieResult.response.status, 401)
})

test('concurrent refresh keeps only one rotated token valid', async () => {
  const email = `auth-race-${Date.now()}@smarteach.local`
  const registerCookieJar = createCookieJar()
  const registerResult = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: 'Concurrent Refresh User',
    },
    cookieJar: registerCookieJar,
  })

  assert.equal(registerResult.response.status, 201)
  assert.ok(registerResult.body)
  createdUserIds.add(String(registerResult.body.user.id))

  const refreshToken = getCookieValue(
    registerCookieJar,
    AUTH_REFRESH_COOKIE_NAME,
  )
  assert.ok(refreshToken)
  const firstRefreshCookieJar = cloneCookieJar(registerCookieJar)
  const secondRefreshCookieJar = cloneCookieJar(registerCookieJar)
  const [firstRefreshResult, secondRefreshResult] = await Promise.all([
    request<TokenPairResponse>('/auth/refresh', {
      method: 'POST',
      cookieJar: firstRefreshCookieJar,
    }),
    request<TokenPairResponse>('/auth/refresh', {
      method: 'POST',
      cookieJar: secondRefreshCookieJar,
    }),
  ])

  const statuses = [
    firstRefreshResult.response.status,
    secondRefreshResult.response.status,
  ].sort()

  assert.deepEqual(statuses, [200, 401])

  const successfulRefresh = [firstRefreshResult, secondRefreshResult].find(
    (result) => result.response.status === 200,
  )

  const successfulRefreshBody = successfulRefresh?.body
  assert.ok(successfulRefreshBody)
  assert.equal(successfulRefreshBody.sessionId, registerResult.body.sessionId)
  assert.equal('refreshToken' in successfulRefreshBody, false)

  const successfulRefreshCookieJar =
    firstRefreshResult.response.status === 200
      ? firstRefreshCookieJar
      : secondRefreshCookieJar
  assert.notEqual(
    getCookieValue(successfulRefreshCookieJar, AUTH_REFRESH_COOKIE_NAME),
    refreshToken,
  )

  const staleRefreshCookieJar = createCookieJar()
  staleRefreshCookieJar.set(AUTH_REFRESH_COOKIE_NAME, refreshToken)
  const staleRefreshResult = await request('/auth/refresh', {
    method: 'POST',
    cookieJar: staleRefreshCookieJar,
  })

  assert.equal(staleRefreshResult.response.status, 401)
})
