import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { useGroups } from './useGroups'

const TestComponent = defineComponent({
  setup() {
    return useGroups()
  },
  template: '<span>{{ groups.length }}</span>'
})

describe('useGroups', () => {
  it('starts without demo groups before backend data is loaded', () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.text()).toBe('0')
  })
})
