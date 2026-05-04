import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import type { Group, MaterialSection } from '@/features/groups/api/groups.api'
import * as groupsApi from '@/features/groups/api/groups.api'
import GroupLessonsPage from './GroupLessonsPage.vue'

const mockGroup = vi.hoisted(() => ({
  value: null as Group | null
}))

vi.mock('@/features/groups/composables/useGroup', () => ({
  useGroup: () => ({
    group: mockGroup
  })
}))

vi.mock('@/features/groups/api/groups.api', async (importOriginal) => {
  const actual = await importOriginal<typeof groupsApi>()

  return {
    ...actual,
    createMaterialSection: vi.fn(),
    createMaterialSubsection: vi.fn(),
    listMaterials: vi.fn(),
    updateMaterialSection: vi.fn(),
    updateMaterialSubsection: vi.fn()
  }
})

const materials = [
  {
    id: 'section-id',
    groupId: 'group-id',
    title: 'Раздел',
    sortOrder: 1,
    createdByUserId: 'owner-id',
    createdAt: '2026-04-28T00:00:00.000Z',
    updatedAt: '2026-04-28T00:00:00.000Z',
    subsections: [
      {
        id: 'subsection-id',
        groupId: 'group-id',
        sectionId: 'section-id',
        title: 'Подраздел',
        sortOrder: 1,
        lessonsCount: 2,
        createdByUserId: 'owner-id',
        createdAt: '2026-04-28T00:00:00.000Z',
        updatedAt: '2026-04-28T00:00:00.000Z'
      }
    ]
  }
] satisfies MaterialSection[]

function buildGroup(role: Group['viewerMembershipRole'] = 'ADMIN'): Group {
  return {
    id: 'group-id',
    code: 'WEB101',
    name: 'Web Basics',
    description: null,
    ownerId: 'owner-id',
    owner: {
      id: 'owner-id',
      displayName: 'Owner',
      bio: null,
      avatarUrl: null
    },
    accessMode: 'OPEN',
    status: 'ACTIVE',
    settings: {
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: true,
      scheduleEnabled: true,
      usefulLinksEnabled: true
    },
    membersCount: 2,
    viewerMembershipRole: role,
    viewerJoinRequestStatus: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    archivedAt: null,
    deletedAt: null
  }
}

async function mountPage(role: Group['viewerMembershipRole'] = 'ADMIN') {
  mockGroup.value = buildGroup(role)
  vi.mocked(groupsApi.listMaterials).mockResolvedValue(materials)
  vi.mocked(groupsApi.createMaterialSection).mockResolvedValue({
    ...materials[0],
    id: 'created-section-id',
    title: 'Новый раздел',
    subsections: []
  })
  vi.mocked(groupsApi.createMaterialSubsection).mockResolvedValue({
    section: {
      id: 'section-id',
      title: 'Раздел',
      sortOrder: 1
    },
    subsection: {
      ...materials[0].subsections[0],
      id: 'created-subsection-id',
      title: 'Новый подраздел'
    },
    lessons: []
  })
  vi.mocked(groupsApi.updateMaterialSection).mockResolvedValue(materials[0])
  vi.mocked(groupsApi.updateMaterialSubsection).mockResolvedValue({
    section: {
      id: 'section-id',
      title: 'Раздел',
      sortOrder: 1
    },
    subsection: materials[0].subsections[0],
    lessons: []
  })

  const pinia = createPinia()
  const auth = useAuthStore(pinia)

  auth.accessToken = 'access-token'
  auth.user = {
    id: 'admin-id',
    email: 'admin@smarteach.local',
    displayName: 'Admin',
    bio: null,
    avatarUrl: null
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/groups/:groupId/workspace/lessons', name: 'group-lessons', component: GroupLessonsPage },
      { path: '/groups/:groupId/workspace/lessons/subsections/:subsectionId', name: 'group-material-subsection', component: { template: '<span />' } }
    ]
  })

  router.push('/groups/group-id/workspace/lessons')
  await router.isReady()

  const wrapper = mount(GroupLessonsPage, {
    global: {
      plugins: [pinia, router]
    }
  })

  await flushPromises()

  return wrapper
}

describe('GroupLessonsPage', () => {
  it('closes section create dialog after saving', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.app-button').trigger('click')
    await wrapper.find('input[name="title"]').setValue('Новый раздел')
    await wrapper.find('.material-dialog__panel').trigger('submit')
    await flushPromises()

    expect(groupsApi.createMaterialSection).toHaveBeenCalledWith(
      'group-id',
      { title: 'Новый раздел' },
      'access-token'
    )
    expect(wrapper.find('.material-dialog').exists()).toBe(false)
  })

  it('opens section edit dialog from the right-click menu and saves changes', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.material-section__header').trigger('contextmenu', {
      clientX: 140,
      clientY: 210
    })

    expect(wrapper.find('.material-context-menu').attributes('style')).toContain('left: 140px; top: 218px;')

    await wrapper.find('.material-context-menu button').trigger('click')
    await wrapper.find('input[name="title"]').setValue('Обновленный раздел')
    await wrapper.find('.material-dialog__panel').trigger('submit')
    await flushPromises()

    expect(groupsApi.updateMaterialSection).toHaveBeenCalledWith(
      'group-id',
      'section-id',
      { title: 'Обновленный раздел' },
      'access-token'
    )
  })

  it('opens subsection edit dialog from the right-click menu and saves changes', async () => {
    const wrapper = await mountPage()

    await wrapper.find('.material-section__header').trigger('click')
    await wrapper.find('.material-subsection').trigger('contextmenu', {
      clientX: 180,
      clientY: 260
    })

    await wrapper.find('.material-context-menu button').trigger('click')
    await wrapper.find('input[name="title"]').setValue('Обновленный подраздел')
    await wrapper.find('.material-dialog__panel').trigger('submit')
    await flushPromises()

    expect(groupsApi.updateMaterialSubsection).toHaveBeenCalledWith(
      'group-id',
      'subsection-id',
      { title: 'Обновленный подраздел' },
      'access-token'
    )
  })

  it('does not open edit menu for regular members', async () => {
    const wrapper = await mountPage('USER')

    await wrapper.find('.material-section__header').trigger('contextmenu', {
      clientX: 140,
      clientY: 210
    })

    expect(wrapper.find('.material-context-menu').exists()).toBe(false)
  })
})
