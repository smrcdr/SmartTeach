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
    description: 'Условия, попытки и review flow',
    routeName: 'group-assignments',
    module: 'assignments',
  },
  {
    key: 'schedule',
    label: 'Расписание',
    description: 'Agenda с уроками, дедлайнами и событиями',
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
    description: 'BY_REQUEST сценарий для owner/admin',
    routeName: 'group-requests',
    module: 'requests',
    managerOnly: true,
    byRequestOnly: true,
  },
  {
    key: 'settings',
    label: 'Настройки',
    description: 'Модули, архив и transfer ownership',
    routeName: 'group-settings',
    module: 'settings',
    managerOnly: true,
  },
]
