import type { RouteRecordRaw } from 'vue-router'

import AppShellLayout from '../layouts/AppShellLayout.vue'
import GroupWorkspaceLayout from '../layouts/GroupWorkspaceLayout.vue'
import PublicLayout from '../layouts/PublicLayout.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import RegisterPage from '../pages/auth/RegisterPage.vue'
import ChatsPage from '../pages/chats/ChatsPage.vue'
import CreateGroupPage from '../pages/groups/CreateGroupPage.vue'
import GroupAssignmentsPage from '../pages/groups/GroupAssignmentsPage.vue'
import GroupChatsPage from '../pages/groups/GroupChatsPage.vue'
import GroupLessonsPage from '../pages/groups/GroupLessonsPage.vue'
import GroupMembersPage from '../pages/groups/GroupMembersPage.vue'
import GroupOverviewPage from '../pages/groups/GroupOverviewPage.vue'
import GroupRequestsPage from '../pages/groups/GroupRequestsPage.vue'
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
          title: 'SmartTeach',
        },
      },
      {
        path: 'login',
        name: 'login',
        component: LoginPage,
        meta: {
          title: 'Вход | SmartTeach',
        },
      },
      {
        path: 'register',
        name: 'register',
        component: RegisterPage,
        meta: {
          title: 'Регистрация | SmartTeach',
        },
      },
    ],
  },
  {
    path: '/',
    component: AppShellLayout,
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
            },
          },
          {
            path: 'assignments',
            name: 'group-assignments',
            component: GroupAssignmentsPage,
            meta: {
              title: 'Задания группы | SmartTeach',
            },
          },
          {
            path: 'schedule',
            name: 'group-schedule',
            component: GroupSchedulePage,
            meta: {
              title: 'Расписание группы | SmartTeach',
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
