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
})
