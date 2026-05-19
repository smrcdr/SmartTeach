export type ApiRequestOptions = RequestInit & {
  token?: string | null
  skipAuthRefresh?: boolean
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown
  ) {
    super(message)
  }
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? '/api/v1'
let authRefreshHandler: (() => Promise<string | null>) | null = null
let authSessionClearHandler: (() => void) | null = null

export function configureAuthRefresh(
  refreshHandler: (() => Promise<string | null>) | null,
  clearHandler: (() => void) | null = null
) {
  authRefreshHandler = refreshHandler
  authSessionClearHandler = clearHandler
}

function buildUrl(path: string): string {
  if (path.startsWith('http')) {
    return path
  }

  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getPayloadMessage(payload: unknown): string | null {
  if (typeof payload === 'string') {
    return payload
  }

  if (!payload || typeof payload !== 'object' || !('message' in payload)) {
    return null
  }

  const message = payload.message

  if (typeof message === 'string') {
    return message
  }

  if (Array.isArray(message)) {
    return message.map(String).join(', ')
  }

  return null
}

async function sendRequest(path: string, options: ApiRequestOptions, token: string | null | undefined) {
  const headers = new Headers(options.headers)
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData

  if (!headers.has('Content-Type') && options.body && !isFormDataBody) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    return await fetch(buildUrl(path), {
      ...options,
      headers,
      credentials: 'include'
    })
  } catch (caught) {
    throw new ApiError('Не удалось подключиться к серверу', 0, caught)
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  let response = await sendRequest(path, options, options.token)
  let payload = await readPayload(response)

  if (
    response.status === 401 &&
    options.token &&
    !options.skipAuthRefresh &&
    authRefreshHandler
  ) {
    const refreshedToken = await authRefreshHandler()

    if (refreshedToken) {
      response = await sendRequest(path, options, refreshedToken)
      payload = await readPayload(response)
    } else {
      authSessionClearHandler?.()
    }
  }

  if (!response.ok) {
    throw new ApiError(
      getPayloadMessage(payload) ?? (response.statusText || 'API request failed'),
      response.status,
      payload
    )
  }

  return payload as T
}
