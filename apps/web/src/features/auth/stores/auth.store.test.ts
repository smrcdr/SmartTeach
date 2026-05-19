import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from './auth.store'

const fetchMock = vi.fn()

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('does not expose a demo user when backend session data is absent', () => {
    const auth = useAuthStore()

    expect(auth.user).toBeNull()
    expect(auth.displayUser).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('normalizes invalid credentials into a user-facing message', async () => {
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

    const auth = useAuthStore()

    await expect(auth.login({
      email: 'student@smarteach.local',
      password: 'wrong'
    })).rejects.toThrow()

    expect(auth.error).toBe('Неверный email или пароль')
  })

  it('normalizes backend failures into a stable auth message', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve(JSON.stringify({
        statusCode: 500,
        message: 'Internal server error'
      }))
    })

    const auth = useAuthStore()

    await expect(auth.login({
      email: 'student@smarteach.local',
      password: 'Password123!'
    })).rejects.toThrow()

    expect(auth.error).toBe('Сервер временно недоступен. Попробуйте позже')
  })

  it('normalizes backend validation errors into concrete auth messages', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve(JSON.stringify({
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          'email: Invalid email address',
          'password: Too small: expected string to have >=8 characters'
        ]
      }))
    })

    const auth = useAuthStore()

    await expect(auth.register({
      displayName: 'Student Example',
      email: 'wrong-email',
      password: 'short'
    })).rejects.toThrow()

    expect(auth.error).toBe('Введите корректный email')
  })

  it('falls back to a concrete password validation message from backend errors', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve(JSON.stringify({
        statusCode: 400,
        message: 'Validation failed',
        errors: ['password: Too small: expected string to have >=8 characters']
      }))
    })

    const auth = useAuthStore()

    await expect(auth.register({
      displayName: 'Student Example',
      email: 'student@smarteach.local',
      password: 'short'
    })).rejects.toThrow()

    expect(auth.error).toBe('Пароль должен быть не короче 8 символов')
  })

  it('refreshes an expired stored session instead of clearing it', async () => {
    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smarteach.accessToken', 'expired-token')
    localStorage.setItem('smarteach.sessionId', 'old-session')

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        statusCode: 401,
        message: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        accessToken: 'fresh-token',
        sessionId: 'fresh-session'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'user-1',
        email: 'student@smarteach.local',
        displayName: 'Student Example'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))

    const auth = useAuthStore()

    await expect(auth.ensureSession()).resolves.toBe(true)

    expect(auth.accessToken).toBe('fresh-token')
    expect(auth.sessionId).toBe('fresh-session')
    expect(auth.user).toMatchObject({
      id: 'user-1',
      email: 'student@smarteach.local',
      displayName: 'Student Example'
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer expired-token')
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get('Authorization')).toBeNull()
    expect(new Headers(fetchMock.mock.calls[2]?.[1]?.headers).get('Authorization')).toBe('Bearer fresh-token')
  })
})
