import createClient from 'openapi-fetch'

import type { components, paths } from '../generated/openapi'

type AuthSession = components['schemas']['AuthSession']
type TokenPair = components['schemas']['TokenPair']
export type AccessSession = Pick<AuthSession, 'accessToken' | 'sessionId'> | Pick<TokenPair, 'accessToken' | 'sessionId'>
type AccessSessionListener = (session: AccessSession | null) => void
type UnauthorizedHandler = () => void | Promise<void>

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1'
const URL_PARSE_BASE = 'http://smarteach.local'
const AUTH_COOKIE_PATHS = new Set(['/auth/login', '/auth/logout', '/auth/register', '/auth/refresh'])
const RETRY_EXCLUDED_PATHS = new Set(['/auth/login', '/auth/logout', '/auth/register', '/auth/refresh'])

const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL)
const apiBasePath = getPathname(apiBaseUrl).replace(/\/$/, '')

let accessToken: string | null = null
let sessionId: string | null = null
let refreshPromise: Promise<AccessSession | null> | null = null
let unauthorizedHandler: UnauthorizedHandler | null = null
let unauthorizedHandlerPromise: Promise<void> | null = null

const accessSessionListeners = new Set<AccessSessionListener>()

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
  emitAccessSession()
}

export function clearAccessSession() {
  accessToken = null
  sessionId = null
  emitAccessSession()
}

export function onAccessSessionChange(listener: AccessSessionListener) {
  accessSessionListeners.add(listener)
  listener(getCurrentAccessSession())

  return () => {
    accessSessionListeners.delete(listener)
  }
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler
}

async function authAwareFetch(input: RequestInfo | URL, init?: RequestInit) {
  const sourceRequest = new Request(input, init)
  const apiPath = getApiPath(sourceRequest)
  const firstResponse = await fetch(buildRequest(sourceRequest, apiPath))

  if (!shouldRefresh(firstResponse, apiPath)) {
    return firstResponse
  }

  const nextAccessSession = await requestSessionRefresh()

  if (!nextAccessSession) {
    await notifyUnauthorized()
    return firstResponse
  }

  return fetch(buildRequest(sourceRequest, apiPath, nextAccessSession.accessToken))
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

export async function requestSessionRefresh() {
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

    return tokenPair
  } catch {
    clearAccessSession()
    return null
  }
}

async function notifyUnauthorized() {
  if (!unauthorizedHandler) {
    return
  }

  if (!unauthorizedHandlerPromise) {
    unauthorizedHandlerPromise = Promise.resolve(unauthorizedHandler()).finally(() => {
      unauthorizedHandlerPromise = null
    })
  }

  await unauthorizedHandlerPromise
}

function emitAccessSession() {
  const session = getCurrentAccessSession()

  for (const listener of accessSessionListeners) {
    listener(session)
  }
}

function getCurrentAccessSession(): AccessSession | null {
  if (!accessToken || !sessionId) {
    return null
  }

  return {
    accessToken,
    sessionId,
  }
}

function getApiPath(request: Request) {
  const requestUrl = new URL(request.url, URL_PARSE_BASE)
  const normalizedPath =
    apiBasePath && requestUrl.pathname.startsWith(apiBasePath)
      ? requestUrl.pathname.slice(apiBasePath.length) || '/'
      : requestUrl.pathname

  return normalizedPath
}

function normalizeBaseUrl(url: string) {
  const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(normalizedUrl) || normalizedUrl.startsWith('/')) {
    return normalizedUrl
  }

  return `/${normalizedUrl}`
}

function getPathname(url: string) {
  return new URL(url, URL_PARSE_BASE).pathname
}
