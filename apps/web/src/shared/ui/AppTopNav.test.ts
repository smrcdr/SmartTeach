import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import AppTopNav from './AppTopNav.vue'

describe('AppTopNav', () => {
  it('pins brand and sections to the left, profile to the right, and omits search', () => {
    const wrapper = mount(AppTopNav, {
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.find('.top-nav__inner--full').exists()).toBe(true)
    expect(wrapper.find('.top-nav__primary').text()).toContain('SmarTeach')
    expect(wrapper.find('.top-nav__primary').text()).toContain('Главная')
    expect(wrapper.find('.top-nav__primary').text()).toContain('Каталог')
    expect(wrapper.find('.top-nav__primary').text()).toContain('Мои группы')
    expect(wrapper.find('.top-nav__primary').text()).toContain('Чаты')
    expect(wrapper.find('.top-nav__profile').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Поиск"]').exists()).toBe(false)
  })
})
