import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import RegisterPage from './RegisterPage.vue'

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', component: RegisterPage },
      { path: '/login', component: { template: '<span />' } }
    ]
  })

  router.push('/register')
  await router.isReady()

  return mount(RegisterPage, {
    global: {
      plugins: [createPinia(), router]
    }
  })
}

describe('RegisterPage', () => {
  it('shows only the centered registration form without promo copy', async () => {
    const wrapper = await mountPage()

    expect(wrapper.find('.auth-shell__story').exists()).toBe(false)
    expect(wrapper.find('.auth-card__header p').exists()).toBe(false)
    expect(wrapper.find('.auth-page').classes()).toContain('auth-page--centered')
    expect(wrapper.text()).toContain('Регистрация')
    expect(wrapper.text()).not.toContain('Создать профиль')
    expect(wrapper.text()).not.toContain('Новый профиль')
    expect(wrapper.text()).not.toContain('Имя будет видно')
    expect(wrapper.text()).not.toContain('Создайте аккаунт, чтобы присоединяться')
    expect(wrapper.text()).not.toContain('Курсы и классы')
    expect(wrapper.text()).not.toContain('Чаты')
    expect(wrapper.text()).not.toContain('Защищённый доступ')
  })
})
