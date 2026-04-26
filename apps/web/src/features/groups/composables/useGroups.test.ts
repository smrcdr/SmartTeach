import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGroups } from './useGroups'

const TestComponent = defineComponent({
  setup() {
    return useGroups()
  },
  template: '<span>{{ groups.length }}</span>'
})

describe('useGroups', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads public groups without an active session', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 'group-id' }]), { status: 200 })
    )
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [createPinia()]
      }
    })

    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/groups', expect.objectContaining({
      credentials: 'include',
      headers: expect.any(Headers)
    }))
    expect(wrapper.text()).toBe('1')
  })
})
