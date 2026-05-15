import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import GroupLessonCreatePage from './GroupLessonCreatePage.vue'

const fetchMock = vi.fn()

const group = {
  id: 'group-id',
  name: 'Frontend',
  description: null,
  settings: {
    chatEnabled: true,
    lessonsEnabled: true,
    assignmentsEnabled: true,
    scheduleEnabled: true,
    usefulLinksEnabled: true
  },
  viewerMembershipRole: 'OWNER'
}

const materials = [
  {
    id: 'section-id',
    groupId: 'group-id',
    title: 'Раздел',
    sortOrder: 1,
    createdByUserId: 'user-id',
    createdAt: '2026-04-28T00:00:00.000Z',
    updatedAt: '2026-04-28T00:00:00.000Z',
    subsections: [
      {
        id: 'subsection-id',
        groupId: 'group-id',
        sectionId: 'section-id',
        title: 'Подраздел',
        sortOrder: 1,
        lessonsCount: 0,
        createdByUserId: 'user-id',
        createdAt: '2026-04-28T00:00:00.000Z',
        updatedAt: '2026-04-28T00:00:00.000Z'
      }
    ]
  }
]

function jsonResponse(payload: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(payload))
  })
}

async function mountPage() {
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  auth.accessToken = 'access-token'
  auth.user = {
    id: 'user-id',
    email: 'teacher@smarteach.local',
    displayName: 'Teacher',
    bio: null,
    avatarUrl: null
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/groups/:groupId/lessons/new', name: 'group-lesson-create', component: GroupLessonCreatePage },
      { path: '/groups/:groupId/lessons', name: 'group-lessons', component: { template: '<span />' } },
      { path: '/groups/:groupId/lessons/subsections/:subsectionId', name: 'group-material-subsection', component: { template: '<span />' } }
    ]
  })

  router.push('/groups/group-id/lessons/new')
  await router.isReady()

  const wrapper = mount(GroupLessonCreatePage, {
    global: {
      plugins: [pinia, router]
    }
  })

  await flushPromises()

  return {
    router,
    wrapper
  }
}

describe('GroupLessonCreatePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    localStorage.clear()
  })

  it('creates a lesson through metadata and content steps', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === '/api/v1/groups/group-id') {
        return jsonResponse(group)
      }

      if (url === '/api/v1/groups/group-id/materials') {
        return jsonResponse(materials)
      }

      if (url === '/api/v1/groups/group-id/lessons' && init?.method === 'POST') {
        return jsonResponse({
          id: 'lesson-id',
          groupId: 'group-id',
          materialSubsectionId: 'subsection-id',
          title: 'Введение',
          content: '<h2>План</h2>',
          status: 'DRAFT',
          files: []
        }, 201)
      }

      throw new Error(`Unexpected request ${url}`)
    })

    const { router, wrapper } = await mountPage()

    expect(wrapper.find('.rich-editor__surface').exists()).toBe(false)

    await wrapper.find('input[name="title"]').setValue('Введение')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.rich-editor__surface').exists()).toBe(true)

    const editor = wrapper.find('.rich-editor__surface')
    editor.element.innerHTML = '<h2>План</h2><ul><li>Первое занятие</li></ul>'
    await editor.trigger('input')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const createCall = fetchMock.mock.calls.find(([url]) => url === '/api/v1/groups/group-id/lessons')
    const request = createCall?.[1] as RequestInit

    expect(JSON.parse(String(request.body))).toEqual({
      title: 'Введение',
      materialSubsectionId: 'subsection-id',
      content: '<h2>План</h2><ul><li>Первое занятие</li></ul>',
      status: 'DRAFT'
    })
    expect(router.currentRoute.value.name).toBe('group-material-subsection')
  })
})
