import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Group } from '@/features/groups/api/groups.api'
import GroupAssignmentsPage from './GroupAssignmentsPage.vue'
import GroupLessonsPage from './GroupLessonsPage.vue'
import GroupSchedulePage from './GroupSchedulePage.vue'

const mockGroup = vi.hoisted(() => ({
  value: null as Group | null
}))

vi.mock('@/features/groups/composables/useGroup', () => ({
  useGroup: () => ({
    group: mockGroup
  })
}))

function buildGroup(role: Group['viewerMembershipRole']): Group {
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
      scheduleWeeklyEnabled: true,
      scheduleSpecialEnabled: true,
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

async function mountPage(component: object, role: Group['viewerMembershipRole']) {
  mockGroup.value = buildGroup(role)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/groups/:groupId/workspace',
        component: { template: '<RouterView />' },
        children: [
          { path: '', name: 'group-workspace', component: { template: '<span />' } },
          { path: 'lessons/new', name: 'group-lesson-create', component: { template: '<span />' } },
          { path: 'assignments/new', name: 'group-assignment-create', component: { template: '<span />' } },
          { path: 'schedule/new', name: 'group-schedule-event-create', component: { template: '<span />' } }
        ]
      }
    ]
  })

  router.push('/groups/group-id/workspace')
  await router.isReady()

  return mount(component, {
    global: {
      plugins: [createPinia(), router]
    }
  })
}

describe('group admin actions', () => {
  it('hides lesson creation from regular members', async () => {
    const wrapper = await mountPage(GroupLessonsPage, 'USER')

    expect(wrapper.text()).not.toContain('Добавить раздел')
  })

  it('hides assignment creation from regular members', async () => {
    const wrapper = await mountPage(GroupAssignmentsPage, 'USER')

    expect(wrapper.text()).not.toContain('Новое задание')
  })

  it('hides schedule event creation from regular members', async () => {
    const wrapper = await mountPage(GroupSchedulePage, 'USER')

    expect(wrapper.text()).not.toContain('Событие')
  })

  it('keeps creation actions available to admins', async () => {
    expect((await mountPage(GroupLessonsPage, 'ADMIN')).text()).toContain('Добавить раздел')
    expect((await mountPage(GroupAssignmentsPage, 'ADMIN')).text()).toContain('Новое задание')
    expect((await mountPage(GroupSchedulePage, 'ADMIN')).text()).toContain('Запись')
  })
})
