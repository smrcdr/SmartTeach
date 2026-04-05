export interface UserProfile {
  firstName: string
  name: string
  avatar: string
}

export interface NavItem {
  label: string
  to: string
}

export interface CourseCardItem {
  id: number
  title: string
  author: string
  tags: string[]
  language: string
  description: string
  rating: string
  students: string
  reviewsCount: number
  featured: boolean
  cover: string
  actionLabel: string
}

export interface FilterGroup {
  title: string
  key: string
  options: string[]
}

export interface MyGroupItem extends CourseCardItem {
  status: 'Активные' | 'Архивированные' | 'Удаленные'
}

export interface ChatMessage {
  id: number
  author: string
  text: string
  time: string
  own: boolean
}

export interface ChatItem {
  id: number
  title: string
  kind: 'group' | 'direct'
  subtitle: string
  lastMessage: string
  lastTime: string
  unreadCount: number
  online?: boolean
  messages: ChatMessage[]
}

export interface ProfileStat {
  label: string
  value: string
}

export interface ProfileInfoItem {
  label: string
  value: string
}

export interface JoinGroupCodeItem {
  code: string
  title: string
  subtitle: string
  members: string
}
