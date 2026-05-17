import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import CreateGroupPage from './CreateGroupPage.vue'

const fetchMock = vi.fn()

async function mountPage() {
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  auth.accessToken = 'access-token'
  auth.user = {
    id: 'user-id',
    email: 'teacher@smarteach.local',
    displayName: 'Teacher Example',
    bio: null,
    avatarUrl: null
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/groups/new', name: 'group-create', component: CreateGroupPage },
      { path: '/my-groups', name: 'my-groups', component: { template: '<span />' } },
      { path: '/groups/:groupId/workspace', name: 'group-workspace', component: { template: '<span />' } }
    ]
  })

  router.push('/groups/new')
  await router.isReady()

  const wrapper = mount(CreateGroupPage, {
    global: {
      plugins: [pinia, router]
    }
  })

  return {
    pinia,
    router,
    wrapper
  }
}

describe('CreateGroupPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    localStorage.clear()
  })

  it('renders only group identity fields and module switches', async () => {
    const { wrapper } = await mountPage()

    expect(wrapper.find('input[name="name"]').exists()).toBe(true)
    expect(wrapper.find('textarea[name="description"]').exists()).toBe(true)
    expect(wrapper.findAll('input[name="accessMode"]')).toHaveLength(3)
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(5)
    expect(wrapper.text()).toContain('Открытая')
    expect(wrapper.text()).toContain('По заявке')
    expect(wrapper.text()).toContain('Закрытая')
    expect(wrapper.text()).toContain('Чат')
    expect(wrapper.text()).toContain('Материалы')
    expect(wrapper.text()).toContain('Задания')
    expect(wrapper.text()).toContain('Расписание')
    expect(wrapper.text()).toContain('Полезные ссылки')
    expect(wrapper.text()).not.toContain('Статус')
    expect(wrapper.text()).not.toContain('Дата')
  })

  it('creates a group through the backend and opens its workspace', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        id: 'created-group-id',
        name: 'Physics 101',
        description: 'Механика и задачи',
        accessMode: 'CLOSED',
        settings: {
          chatEnabled: false,
          lessonsEnabled: true,
          assignmentsEnabled: true,
          scheduleEnabled: true,
        scheduleWeeklyEnabled: true,
        scheduleSpecialEnabled: true,
          usefulLinksEnabled: true
        }
      }))
    })

    const { pinia, router, wrapper } = await mountPage()
    const notifications = useNotificationStore(pinia)

    await wrapper.find('input[name="name"]').setValue('Physics 101')
    await wrapper.find('textarea[name="description"]').setValue('Механика и задачи')
    await wrapper.find('input[value="CLOSED"]').setValue()
    await wrapper.find('input[name="chatEnabled"]').setValue(false)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/groups', expect.objectContaining({
      method: 'POST'
    }))
    expect(JSON.parse(String(request.body))).toEqual({
      name: 'Physics 101',
      description: 'Механика и задачи',
      accessMode: 'CLOSED',
      settings: {
        chatEnabled: false,
        lessonsEnabled: true,
        assignmentsEnabled: true,
        scheduleEnabled: true,
        scheduleWeeklyEnabled: true,
        scheduleSpecialEnabled: true,
        usefulLinksEnabled: true
      }
    })
    expect(router.currentRoute.value.name).toBe('group-workspace')
    expect(router.currentRoute.value.params.groupId).toBe('created-group-id')
    expect(notifications.items.at(-1)).toMatchObject({
      type: 'success',
      message: 'Группа создана'
    })
  })
})
