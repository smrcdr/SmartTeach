import { describe, expect, it, vi } from 'vitest'
import { createAuthGuard } from './guards'
import { routes } from './routes'

function findRouteByName(name: string) {
  for (const route of routes) {
    const child = route.children?.find((item) => item.name === name)
    if (child) {
      return child
    }
  }

  return undefined
}

describe('auth guards', () => {
  it('marks My Groups, Chats and profile edit as protected pages', () => {
    expect(findRouteByName('my-groups')?.meta?.requiresAuth).toBe(true)
    expect(findRouteByName('chats')?.meta?.requiresAuth).toBe(true)
    expect(findRouteByName('profile-edit')?.meta?.requiresAuth).toBe(true)
  })

  it('redirects anonymous users to login with the original target path', async () => {
    const guard = createAuthGuard(() => ({
      ensureSession: vi.fn().mockResolvedValue(false)
    }))

    await expect(guard({
      fullPath: '/chats',
      meta: { requiresAuth: true }
    })).resolves.toEqual({
      name: 'login',
      query: { redirect: '/chats' }
    })
  })

  it('allows protected routes after a session is restored', async () => {
    const guard = createAuthGuard(() => ({
      ensureSession: vi.fn().mockResolvedValue(true)
    }))

    await expect(guard({
      fullPath: '/my-groups',
      meta: { requiresAuth: true }
    })).resolves.toBe(true)
  })
})
