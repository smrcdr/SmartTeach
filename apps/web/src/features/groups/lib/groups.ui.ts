import type { Group, GroupAccessMode, GroupJoinRequest, GroupStatus, ScheduleEntry } from '../api/groups.api'

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

export const groupMembershipRoleLabels = {
  OWNER: 'Владелец',
  ADMIN: 'Администратор',
  USER: 'Участник',
} as const

export const groupJoinRequestStatusLabels: Record<GroupJoinRequest['status'], string> = {
  PENDING: 'На рассмотрении',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
}

export const scheduleEntryTypeLabels: Record<ScheduleEntry['sourceType'], string> = {
  LESSON: 'Урок',
  ASSIGNMENT_DEADLINE: 'Дедлайн',
  CUSTOM_EVENT: 'Событие',
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

export function getGroupMembershipRoleLabel(role: Group['viewerMembershipRole']) {
  return role ? groupMembershipRoleLabels[role] : 'Гость'
}

export function formatGroupDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatGroupDateTimeRange(startsAt: string, endsAt?: string | null) {
  const formattedStart = formatGroupDateTime(startsAt)

  if (!endsAt) {
    return formattedStart
  }

  return `${formattedStart} - ${new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(endsAt))}`
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
