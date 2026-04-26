import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { readFileSync } from 'node:fs'
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
    expect(wrapper.find('.auth-card').classes()).toContain('auth-card--wide-fields')
    expect(wrapper.find('.auth-page').classes()).toContain('auth-page--centered')
    expect(wrapper.find('.auth-shell').classes()).toContain('auth-shell--wide')
    expect(wrapper.text()).toContain('Регистрация')
    expect(wrapper.find('.auth-card__link-action').text()).toBe('Войти')
    expect(wrapper.text()).not.toContain('Создать профиль')
    expect(wrapper.text()).not.toContain('Новый профиль')
    expect(wrapper.text()).not.toContain('Имя будет видно')
    expect(wrapper.text()).not.toContain('Создайте аккаунт, чтобы присоединяться')
    expect(wrapper.text()).not.toContain('Курсы и классы')
    expect(wrapper.text()).not.toContain('Чаты')
    expect(wrapper.text()).not.toContain('Защищённый доступ')
  })

  it('sets the auth shell width so input fields stay compact', () => {
    const source = readFileSync(`${process.cwd()}/src/pages/auth/RegisterPage.vue`, 'utf8')

    expect(source).toContain('width: min(100%, 480px);')
  })
})
