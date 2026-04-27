import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import GroupLessonEditPage from './GroupLessonEditPage.vue'

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
        lessonsCount: 1,
        createdByUserId: 'user-id',
        createdAt: '2026-04-28T00:00:00.000Z',
        updatedAt: '2026-04-28T00:00:00.000Z'
      }
    ]
  }
]

const lesson = {
  id: 'lesson-id',
  groupId: 'group-id',
  materialSubsectionId: 'subsection-id',
  title: 'Старый урок',
  content: 'Старый текст',
  status: 'DRAFT',
  sortOrder: 1,
  publishedAt: null,
  archivedAt: null,
  createdByUserId: 'user-id',
  files: [],
  createdAt: '2026-04-28T00:00:00.000Z',
  updatedAt: '2026-04-28T00:00:00.000Z'
}

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
      { path: '/groups/:groupId/lessons/:lessonId/edit', name: 'group-lesson-edit', component: GroupLessonEditPage },
      { path: '/groups/:groupId/lessons/:lessonId', name: 'group-lesson-details', component: { template: '<span />' } }
    ]
  })

  router.push('/groups/group-id/lessons/lesson-id/edit')
  await router.isReady()

  const wrapper = mount(GroupLessonEditPage, {
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

describe('GroupLessonEditPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    localStorage.clear()
  })

  it('loads lesson data and saves rich content through PATCH', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === '/api/v1/groups/group-id') {
        return jsonResponse(group)
      }

      if (url === '/api/v1/groups/group-id/materials') {
        return jsonResponse(materials)
      }

      if (url === '/api/v1/groups/group-id/lessons/lesson-id' && init?.method !== 'PATCH') {
        return jsonResponse(lesson)
      }

      if (url === '/api/v1/groups/group-id/lessons/lesson-id' && init?.method === 'PATCH') {
        return jsonResponse({
          ...lesson,
          title: 'Новый урок',
          content: '<h2>Новый текст</h2>',
          status: 'PUBLISHED'
        })
      }

      throw new Error(`Unexpected request ${url}`)
    })

    const { router, wrapper } = await mountPage()

    expect((wrapper.find('input[name="title"]').element as HTMLInputElement).value).toBe('Старый урок')

    await wrapper.find('input[name="title"]').setValue('Новый урок')
    const editor = wrapper.find('.rich-editor__surface')
    editor.element.innerHTML = '<h2>Новый текст</h2>'
    await editor.trigger('input')
    await wrapper.find('select[name="status"]').setValue('PUBLISHED')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const updateCall = fetchMock.mock.calls.find(([url, init]) =>
      url === '/api/v1/groups/group-id/lessons/lesson-id' && (init as RequestInit | undefined)?.method === 'PATCH'
    )
    const request = updateCall?.[1] as RequestInit

    expect(JSON.parse(String(request.body))).toEqual({
      title: 'Новый урок',
      materialSubsectionId: 'subsection-id',
      content: '<h2>Новый текст</h2>',
      status: 'PUBLISHED'
    })
    expect(router.currentRoute.value.name).toBe('group-lesson-details')
  })
})
