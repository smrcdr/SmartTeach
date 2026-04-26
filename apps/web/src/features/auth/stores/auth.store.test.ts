import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth.store'

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('does not expose a demo user when backend session data is absent', () => {
    const auth = useAuthStore()

    expect(auth.user).toBeNull()
    expect(auth.displayUser).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })
})
