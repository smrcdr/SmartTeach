import type { GroupSettings } from '../api/groups.api'

export type GroupSettingKey = keyof GroupSettings

export const groupSettingOptions: Array<{ key: GroupSettingKey, label: string }> = [
  { key: 'chatEnabled', label: 'Чат' },
  { key: 'lessonsEnabled', label: 'Материалы' },
  { key: 'assignmentsEnabled', label: 'Задания' },
  { key: 'scheduleEnabled', label: 'Расписание' },
  { key: 'usefulLinksEnabled', label: 'Полезные ссылки' }
]
