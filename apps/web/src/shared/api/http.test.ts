import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from './http'

const fetchMock = vi.fn()

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
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
})
