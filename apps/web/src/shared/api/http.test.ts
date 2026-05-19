import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, configureAuthRefresh } from './http'

const fetchMock = vi.fn()

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    configureAuthRefresh(null)
  })

  it('uses backend error payload messages instead of bare status text', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve(JSON.stringify({
        statusCode: 401,
        message: 'Invalid email or password'
      }))
    })

    await expect(apiRequest('/auth/login')).rejects.toMatchObject({
      message: 'Invalid email or password',
      status: 401
    })
  })

  it('normalizes network failures into api errors', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(apiRequest('/auth/login')).rejects.toBeInstanceOf(ApiError)
    await expect(apiRequest('/auth/login')).rejects.toMatchObject({
      message: 'Не удалось подключиться к серверу',
      status: 0
    })
  })

  it('retries once with a refreshed token after 401 responses', async () => {
    vi.stubGlobal('fetch', fetchMock)
    const refreshHandler = vi.fn().mockResolvedValue('fresh-token')
    configureAuthRefresh(refreshHandler)

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        statusCode: 401,
        message: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))

    const result = await apiRequest<{ items: unknown[] }>('/groups', {
      token: 'expired-token'
    })

    expect(result).toEqual({ items: [] })
    expect(refreshHandler).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: 'include'
    })
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer expired-token')
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get('Authorization')).toBe('Bearer fresh-token')
  })

  it('does not retry when auth refresh is disabled for the request', async () => {
    vi.stubGlobal('fetch', fetchMock)
    const refreshHandler = vi.fn().mockResolvedValue('fresh-token')
    configureAuthRefresh(refreshHandler)

    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      statusCode: 401,
      message: 'Unauthorized'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }))

    await expect(apiRequest('/auth/refresh', {
      token: 'expired-token',
      skipAuthRefresh: true
    })).rejects.toMatchObject({
      status: 401
    })

    expect(refreshHandler).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
