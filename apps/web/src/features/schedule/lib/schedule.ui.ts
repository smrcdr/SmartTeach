import type { ScheduleEntry } from '../../groups/api/groups.api'
import type { ScheduleEventStatus } from '../api/schedule.api'

const scheduleDateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

const scheduleTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

const scheduleDayFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export const scheduleEntryTypeLabels: Record<ScheduleEntry['sourceType'], string> = {
  LESSON: 'Урок',
  ASSIGNMENT_DEADLINE: 'Дедлайн',
  CUSTOM_EVENT: 'Событие',
}

export const scheduleEventStatusLabels: Record<ScheduleEventStatus, string> = {
  PLANNED: 'Запланировано',
  CANCELLED: 'Отменено',
}

export function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export function formatScheduleDateTime(value: string) {
  return scheduleDateTimeFormatter.format(new Date(value))
}

export function formatScheduleTimeRange(startsAt: string, endsAt?: string | null) {
  const normalizedEnd = normalizeOptionalText(endsAt)

  if (!normalizedEnd) {
    return scheduleTimeFormatter.format(new Date(startsAt))
  }

  const startDate = new Date(startsAt)
  const endDate = new Date(normalizedEnd)

  if (isSameLocalDay(startDate, endDate)) {
    return `${scheduleTimeFormatter.format(startDate)} - ${scheduleTimeFormatter.format(endDate)}`
  }

  return `${formatScheduleDateTime(startsAt)} - ${formatScheduleDateTime(normalizedEnd)}`
}

export function formatScheduleEntryTiming(entry: ScheduleEntry) {
  if (entry.sourceType === 'ASSIGNMENT_DEADLINE') {
    return `Дедлайн ${formatScheduleDateTime(entry.startsAt)}`
  }

  return formatScheduleTimeRange(entry.startsAt, normalizeOptionalText(entry.endsAt) || null)
}

export function getScheduleEntryFallbackDescription(entry: Pick<ScheduleEntry, 'sourceType'>) {
  switch (entry.sourceType) {
    case 'LESSON':
      return 'Урок с датой автоматически попадает в общую agenda-ленту группы.'
    case 'ASSIGNMENT_DEADLINE':
      return 'Срок сдачи задания попадает в расписание, чтобы не теряться между модулями.'
    case 'CUSTOM_EVENT':
      return 'Кастомное событие можно использовать для созвонов, очных встреч и операционных слотов.'
  }
}

export function groupScheduleEntriesByDay(entries: ScheduleEntry[]) {
  const groups = new Map<string, ScheduleEntry[]>()

  for (const entry of sortScheduleEntries(entries)) {
    const dayKey = getScheduleDayKey(entry.startsAt)
    const currentEntries = groups.get(dayKey) ?? []

    currentEntries.push(entry)
    groups.set(dayKey, currentEntries)
  }

  return [...groups.entries()].map(([dateKey, dayEntries]) => ({
    dateKey,
    label: formatScheduleDayLabel(dateKey),
    entries: dayEntries,
  }))
}

export function sortScheduleEntries(entries: ScheduleEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.startsAt !== right.startsAt) {
      return left.startsAt.localeCompare(right.startsAt)
    }

    const leftEndsAt = normalizeOptionalText(left.endsAt) || left.startsAt
    const rightEndsAt = normalizeOptionalText(right.endsAt) || right.startsAt

    if (leftEndsAt !== rightEndsAt) {
      return leftEndsAt.localeCompare(rightEndsAt)
    }

    if (left.sourceType !== right.sourceType) {
      return scheduleEntryTypeOrder[left.sourceType] - scheduleEntryTypeOrder[right.sourceType]
    }

    return left.sourceId.localeCompare(right.sourceId)
  })
}

export function getScheduleDayKey(value: string) {
  const date = new Date(value)

  return buildLocalDayKey(date)
}

function formatScheduleDayLabel(dayKey: string) {
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()
  const todayKey = buildLocalDayKey(today)
  const tomorrow = new Date(today)
  const yesterday = new Date(today)

  tomorrow.setDate(tomorrow.getDate() + 1)
  yesterday.setDate(yesterday.getDate() - 1)

  const relativeLabel =
    dayKey === todayKey
      ? 'Сегодня'
      : dayKey === buildLocalDayKey(tomorrow)
        ? 'Завтра'
        : dayKey === buildLocalDayKey(yesterday)
          ? 'Вчера'
          : ''

  const formattedDate = scheduleDayFormatter.format(date)

  return relativeLabel ? `${relativeLabel}, ${formattedDate}` : formattedDate
}

function buildLocalDayKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

const scheduleEntryTypeOrder: Record<ScheduleEntry['sourceType'], number> = {
  LESSON: 0,
  ASSIGNMENT_DEADLINE: 1,
  CUSTOM_EVENT: 2,
}
