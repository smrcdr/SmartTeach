import type { Group, GroupAccessMode, GroupStatus } from '../api/groups.api'

export const groupAccessModeLabels: Record<GroupAccessMode, string> = {
  OPEN: 'Открытая',
  BY_REQUEST: 'По заявке',
  CLOSED: 'Закрытая',
}

export const groupAccessModeDescriptions: Record<GroupAccessMode, string> = {
  OPEN: 'Пользователь может вступить в группу без ручного подтверждения.',
  BY_REQUEST: 'Новые участники отправляют заявку и ждут решения владельца или администратора.',
  CLOSED: 'Самостоятельное вступление недоступно, новых участников добавляют только вручную.',
}

export const groupStatusLabels: Record<GroupStatus, string> = {
  ACTIVE: 'Активна',
  ARCHIVED: 'В архиве',
  DELETED: 'Удалена',
}

export function getEnabledGroupModules(settings: Group['settings']) {
  return [
    settings.chatEnabled ? 'Чаты' : null,
    settings.lessonsEnabled ? 'Уроки' : null,
    settings.assignmentsEnabled ? 'Задания' : null,
    settings.scheduleEnabled ? 'Расписание' : null,
  ].filter((label): label is string => Boolean(label))
}

export function getMyGroupRoleLabel(group: Group, currentUserId?: string | null) {
  if (currentUserId && group.ownerId === currentUserId) {
    return 'Владелец'
  }

  return 'Участник'
}

export function formatMembersCount(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} участник`
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} участника`
  }

  return `${count} участников`
}
