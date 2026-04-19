import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { appName } from './app/config/brand'
import { pinia } from './app/providers/pinia'
import { vueQueryPluginOptions } from './app/providers/query'
import router from './router'
import './shared/styles/base.css'

document.title = appName

const app = createApp(App)

app.use(pinia)
app.use(VueQueryPlugin, vueQueryPluginOptions)
app.use(router)
app.mount('#app')
