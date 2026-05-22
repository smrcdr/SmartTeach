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

const staleChunkReloadKey = 'smarteach:stale-chunk-reload'

function isStaleChunkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('disallowed MIME type') ||
    message.includes('ChunkLoadError')
  )
}

router.onError((error) => {
  if (!isStaleChunkError(error)) {
    return
  }

  if (sessionStorage.getItem(staleChunkReloadKey) === '1') {
    sessionStorage.removeItem(staleChunkReloadKey)
    return
  }

  sessionStorage.setItem(staleChunkReloadKey, '1')
  window.location.reload()
})

router.afterEach(() => {
  sessionStorage.removeItem(staleChunkReloadKey)
})

installAuthGuard(router)
