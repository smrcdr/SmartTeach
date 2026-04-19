import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { appName } from './app/config/brand'
import { pinia } from './app/providers/pinia'
import { vueQueryPluginOptions } from './app/providers/query'
import { useAuthStore } from './features/auth/stores/auth.store'
import router from './router'
import { setUnauthorizedHandler } from './shared/api/client/http'
import './shared/styles/base.css'

document.title = appName

const app = createApp(App)
const authStore = useAuthStore(pinia)

setUnauthorizedHandler(async () => {
  authStore.clearSessionState()

  const currentPath = router.currentRoute.value.fullPath
  const shouldRememberRedirect =
    currentPath !== '/' && currentPath !== '/login' && currentPath !== '/register'

  if (router.currentRoute.value.name !== 'login') {
    await router.push({
      name: 'login',
      query: shouldRememberRedirect ? { redirect: currentPath } : {},
    })
  }
})

app.use(pinia)
app.use(VueQueryPlugin, vueQueryPluginOptions)
app.use(router)
app.mount('#app')
