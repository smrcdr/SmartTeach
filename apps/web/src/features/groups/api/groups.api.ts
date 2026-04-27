import { apiRequest } from '@/shared/api/http'
import type { FileObject } from '@/shared/api/files.api'

export type PublicUser = {
  id: string
  displayName: string
  bio: string | null
  avatarFileId?: string | null
  avatarUrl?: string | null
}

export type GroupSettings = {
  chatEnabled: boolean
  lessonsEnabled: boolean
  assignmentsEnabled: boolean
  scheduleEnabled: boolean
  usefulLinksEnabled: boolean
}

export type Group = {
  id: string
  code: string
  name: string
  description: string | null
  ownerId: string
  owner: PublicUser
  accessMode: 'OPEN' | 'BY_REQUEST' | 'CLOSED'
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  settings: GroupSettings
  membersCount: number
  viewerMembershipRole: 'OWNER' | 'ADMIN' | 'USER' | null
  viewerJoinRequestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  deletedAt: string | null
}

export type Lesson = {
  id: string
  groupId: string
  title: string
  content: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  sortOrder: number
  startsAt: string | null
  endsAt: string | null
  publishedAt: string | null
  archivedAt: string | null
  createdByUserId: string
  files: unknown[]
  createdAt: string
  updatedAt: string
}

export type Assignment = {
  id: string
  groupId: string
  lessonId: string | null
  title: string
  content: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  dueAt: string | null
  maxScore: number | null
  publishedAt: string | null
  archivedAt: string | null
  createdByUserId: string
  files: unknown[]
  createdAt: string
  updatedAt: string
}

export type Submission = {
  id: string
  assignmentId: string
  authorId: string
  attemptNumber: number
  text: string | null
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED'
  files: unknown[]
  score: number | null
  feedback: string | null
  submittedAt: string | null
  reviewedByUserId: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  author: PublicUser
  reviewer: PublicUser | null
}

export type ScheduleEvent = {
  id: string
  groupId: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  location: string | null
  status: 'PLANNED' | 'CANCELLED'
  createdByUserId: string
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export type UsefulLink = {
  id: string
  groupId: string
  title: string
  url: string
  image: FileObject | null
  sortOrder: number
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export type GroupMember = {
  groupId: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'USER'
  joinedAt: string
  updatedAt: string
  user: PublicUser
}

export type GroupJoinRequest = {
  id: string
  groupId: string
  userId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedByUserId: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  user: PublicUser
  reviewer: PublicUser | null
}

export type GroupListQuery = {
  search?: string
  mine?: boolean
}

export type CreateGroupPayload = {
  name: string
  description?: string
  accessMode: Group['accessMode']
  settings: GroupSettings
}

export type UpdateGroupPayload = {
  name?: string
  description?: string
  accessMode?: Group['accessMode']
}

export type UpdateGroupSettingsPayload = Partial<GroupSettings>

export type CreateLessonPayload = {
  title: string
  content?: string
  status?: Lesson['status']
  sortOrder?: number
  startsAt?: string
  endsAt?: string
  fileIds?: string[]
}

export type CreateAssignmentPayload = {
  lessonId?: string
  title: string
  content?: string
  status?: Assignment['status']
  dueAt?: string
  maxScore?: number
  fileIds?: string[]
}

export type CreateScheduleEventPayload = {
  title: string
  description?: string
  startsAt: string
  endsAt: string
  location?: string
}

export type CreateUsefulLinkPayload = {
  title: string
  url: string
  imageFileId?: string | null
  sortOrder?: number
}

function toQuery(query: GroupListQuery = {}) {
  const params = new URLSearchParams()

  if (query.search) {
    params.set('search', query.search)
  }

  if (query.mine) {
    params.set('joinedOnly', 'true')
  }

  const value = params.toString()
  return value ? `?${value}` : ''
}

export function listGroups(query?: GroupListQuery, token?: string | null) {
  return apiRequest<Group[]>(`/groups${toQuery(query)}`, { token })
}

export function getGroup(groupId: string, token?: string | null) {
  return apiRequest<Group>(`/groups/${groupId}`, { token })
}

export function getGroupByCode(code: string, token?: string | null) {
  return apiRequest<Group>(`/groups/by-code/${encodeURIComponent(code.trim())}`, { token })
}

export function createGroup(payload: CreateGroupPayload, token?: string | null) {
  return apiRequest<Group>('/groups', {
    method: 'POST',
    token,
    body: JSON.stringify(payload)
  })
}

export function updateGroup(groupId: string, payload: UpdateGroupPayload, token?: string | null) {
  return apiRequest<Group>(`/groups/${groupId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload)
  })
}

export function updateGroupSettings(groupId: string, payload: UpdateGroupSettingsPayload, token?: string | null) {
  return apiRequest<GroupSettings>(`/groups/${groupId}/settings`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload)
  })
}

export function joinGroup(groupId: string, token?: string | null) {
  return apiRequest<GroupMember>(`/groups/${groupId}/join`, {
    method: 'POST',
    token
  })
}

export function createJoinRequest(groupId: string, token?: string | null) {
  return apiRequest<GroupJoinRequest>(`/groups/${groupId}/join-requests`, {
    method: 'POST',
    token
  })
}

export function listLessons(groupId: string, token?: string | null) {
  return apiRequest<Lesson[]>(`/groups/${groupId}/lessons`, { token })
}

export function getLesson(groupId: string, lessonId: string, token?: string | null) {
  return apiRequest<Lesson>(`/groups/${groupId}/lessons/${lessonId}`, { token })
}

export function createLesson(groupId: string, payload: CreateLessonPayload, token?: string | null) {
  return apiRequest<Lesson>(`/groups/${groupId}/lessons`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload)
  })
}

export function listAssignments(groupId: string, token?: string | null) {
  return apiRequest<Assignment[]>(`/groups/${groupId}/assignments`, { token })
}

export function getAssignment(groupId: string, assignmentId: string, token?: string | null) {
  return apiRequest<Assignment>(`/groups/${groupId}/assignments/${assignmentId}`, { token })
}

export function createAssignment(groupId: string, payload: CreateAssignmentPayload, token?: string | null) {
  return apiRequest<Assignment>(`/groups/${groupId}/assignments`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload)
  })
}

export function listSubmissions(groupId: string, assignmentId: string, token?: string | null) {
  return apiRequest<Submission[]>(`/groups/${groupId}/assignments/${assignmentId}/submissions`, { token })
}

export function getSubmission(groupId: string, assignmentId: string, submissionId: string, token?: string | null) {
  return apiRequest<Submission>(`/groups/${groupId}/assignments/${assignmentId}/submissions/${submissionId}`, { token })
}

export function listScheduleEvents(groupId: string, token?: string | null) {
  return apiRequest<ScheduleEvent[]>(`/groups/${groupId}/schedule/events`, { token })
}

export function createScheduleEvent(groupId: string, payload: CreateScheduleEventPayload, token?: string | null) {
  return apiRequest<ScheduleEvent>(`/groups/${groupId}/schedule/events`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload)
  })
}

export function listUsefulLinks(groupId: string, token?: string | null) {
  return apiRequest<UsefulLink[]>(`/groups/${groupId}/useful-links`, { token })
}

export function createUsefulLink(groupId: string, payload: CreateUsefulLinkPayload, token?: string | null) {
  return apiRequest<UsefulLink>(`/groups/${groupId}/useful-links`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload)
  })
}

export function listMembers(groupId: string, token?: string | null) {
  return apiRequest<GroupMember[]>(`/groups/${groupId}/members`, { token })
}

export function listJoinRequests(groupId: string, token?: string | null) {
  return apiRequest<GroupJoinRequest[]>(`/groups/${groupId}/join-requests`, { token })
}

export function decideJoinRequest(
  groupId: string,
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  token?: string | null
) {
  return apiRequest<GroupJoinRequest>(`/groups/${groupId}/join-requests/${requestId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ decision })
  })
}
