export type GroupWorkspaceNavItem = {
  key: string
  label: string
  description: string
}

export const groupWorkspaceNav: GroupWorkspaceNavItem[] = [
  {
    key: 'overview',
    label: 'Обзор',
    description: 'Сводка группы и быстрые переходы',
  },
  {
    key: 'lessons',
    label: 'Уроки',
    description: 'Список, статусы и ручной порядок',
  },
  {
    key: 'assignments',
    label: 'Задания',
    description: 'Условия, попытки и review flow',
  },
  {
    key: 'schedule',
    label: 'Расписание',
    description: 'Agenda с уроками, дедлайнами и событиями',
  },
  {
    key: 'chats',
    label: 'Чаты',
    description: 'Глобальные и групповые треды',
  },
  {
    key: 'members',
    label: 'Участники',
    description: 'Роли, состав и публичные профили',
  },
  {
    key: 'requests',
    label: 'Заявки',
    description: 'BY_REQUEST сценарий для owner/admin',
  },
  {
    key: 'settings',
    label: 'Настройки',
    description: 'Модули, архив и transfer ownership',
  },
]
