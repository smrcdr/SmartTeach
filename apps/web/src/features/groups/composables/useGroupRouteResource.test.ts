import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent, reactive } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useGroupRouteItem, useGroupRouteList } from './useGroupRouteResource'

const route = reactive({
  params: {
    groupId: 'group-id',
    itemId: 'item-id'
  }
})

vi.mock('vue-router', () => ({
  useRoute: () => route
}))

describe('useGroupRouteResource', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('reloads a route list after the auth token becomes available', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 'resource-id' }]), { status: 200 })
    )

    const TestComponent = defineComponent({
      setup() {
        const auth = useAuthStore()
        const resourceList = useGroupRouteList(async (groupId, token) => {
          const response = await fetch(`/api/v1/groups/${groupId}/useful-links`, {
            headers: {
              authorization: `Bearer ${token}`
            }
          })

          return response.json()
        })

        return {
          auth,
          items: resourceList.items
        }
      },
      template: '<span>{{ items.length }}</span>'
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [createPinia()]
      }
    })

    await flushPromises()
    expect(fetchMock).not.toHaveBeenCalled()

    wrapper.vm.auth.accessToken = 'access-token'
    await flushPromises()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/groups/group-id/useful-links',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer access-token'
        })
      })
    )
    expect(wrapper.text()).toBe('1')
  })

  it('reloads a route item after the auth token becomes available', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'resource-id' }), { status: 200 })
    )

    const TestComponent = defineComponent({
      setup() {
        const auth = useAuthStore()
        const resourceItem = useGroupRouteItem('itemId', async (groupId, itemId, token) => {
          const response = await fetch(`/api/v1/groups/${groupId}/lessons/${itemId}`, {
            headers: {
              authorization: `Bearer ${token}`
            }
          })

          return response.json()
        })

        return {
          auth,
          item: resourceItem.item
        }
      },
      template: '<span>{{ item?.id ?? "" }}</span>'
    })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [createPinia()]
      }
    })

    await flushPromises()
    expect(fetchMock).not.toHaveBeenCalled()

    wrapper.vm.auth.accessToken = 'access-token'
    await flushPromises()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/groups/group-id/lessons/item-id',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer access-token'
        })
      })
    )
    expect(wrapper.text()).toBe('resource-id')
  })
})
