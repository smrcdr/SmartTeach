import type { Group, GroupSettings } from '../api/groups.api'

export type GroupWorkspaceNavItem = {
  key: string
  label: string
  description: string
  routeName: string
  module:
    | 'overview'
    | 'members'
    | 'lessons'
    | 'assignments'
    | 'schedule'
    | 'chats'
    | 'requests'
    | 'settings'
  managerOnly?: boolean
  byRequestOnly?: boolean
}

export type GroupWorkspaceModule = GroupWorkspaceNavItem['module']

export const groupWorkspaceNav: GroupWorkspaceNavItem[] = [
  {
    key: 'overview',
    label: 'Обзор',
    description: 'Сводка группы и быстрые переходы',
    routeName: 'group-overview',
    module: 'overview',
  },
  {
    key: 'lessons',
    label: 'Уроки',
    description: 'Список, статусы и ручной порядок',
    routeName: 'group-lessons',
    module: 'lessons',
  },
  {
    key: 'assignments',
    label: 'Задания',
    description: 'Условия, попытки и проверка работ',
    routeName: 'group-assignments',
    module: 'assignments',
  },
  {
    key: 'schedule',
    label: 'Расписание',
    description: 'Лента с уроками, дедлайнами и событиями',
    routeName: 'group-schedule',
    module: 'schedule',
  },
  {
    key: 'chats',
    label: 'Чаты',
    description: 'Глобальные и групповые треды',
    routeName: 'group-chats',
    module: 'chats',
  },
  {
    key: 'members',
    label: 'Участники',
    description: 'Роли, состав и публичные профили',
    routeName: 'group-members',
    module: 'members',
  },
  {
    key: 'requests',
    label: 'Заявки',
    description: 'Сценарий по заявкам для владельца и администратора',
    routeName: 'group-requests',
    module: 'requests',
    managerOnly: true,
    byRequestOnly: true,
  },
  {
    key: 'settings',
    label: 'Настройки',
    description: 'Модули, архив и передача владения',
    routeName: 'group-settings',
    module: 'settings',
    managerOnly: true,
  },
]

export function getGroupWorkspaceNavItemByRouteName(routeName: string) {
  return groupWorkspaceNav.find((item) => item.routeName === routeName) ?? null
}

export function getGroupWorkspaceNavItemByModule(module: GroupWorkspaceNavItem['module']) {
  return groupWorkspaceNav.find((item) => item.module === module) ?? null
}

export function isGroupWorkspaceModule(value: string): value is GroupWorkspaceModule {
  return groupWorkspaceNav.some((item) => item.module === value)
}

export function isGroupWorkspaceNavItemVisible(
  item: GroupWorkspaceNavItem,
  group: Pick<Group, 'accessMode'>,
  settings: GroupSettings,
  membershipRole: Group['viewerMembershipRole'],
) {
  const canManageGroup = membershipRole === 'OWNER' || membershipRole === 'ADMIN'

  if (item.managerOnly && !canManageGroup) {
    return false
  }

  if (item.byRequestOnly && group.accessMode !== 'BY_REQUEST') {
    return false
  }

  switch (item.module) {
    case 'lessons':
      return settings.lessonsEnabled
    case 'assignments':
      return settings.assignmentsEnabled
    case 'schedule':
      return settings.scheduleEnabled
    case 'chats':
      return settings.chatEnabled
    default:
      return true
  }
}
