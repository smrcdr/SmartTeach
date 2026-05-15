import type {
  Assignment,
  Group,
  GroupJoinRequest,
  GroupMember,
  Lesson,
  ScheduleEvent,
  Submission
} from '@/features/groups/api/groups.api'

export function getLessonStatusLabel(status: Lesson['status']) {
  switch (status) {
    case 'DRAFT':
      return 'Черновик'
    case 'PUBLISHED':
      return 'Опубликован'
    case 'ARCHIVED':
      return 'Архив'
  }
}

export function getAssignmentStatusLabel(status: Assignment['status']) {
  switch (status) {
    case 'DRAFT':
      return 'Черновик'
    case 'PUBLISHED':
      return 'Опубликовано'
    case 'ARCHIVED':
      return 'Архив'
  }
}

export function getSubmissionStatusLabel(status: Submission['status']) {
  switch (status) {
    case 'DRAFT':
      return 'Черновик'
    case 'SUBMITTED':
      return 'Отправлено'
    case 'REVIEWED':
      return 'Проверено'
  }
}

export function getJoinRequestStatusLabel(status: GroupJoinRequest['status']) {
  switch (status) {
    case 'PENDING':
      return 'Ожидает'
    case 'APPROVED':
      return 'Одобрена'
    case 'REJECTED':
      return 'Отклонена'
  }
}

export function getScheduleEventStatusLabel(status: ScheduleEvent['status']) {
  switch (status) {
    case 'PLANNED':
      return 'Запланировано'
    case 'CANCELLED':
      return 'Отменено'
  }
}

export function getGroupStatusLabel(status: Group['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'Активна'
    case 'ARCHIVED':
      return 'Архив'
    case 'DELETED':
      return 'Удалена'
  }
}

export function getGroupRoleLabel(role: GroupMember['role'] | Group['viewerMembershipRole']) {
  switch (role) {
    case 'OWNER':
      return 'Владелец'
    case 'ADMIN':
      return 'Администратор'
    case 'USER':
      return 'Участник'
    default:
      return ''
  }
}
