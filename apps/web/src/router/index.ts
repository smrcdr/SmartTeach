import { createRouter, createWebHistory } from 'vue-router'

import { installRouterGuards } from './guards'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_, __, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

installRouterGuards(router)

export default router
