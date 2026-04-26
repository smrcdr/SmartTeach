export type ApiRequestOptions = RequestInit & {
  token?: string | null
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

function buildUrl(path: string): string {
  if (path.startsWith('http')) {
    return path
  }

  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: 'include'
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    throw new ApiError(response.statusText || 'API request failed', response.status, payload)
  }

  return payload as T
}
