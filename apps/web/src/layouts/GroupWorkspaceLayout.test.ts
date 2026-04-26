import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Group } from '@/features/groups/api/groups.api'
import GroupWorkspaceLayout from './GroupWorkspaceLayout.vue'

const mockGroup = vi.hoisted(() => ({
  value: null as Group | null
}))

type GroupOverrides = Partial<Omit<Group, 'settings'>> & {
  settings?: Partial<Group['settings']>
}

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

function buildGroup(role: Group['viewerMembershipRole'], overrides: GroupOverrides = {}): Group {
  const settings = {
    chatEnabled: true,
    lessonsEnabled: true,
    assignmentsEnabled: true,
    scheduleEnabled: true,
    ...overrides.settings
  }

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
    membersCount: 2,
    viewerMembershipRole: role,
    viewerJoinRequestStatus: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
    ...overrides,
    settings
  }
}

async function mountAt(path: string, role: Group['viewerMembershipRole'], overrides: GroupOverrides = {}) {
  mockGroup.value = buildGroup(role, overrides)

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

    expect(navLabels(wrapper)).toContain('Чаты')
    expect(navLabels(wrapper)).toContain('Заявки')
    expect(navLabels(wrapper)).toContain('Настройки')
  })

  it('hides disabled modules from group navigation', async () => {
    const wrapper = await mountAt('/groups/group-id/workspace', 'ADMIN', {
      settings: {
        chatEnabled: false,
        lessonsEnabled: false,
        assignmentsEnabled: true,
        scheduleEnabled: false
      }
    })
    const labels = navLabels(wrapper)

    expect(labels).not.toContain('Чаты')
    expect(labels).not.toContain('Уроки')
    expect(labels).not.toContain('Расписание')
    expect(labels).toContain('Задания')
    expect(labels).toContain('Участники')
    expect(labels).toContain('Настройки')
  })

  it('only highlights overview on the exact overview route', async () => {
    const wrapper = await mountAt('/groups/group-id/workspace/lessons', 'ADMIN')
    const items = wrapper.findAll('.workspace-nav__item')
    const overview = items.find((item) => item.text() === 'Обзор')
    const lessons = items.find((item) => item.text() === 'Уроки')

    expect(overview?.classes()).not.toContain('workspace-nav__item--active')
    expect(lessons?.classes()).toContain('workspace-nav__item--active')
  })

  it('keeps active navigation styling stable on hover', () => {
    const source = readFileSync(`${process.cwd()}/src/layouts/GroupWorkspaceLayout.vue`, 'utf8')

    expect(source).toContain('.workspace-nav__item--active:hover')
    expect(source).toContain('background: var(--color-primary-container);')
    expect(source).toContain('color: var(--color-action-primary-text);')
  })

  it('separates group navigation from workspace content with a divider', () => {
    const source = readFileSync(`${process.cwd()}/src/layouts/GroupWorkspaceLayout.vue`, 'utf8')

    expect(source).toContain('border-right: 1px solid var(--color-divider);')
  })
})
