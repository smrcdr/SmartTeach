import type { Router, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'

type AuthState = {
  ensureSession: () => Promise<boolean>
}

type GuardTarget = Pick<RouteLocationNormalized, 'fullPath' | 'meta'>

export function createAuthGuard(getAuth: () => AuthState) {
  return async (to: GuardTarget) => {
    const auth = getAuth()

    if (!to.meta.requiresAuth) {
      return true
    }

    if (await auth.ensureSession()) {
      return true
    }

    return {
      name: 'login',
      query: {
        redirect: to.fullPath
      }
    }
  }
}

export function installAuthGuard(router: Router) {
  router.beforeEach(createAuthGuard(() => useAuthStore()))
}
