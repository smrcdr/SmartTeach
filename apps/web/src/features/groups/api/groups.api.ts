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
  scheduleWeeklyEnabled: boolean
  scheduleSpecialEnabled: boolean
  usefulLinksEnabled: boolean
}

export type Group = {
  id: string
  code: string
  name: string
  description: string | null
  avatarFileId?: string | null
  avatarUrl?: string | null
  catalogImageFileId?: string | null
  catalogImageUrl?: string | null
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
  materialSubsectionId: string | null
  title: string
  content: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  sortOrder: number
  publishedAt: string | null
  archivedAt: string | null
  createdByUserId: string
  files: FileObject[]
  createdAt: string
  updatedAt: string
}

export type AssignmentMaterialReference = {
  id: string
  title: string
  sortOrder: number
}

export type AssignmentTargets = {
  lessons: AssignmentMaterialReference[]
  materialSections: AssignmentMaterialReference[]
  materialSubsections: AssignmentMaterialReference[]
}

export type Assignment = {
  id: string
  groupId: string
  targets: AssignmentTargets
  title: string
  content: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  dueAt: string | null
  maxScore: number | null
  publishedAt: string | null
  archivedAt: string | null
  createdByUserId: string
  files: FileObject[]
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
  files: FileObject[]
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

export type MaterialLesson = {
  id: string
  groupId: string
  materialSubsectionId: string | null
  title: string
  status: Lesson['status']
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type MaterialSubsection = {
  id: string
  groupId: string
  sectionId: string
  title: string
  sortOrder: number
  lessonsCount: number
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export type MaterialSection = {
  id: string
  groupId: string
  title: string
  sortOrder: number
  createdByUserId: string
  subsections: MaterialSubsection[]
  createdAt: string
  updatedAt: string
}

export type MaterialSubsectionDetails = {
  section: {
    id: string
    title: string
    sortOrder: number
  }
  subsection: MaterialSubsection
  lessons: MaterialLesson[]
}

export type ScheduleEvent = {
  id: string
  groupId: string
  title: string
  description: string | null
  eventType: 'SPECIAL' | 'WEEKLY'
  startsAt: string
  endsAt: string
  weekday: number | null
  startTime: string | null
  endTime: string | null
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
  avatarFileId?: string | null
  catalogImageFileId?: string | null
  accessMode: Group['accessMode']
  settings: GroupSettings
}

export type UpdateGroupPayload = {
  name?: string
  description?: string
  avatarFileId?: string | null
  catalogImageFileId?: string | null
  accessMode?: Group['accessMode']
}

export type UpdateGroupSettingsPayload = Partial<GroupSettings>

export type CreateLessonPayload = {
  title: string
  materialSubsectionId?: string | null
  content?: string
  status?: Lesson['status']
  sortOrder?: number
  fileIds?: string[]
}

export type UpdateLessonPayload = Partial<CreateLessonPayload>

export type CreateAssignmentPayload = {
  lessonIds?: string[]
  materialSectionIds?: string[]
  materialSubsectionIds?: string[]
  title: string
  content?: string
  status?: Assignment['status']
  dueAt?: string
  maxScore?: number
  fileIds?: string[]
}

export type CreateMaterialSectionPayload = {
  title: string
  sortOrder?: number
}

export type CreateMaterialSubsectionPayload = {
  title: string
  sortOrder?: number
}

export type UpdateMaterialSectionPayload = Partial<CreateMaterialSectionPayload>

export type UpdateMaterialSubsectionPayload = Partial<CreateMaterialSubsectionPayload>

export type ListLessonsQuery = {
  materialSubsectionId?: string
}

export type ListAssignmentsQuery = {
  lessonId?: string
  materialSectionId?: string
  materialSubsectionId?: string
}

export type CreateSubmissionPayload = {
  text?: string
  fileIds?: string[]
  status?: Submission['status']
}

export type UpdateSubmissionPayload = {
  text?: string
  fileIds?: string[]
  status?: Submission['status']
  score?: number
  feedback?: string
}

export type CreateScheduleEventPayload = {
  title: string
  description?: string
  eventType?: ScheduleEvent['eventType']
  startsAt?: string
  endsAt?: string
  weekday?: number
  startTime?: string
  endTime?: string
  location?: string
}

export type CreateUsefulLinkPayload = {
  title: string
  url: string
  imageFileId?: string | null
  sortOrder?: number
}

export type UpdateUsefulLinkPayload = {
  title?: string
  url?: string
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

function buildQuery(params: Record<string, string | undefined> = {}) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value)
    }
  })

  const query = search.toString()

  return query ? `?${query}` : ''
}

export function listMaterials(groupId: string, token?: string | null) {
  return apiRequest<MaterialSection[]>(`/groups/${groupId}/materials`, { token })
}

export function createMaterialSection(
  groupId: string,
  payload: CreateMaterialSectionPayload,
  token?: string | null
) {
  return apiRequest<MaterialSection>(`/groups/${groupId}/materials/sections`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload)
  })
}

export function updateMaterialSection(
  groupId: string,
  sectionId: string,
  payload: UpdateMaterialSectionPayload,
  token?: string | null
) {
  return apiRequest<MaterialSection>(`/groups/${groupId}/materials/sections/${sectionId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload)
  })
}

export function deleteMaterialSection(groupId: string, sectionId: string, token?: string | null) {
  return apiRequest<void>(`/groups/${groupId}/materials/sections/${sectionId}`, {
    method: 'DELETE',
    token
  })
}

export function createMaterialSubsection(
  groupId: string,
  sectionId: string,
  payload: CreateMaterialSubsectionPayload,
  token?: string | null
) {
  return apiRequest<MaterialSubsectionDetails>(`/groups/${groupId}/materials/sections/${sectionId}/subsections`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload)
  })
}

export function updateMaterialSubsection(
  groupId: string,
  subsectionId: string,
  payload: UpdateMaterialSubsectionPayload,
  token?: string | null
) {
  return apiRequest<MaterialSubsectionDetails>(`/groups/${groupId}/materials/subsections/${subsectionId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload)
  })
}

export function deleteMaterialSubsection(groupId: string, subsectionId: string, token?: string | null) {
  return apiRequest<void>(`/groups/${groupId}/materials/subsections/${subsectionId}`, {
    method: 'DELETE',
    token
  })
}

export function getMaterialSubsection(groupId: string, subsectionId: string, token?: string | null) {
  return apiRequest<MaterialSubsectionDetails>(`/groups/${groupId}/materials/subsections/${subsectionId}`, { token })
}

export function listLessons(groupId: string, token?: string | null, query: ListLessonsQuery = {}) {
  return apiRequest<Lesson[]>(`/groups/${groupId}/lessons${buildQuery(query)}`, { token })
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

export function updateLesson(groupId: string, lessonId: string, payload: UpdateLessonPayload, token?: string | null) {
  return apiRequest<Lesson>(`/groups/${groupId}/lessons/${lessonId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload)
  })
}

export function deleteLesson(groupId: string, lessonId: string, token?: string | null) {
  return apiRequest<void>(`/groups/${groupId}/lessons/${lessonId}`, {
    method: 'DELETE',
    token
  })
}

export function listAssignments(groupId: string, token?: string | null, query: ListAssignmentsQuery = {}) {
  return apiRequest<Assignment[]>(`/groups/${groupId}/assignments${buildQuery(query)}`, { token })
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

export function listSubmissions(
  groupId: string,
  assignmentId: string,
  token?: string | null,
  query: { mineOnly?: boolean } = {}
) {
  return apiRequest<Submission[]>(
    `/groups/${groupId}/assignments/${assignmentId}/submissions${buildQuery({
      mineOnly: query.mineOnly === undefined ? undefined : String(query.mineOnly)
    })}`,
    { token }
  )
}

export function getSubmission(groupId: string, assignmentId: string, submissionId: string, token?: string | null) {
  return apiRequest<Submission>(`/groups/${groupId}/assignments/${assignmentId}/submissions/${submissionId}`, { token })
}

export function createSubmission(
  groupId: string,
  assignmentId: string,
  payload: CreateSubmissionPayload,
  token?: string | null
) {
  return apiRequest<Submission>(`/groups/${groupId}/assignments/${assignmentId}/submissions`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload)
  })
}

export function updateSubmission(
  groupId: string,
  assignmentId: string,
  submissionId: string,
  payload: UpdateSubmissionPayload,
  token?: string | null
) {
  return apiRequest<Submission>(`/groups/${groupId}/assignments/${assignmentId}/submissions/${submissionId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload)
  })
}

export function listScheduleEvents(
  groupId: string,
  token?: string | null,
  query: { eventType?: ScheduleEvent['eventType'] } = {}
) {
  return apiRequest<ScheduleEvent[]>(`/groups/${groupId}/schedule/events${buildQuery(query)}`, { token })
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

export function updateUsefulLink(
  groupId: string,
  linkId: string,
  payload: UpdateUsefulLinkPayload,
  token?: string | null
) {
  return apiRequest<UsefulLink>(`/groups/${groupId}/useful-links/${linkId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload)
  })
}

export function deleteUsefulLink(groupId: string, linkId: string, token?: string | null) {
  return apiRequest<void>(`/groups/${groupId}/useful-links/${linkId}`, {
    method: 'DELETE',
    token
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
