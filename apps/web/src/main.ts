import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './app/router'
import { initializeTheme } from './shared/theme/theme'
import './shared/styles/tokens.css'
import './shared/styles/base.css'

initializeTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
