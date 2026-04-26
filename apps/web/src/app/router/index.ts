import { createRouter, createWebHistory } from 'vue-router'
import { installAuthGuard } from './guards'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

installAuthGuard(router)
