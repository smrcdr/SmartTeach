import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import LoginPage from './LoginPage.vue'

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginPage },
      { path: '/register', component: { template: '<span />' } }
    ]
  })

  router.push('/login')
  await router.isReady()

  return mount(LoginPage, {
    global: {
      plugins: [createPinia(), router]
    }
  })
}

describe('LoginPage', () => {
  it('shows only the centered login form without promo copy', async () => {
    const wrapper = await mountPage()

    expect(wrapper.find('.auth-shell__story').exists()).toBe(false)
    expect(wrapper.find('.auth-card__header p').exists()).toBe(false)
    expect(wrapper.find('.auth-page').classes()).toContain('auth-page--centered')
    expect(wrapper.text()).toContain('Войти')
    expect(wrapper.text()).not.toContain('Закрытая рабочая область')
    expect(wrapper.text()).not.toContain('Используйте email')
    expect(wrapper.text()).not.toContain('Учебные материалы')
    expect(wrapper.text()).not.toContain('Групповые чаты')
    expect(wrapper.text()).not.toContain('Защищённая сессия')
  })
})
