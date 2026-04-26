import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Group } from '@/features/groups/api/groups.api'
import GroupWorkspaceLayout from './GroupWorkspaceLayout.vue'

const mockGroup = vi.hoisted(() => ({
  value: null as Group | null
}))

vi.mock('@/features/groups/composables/useGroup', () => ({
  useGroup: () => ({
    group: mockGroup
  })
}))

vi.mock('@/shared/ui/AppTopNav.vue', () => ({
  default: {
    template: '<header />'
  }
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
      scheduleEnabled: true
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

async function mountAt(path: string, role: Group['viewerMembershipRole']) {
  mockGroup.value = buildGroup(role)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/groups/:groupId/workspace',
        component: GroupWorkspaceLayout,
        children: [
          { path: '', name: 'group-workspace', component: { template: '<span />' } },
          { path: 'lessons', name: 'group-lessons', component: { template: '<span />' } },
          { path: 'settings', name: 'group-settings', component: { template: '<span />' } },
          { path: 'requests', name: 'group-requests', component: { template: '<span />' } }
        ]
      }
    ]
  })

  router.push(path)
  await router.isReady()

  return mount(GroupWorkspaceLayout, {
    global: {
      plugins: [createPinia(), router]
    }
  })
}

function navLabels(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.workspace-nav__item').map((item) => item.text())
}

describe('GroupWorkspaceLayout', () => {
  it('hides administration navigation from regular members', async () => {
    const wrapper = await mountAt('/groups/group-id/workspace', 'USER')

    expect(navLabels(wrapper)).not.toContain('Заявки')
    expect(navLabels(wrapper)).not.toContain('Настройки')
  })

  it('shows administration navigation to group admins', async () => {
    const wrapper = await mountAt('/groups/group-id/workspace', 'ADMIN')

    expect(navLabels(wrapper)).toContain('Заявки')
    expect(navLabels(wrapper)).toContain('Настройки')
  })

  it('only highlights overview on the exact overview route', async () => {
    const wrapper = await mountAt('/groups/group-id/workspace/lessons', 'ADMIN')
    const items = wrapper.findAll('.workspace-nav__item')
    const overview = items.find((item) => item.text() === 'Обзор')
    const lessons = items.find((item) => item.text() === 'Уроки')

    expect(overview?.classes()).not.toContain('workspace-nav__item--active')
    expect(lessons?.classes()).toContain('workspace-nav__item--active')
  })
})
