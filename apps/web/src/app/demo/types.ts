export type GroupModule = 'lessons' | 'assignments' | 'schedule' | 'chats' | 'members'

export type DemoUser = {
  id: string
  name: string
  role: string
  avatarUrl: string
  bio: string
}

export type DemoLesson = {
  id: string
  title: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  summary: string
  duration: string
}

export type DemoAssignment = {
  id: string
  title: string
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  dueDate: string
  submissions: number
}

export type DemoScheduleEvent = {
  id: string
  title: string
  status: 'PLANNED' | 'DONE' | 'CANCELLED'
  startsAt: string
  place: string
}

export type DemoChat = {
  id: string
  title: string
  lastMessage: string
  unreadCount: number
}

export type DemoGroup = {
  id: string
  title: string
  description: string
  code: string
  coverImage: string
  membersCount: number
  duration: string
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  modules: GroupModule[]
  owner: DemoUser
  lessons: DemoLesson[]
  assignments: DemoAssignment[]
  schedule: DemoScheduleEvent[]
  members: DemoUser[]
  chats: DemoChat[]
}
