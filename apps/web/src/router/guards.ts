import type { Router } from 'vue-router'

import { appName } from '../app/config/brand'

export function installRouterGuards(router: Router) {
  router.afterEach((to) => {
    const rawTitle = typeof to.meta.title === 'string' ? to.meta.title : appName

    document.title = rawTitle.includes(appName) ? rawTitle : `${rawTitle} | ${appName}`
  })
}
