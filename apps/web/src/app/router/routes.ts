import type { RouteRecordRaw } from 'vue-router'
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Home,
  MessageCircle,
  Settings,
  UserPlus,
  Users
} from 'lucide-vue-next'

export const groupWorkspaceNav = [
  { key: 'overview', label: 'Обзор', icon: Home, toName: 'group-workspace', activeNames: ['group-workspace'] },
  {
    key: 'lessons',
    label: 'Уроки',
    icon: BookOpen,
    toName: 'group-lessons',
    activeNames: ['group-lessons', 'group-lesson-create', 'group-lesson-details', 'group-lesson-edit']
  },
  {
    key: 'assignments',
    label: 'Задания',
    icon: ClipboardList,
    toName: 'group-assignments',
    activeNames: [
      'group-assignments',
      'group-assignment-create',
      'group-assignment-details',
      'group-assignment-edit',
      'group-assignment-submissions',
      'group-assignment-submission-details'
    ]
  },
  { key: 'members', label: 'Участники', icon: Users, toName: 'group-members', activeNames: ['group-members'] },
  {
    key: 'schedule',
    label: 'Расписание',
    icon: CalendarDays,
    toName: 'group-schedule',
    activeNames: ['group-schedule', 'group-schedule-event-create', 'group-schedule-event-edit']
  },
  { key: 'chats', label: 'Чаты', icon: MessageCircle, toName: 'group-chats', activeNames: ['group-chats'] },
  {
    key: 'requests',
    label: 'Заявки',
    icon: UserPlus,
    toName: 'group-requests',
    activeNames: ['group-requests'],
    adminOnly: true
  },
  {
    key: 'settings',
    label: 'Настройки',
    icon: Settings,
    toName: 'group-settings',
    activeNames: ['group-settings'],
    adminOnly: true
  }
] as const

const PublicLayout = () => import('@/layouts/PublicLayout.vue')
const AppShellLayout = () => import('@/layouts/AppShellLayout.vue')
const GroupWorkspaceLayout = () => import('@/layouts/GroupWorkspaceLayout.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/pages/public/HomePage.vue') },
      { path: 'login', name: 'login', component: () => import('@/pages/auth/LoginPage.vue') },
      { path: 'register', name: 'register', component: () => import('@/pages/auth/RegisterPage.vue') }
    ]
  },
  {
    path: '/',
    component: AppShellLayout,
    children: [
      { path: 'catalog', name: 'catalog', component: () => import('@/pages/groups/GroupsPage.vue') },
      { path: 'my-groups', name: 'my-groups', meta: { requiresAuth: true }, component: () => import('@/pages/groups/MyGroupsPage.vue') },
      { path: 'groups/new', name: 'group-create', meta: { requiresAuth: true }, component: () => import('@/pages/groups/CreateGroupPage.vue') },
      { path: 'groups/join', name: 'join-group', component: () => import('@/pages/groups/JoinGroupPage.vue') },
      { path: 'groups/:groupId', name: 'group-preview', component: () => import('@/pages/groups/GroupPreviewPage.vue') },
      { path: 'chats', name: 'chats', meta: { requiresAuth: true }, component: () => import('@/pages/chats/ChatsPage.vue') },
      { path: 'profile', name: 'profile', meta: { requiresAuth: true }, component: () => import('@/pages/profile/ProfilePage.vue') },
      { path: 'profile/edit', name: 'profile-edit', meta: { requiresAuth: true }, component: () => import('@/pages/profile/ProfileEditPage.vue') },
      { path: 'users/:userId', name: 'public-profile', component: () => import('@/pages/profile/PublicUserPage.vue') }
    ]
  },
  {
    path: '/groups/:groupId/workspace',
    meta: { requiresAuth: true },
    component: GroupWorkspaceLayout,
    children: [
      { path: '', name: 'group-workspace', component: () => import('@/pages/groups/GroupOverviewPage.vue') },
      { path: 'lessons', name: 'group-lessons', component: () => import('@/pages/groups/GroupLessonsPage.vue') },
      { path: 'lessons/new', name: 'group-lesson-create', component: () => import('@/pages/groups/GroupLessonCreatePage.vue') },
      { path: 'lessons/:lessonId', name: 'group-lesson-details', component: () => import('@/pages/groups/GroupLessonDetailsPage.vue') },
      { path: 'lessons/:lessonId/edit', name: 'group-lesson-edit', component: () => import('@/pages/groups/GroupLessonEditPage.vue') },
      { path: 'assignments', name: 'group-assignments', component: () => import('@/pages/groups/GroupAssignmentsPage.vue') },
      { path: 'assignments/new', name: 'group-assignment-create', component: () => import('@/pages/groups/GroupAssignmentCreatePage.vue') },
      { path: 'assignments/:assignmentId', name: 'group-assignment-details', component: () => import('@/pages/groups/GroupAssignmentDetailsPage.vue') },
      { path: 'assignments/:assignmentId/edit', name: 'group-assignment-edit', component: () => import('@/pages/groups/GroupAssignmentEditPage.vue') },
      { path: 'assignments/:assignmentId/submissions', name: 'group-assignment-submissions', component: () => import('@/pages/groups/GroupAssignmentSubmissionsPage.vue') },
      { path: 'assignments/:assignmentId/submissions/:submissionId', name: 'group-assignment-submission-details', component: () => import('@/pages/groups/GroupAssignmentSubmissionDetailsPage.vue') },
      { path: 'members', name: 'group-members', component: () => import('@/pages/groups/GroupMembersPage.vue') },
      { path: 'schedule', name: 'group-schedule', component: () => import('@/pages/groups/GroupSchedulePage.vue') },
      { path: 'schedule/new', name: 'group-schedule-event-create', component: () => import('@/pages/groups/GroupScheduleEventCreatePage.vue') },
      { path: 'schedule/:eventId/edit', name: 'group-schedule-event-edit', component: () => import('@/pages/groups/GroupScheduleEventEditPage.vue') },
      { path: 'chats', name: 'group-chats', component: () => import('@/pages/groups/GroupChatsPage.vue') },
      { path: 'requests', name: 'group-requests', component: () => import('@/pages/groups/GroupRequestsPage.vue') },
      { path: 'settings', name: 'group-settings', component: () => import('@/pages/groups/GroupSettingsPage.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]
