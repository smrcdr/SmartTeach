import createClient from 'openapi-fetch'

import type { components, paths } from '../generated/openapi'

type AuthSession = components['schemas']['AuthSession']
type TokenPair = components['schemas']['TokenPair']
type AccessSession = Pick<AuthSession, 'accessToken' | 'sessionId'> | Pick<TokenPair, 'accessToken' | 'sessionId'>

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1'
const AUTH_COOKIE_PATHS = new Set(['/auth/login', '/auth/logout', '/auth/register', '/auth/refresh'])
const RETRY_EXCLUDED_PATHS = new Set(['/auth/login', '/auth/logout', '/auth/register', '/auth/refresh'])

const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL)
const apiBasePath = new URL(apiBaseUrl).pathname.replace(/\/$/, '')

let accessToken: string | null = null
let sessionId: string | null = null
let refreshPromise: Promise<string | null> | null = null

export const apiClient = createClient<paths>({
  baseUrl: apiBaseUrl,
  fetch: authAwareFetch,
})

export function getApiBaseUrl() {
  return apiBaseUrl
}

export function getAccessToken() {
  return accessToken
}

export function getSessionId() {
  return sessionId
}

export function applyAccessSession(session: AccessSession) {
  accessToken = session.accessToken
  sessionId = session.sessionId
}

export function clearAccessSession() {
  accessToken = null
  sessionId = null
}

async function authAwareFetch(input: RequestInfo | URL, init?: RequestInit) {
  const sourceRequest = new Request(input, init)
  const apiPath = getApiPath(sourceRequest)
  const firstResponse = await fetch(buildRequest(sourceRequest, apiPath))

  if (!shouldRefresh(firstResponse, apiPath)) {
    return firstResponse
  }

  const nextAccessToken = await refreshAccessToken()

  if (!nextAccessToken) {
    return firstResponse
  }

  return fetch(buildRequest(sourceRequest, apiPath, nextAccessToken))
}

function buildRequest(sourceRequest: Request, apiPath: string, forcedAccessToken: string | null = accessToken) {
  const requestClone = sourceRequest.clone()
  const headers = new Headers(requestClone.headers)

  if (forcedAccessToken && shouldAttachBearer(apiPath) && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${forcedAccessToken}`)
  }

  return new Request(requestClone, {
    headers,
    credentials: shouldIncludeCredentials(apiPath) ? 'include' : requestClone.credentials,
  })
}

function shouldAttachBearer(apiPath: string) {
  return !AUTH_COOKIE_PATHS.has(apiPath)
}

function shouldIncludeCredentials(apiPath: string) {
  return AUTH_COOKIE_PATHS.has(apiPath)
}

function shouldRefresh(response: Response, apiPath: string) {
  return response.status === 401 && !RETRY_EXCLUDED_PATHS.has(apiPath)
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

async function performRefresh() {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      clearAccessSession()
      return null
    }

    const tokenPair = (await response.json()) as TokenPair
    applyAccessSession(tokenPair)

    return tokenPair.accessToken
  } catch {
    clearAccessSession()
    return null
  }
}

function getApiPath(request: Request) {
  const requestUrl = new URL(request.url, apiBaseUrl)
  const normalizedPath =
    apiBasePath && requestUrl.pathname.startsWith(apiBasePath)
      ? requestUrl.pathname.slice(apiBasePath.length) || '/'
      : requestUrl.pathname

  return normalizedPath
}

function normalizeBaseUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url
}
