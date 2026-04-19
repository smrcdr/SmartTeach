import type { Router } from 'vue-router'

import { appName } from '../app/config/brand'
import { pinia } from '../app/providers/pinia'
import { useAuthStore } from '../features/auth/stores/auth.store'

export function installRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore(pinia)

    if (!authStore.hasInitialized) {
      await authStore.initialize()
    }

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const guestOnly = to.matched.some((record) => record.meta.guestOnly)

    if (requiresAuth && !authStore.isAuthenticated) {
      return {
        name: 'login',
        query: to.fullPath === '/groups' ? {} : { redirect: to.fullPath },
      }
    }

    if (guestOnly && authStore.isAuthenticated) {
      return {
        name: 'groups',
      }
    }

    return true
  })

  router.afterEach((to) => {
    const rawTitle = typeof to.meta.title === 'string' ? to.meta.title : appName

    document.title = rawTitle.includes(appName) ? rawTitle : `${rawTitle} | ${appName}`
  })
}
