import type { RouteRecordRaw } from 'vue-router'

import AppShellLayout from '../layouts/AppShellLayout.vue'
import GroupWorkspaceLayout from '../layouts/GroupWorkspaceLayout.vue'
import PublicLayout from '../layouts/PublicLayout.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import RegisterPage from '../pages/auth/RegisterPage.vue'
import ChatsPage from '../pages/chats/ChatsPage.vue'
import CreateGroupPage from '../pages/groups/CreateGroupPage.vue'
import GroupAssignmentCreatePage from '../pages/groups/GroupAssignmentCreatePage.vue'
import GroupAssignmentDetailsPage from '../pages/groups/GroupAssignmentDetailsPage.vue'
import GroupAssignmentEditPage from '../pages/groups/GroupAssignmentEditPage.vue'
import GroupAssignmentSubmissionDetailsPage from '../pages/groups/GroupAssignmentSubmissionDetailsPage.vue'
import GroupAssignmentSubmissionsPage from '../pages/groups/GroupAssignmentSubmissionsPage.vue'
import GroupAssignmentsPage from '../pages/groups/GroupAssignmentsPage.vue'
import GroupChatsPage from '../pages/groups/GroupChatsPage.vue'
import GroupEntryPage from '../pages/groups/GroupEntryPage.vue'
import GroupLessonCreatePage from '../pages/groups/GroupLessonCreatePage.vue'
import GroupLessonDetailsPage from '../pages/groups/GroupLessonDetailsPage.vue'
import GroupLessonEditPage from '../pages/groups/GroupLessonEditPage.vue'
import GroupLessonsPage from '../pages/groups/GroupLessonsPage.vue'
import GroupMembersPage from '../pages/groups/GroupMembersPage.vue'
import GroupOverviewPage from '../pages/groups/GroupOverviewPage.vue'
import GroupPreviewPage from '../pages/groups/GroupPreviewPage.vue'
import GroupRequestsPage from '../pages/groups/GroupRequestsPage.vue'
import GroupScheduleEventCreatePage from '../pages/groups/GroupScheduleEventCreatePage.vue'
import GroupScheduleEventEditPage from '../pages/groups/GroupScheduleEventEditPage.vue'
import GroupSchedulePage from '../pages/groups/GroupSchedulePage.vue'
import GroupSettingsPage from '../pages/groups/GroupSettingsPage.vue'
import GroupsPage from '../pages/groups/GroupsPage.vue'
import JoinGroupPage from '../pages/groups/JoinGroupPage.vue'
import ProfilePage from '../pages/profile/ProfilePage.vue'
import HomePage from '../pages/public/HomePage.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'landing',
        component: HomePage,
        meta: {
          title: 'SmartTeach | Группы, уроки, задания и чаты',
        },
      },
      {
        path: 'login',
        name: 'login',
        component: LoginPage,
        meta: {
          guestOnly: true,
          title: 'Вход | SmartTeach',
        },
      },
      {
        path: 'register',
        name: 'register',
        component: RegisterPage,
        meta: {
          guestOnly: true,
          title: 'Регистрация | SmartTeach',
        },
      },
    ],
  },
  {
    path: '/',
    component: AppShellLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'groups',
        name: 'groups',
        component: GroupsPage,
        meta: {
          title: 'Группы | SmartTeach',
        },
      },
      {
        path: 'groups/create',
        name: 'group-create',
        component: CreateGroupPage,
        meta: {
          title: 'Создать группу | SmartTeach',
        },
      },
      {
        path: 'groups/join',
        name: 'group-join',
        component: JoinGroupPage,
        meta: {
          title: 'Вступить в группу | SmartTeach',
        },
      },
      {
        path: 'groups/:groupId',
        name: 'group-entry',
        component: GroupEntryPage,
        meta: {
          title: 'Открываем группу | SmartTeach',
        },
      },
      {
        path: 'groups/:groupId/preview',
        name: 'group-preview',
        component: GroupPreviewPage,
        meta: {
          title: 'Preview группы | SmartTeach',
        },
      },
      {
        path: 'chats',
        name: 'chats',
        component: ChatsPage,
        meta: {
          title: 'Чаты | SmartTeach',
        },
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfilePage,
        meta: {
          title: 'Профиль | SmartTeach',
        },
      },
      {
        path: 'groups/:groupId',
        component: GroupWorkspaceLayout,
        meta: {
          requiresGroupMembership: true,
        },
        children: [
          {
            path: '',
            redirect: (to) => ({
              name: 'group-overview',
              params: {
                groupId: to.params.groupId,
              },
            }),
          },
          {
            path: 'overview',
            name: 'group-overview',
            component: GroupOverviewPage,
            meta: {
              title: 'Обзор группы | SmartTeach',
            },
          },
          {
            path: 'lessons',
            name: 'group-lessons',
            component: GroupLessonsPage,
            meta: {
              title: 'Уроки группы | SmartTeach',
              workspaceModule: 'lessons',
            },
          },
          {
            path: 'lessons/new',
            name: 'group-lesson-create',
            component: GroupLessonCreatePage,
            meta: {
              title: 'Новый урок | SmartTeach',
              workspaceModule: 'lessons',
            },
          },
          {
            path: 'lessons/create',
            redirect: (to) => ({
              name: 'group-lesson-create',
              params: {
                groupId: to.params.groupId,
              },
            }),
          },
          {
            path: 'lessons/:lessonId/edit',
            name: 'group-lesson-edit',
            component: GroupLessonEditPage,
            meta: {
              title: 'Редактирование урока | SmartTeach',
              workspaceModule: 'lessons',
            },
          },
          {
            path: 'lessons/:lessonId',
            name: 'group-lesson-details',
            component: GroupLessonDetailsPage,
            meta: {
              title: 'Урок группы | SmartTeach',
              workspaceModule: 'lessons',
            },
          },
          {
            path: 'assignments',
            name: 'group-assignments',
            component: GroupAssignmentsPage,
            meta: {
              title: 'Задания группы | SmartTeach',
              workspaceModule: 'assignments',
            },
          },
          {
            path: 'assignments/new',
            name: 'group-assignment-create',
            component: GroupAssignmentCreatePage,
            meta: {
              title: 'Новое задание | SmartTeach',
              workspaceModule: 'assignments',
            },
          },
          {
            path: 'assignments/:assignmentId/edit',
            name: 'group-assignment-edit',
            component: GroupAssignmentEditPage,
            meta: {
              title: 'Редактирование задания | SmartTeach',
              workspaceModule: 'assignments',
            },
          },
          {
            path: 'assignments/:assignmentId/submissions',
            name: 'group-assignment-submissions',
            component: GroupAssignmentSubmissionsPage,
            meta: {
              title: 'Submissions задания | SmartTeach',
              workspaceModule: 'assignments',
            },
          },
          {
            path: 'assignments/:assignmentId/submissions/:submissionId',
            name: 'group-assignment-submission-details',
            component: GroupAssignmentSubmissionDetailsPage,
            meta: {
              title: 'Попытка по заданию | SmartTeach',
              workspaceModule: 'assignments',
            },
          },
          {
            path: 'assignments/:assignmentId',
            name: 'group-assignment-details',
            component: GroupAssignmentDetailsPage,
            meta: {
              title: 'Задание группы | SmartTeach',
              workspaceModule: 'assignments',
            },
          },
          {
            path: 'schedule/events/new',
            name: 'group-schedule-event-create',
            component: GroupScheduleEventCreatePage,
            meta: {
              title: 'Новое событие группы | SmartTeach',
              workspaceModule: 'schedule',
            },
          },
          {
            path: 'schedule/events/:eventId/edit',
            name: 'group-schedule-event-edit',
            component: GroupScheduleEventEditPage,
            meta: {
              title: 'Редактирование события | SmartTeach',
              workspaceModule: 'schedule',
            },
          },
          {
            path: 'schedule',
            name: 'group-schedule',
            component: GroupSchedulePage,
            meta: {
              title: 'Расписание группы | SmartTeach',
              workspaceModule: 'schedule',
            },
          },
          {
            path: 'chats',
            name: 'group-chats',
            component: GroupChatsPage,
            meta: {
              title: 'Чаты группы | SmartTeach',
            },
          },
          {
            path: 'members',
            name: 'group-members',
            component: GroupMembersPage,
            meta: {
              title: 'Участники группы | SmartTeach',
            },
          },
          {
            path: 'requests',
            name: 'group-requests',
            component: GroupRequestsPage,
            meta: {
              title: 'Заявки группы | SmartTeach',
            },
          },
          {
            path: 'settings',
            name: 'group-settings',
            component: GroupSettingsPage,
            meta: {
              title: 'Настройки группы | SmartTeach',
            },
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: {
      name: 'landing',
    },
  },
]
