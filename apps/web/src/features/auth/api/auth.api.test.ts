import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login, refresh, register } from './auth.api'

const fetchMock = vi.fn()

describe('auth api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        accessToken: 'token',
        sessionId: 'session',
        user: {
          id: 'user-id',
          email: 'student@smarteach.local',
          displayName: 'Student Example',
          bio: null,
          avatarUrl: null
        }
      }))
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('posts login credentials to the versioned backend auth endpoint', async () => {
    await login({ email: 'student@smarteach.local', password: 'Password123!' })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({
      method: 'POST'
    }))
  })

  it('sends displayName when registering users', async () => {
    await register({
      email: 'student@smarteach.local',
      password: 'Password123!',
      displayName: 'Student Example'
    })

    const [, options] = fetchMock.mock.calls[0]
    expect(JSON.parse(options.body)).toEqual({
      email: 'student@smarteach.local',
      password: 'Password123!',
      displayName: 'Student Example'
    })
  })

  it('can refresh an access token from the refresh cookie', async () => {
    await refresh()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/refresh', expect.objectContaining({
      method: 'POST',
      credentials: 'include'
    }))
  })
})
