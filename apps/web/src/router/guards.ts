import type { Router } from 'vue-router'

import { appName } from '../app/config/brand'
import { queryClient } from '../app/providers/query'
import { pinia } from '../app/providers/pinia'
import { getGroup, GroupsApiError } from '../features/groups/api/groups.api'
import {
  getGroupWorkspaceNavItemByModule,
  getGroupWorkspaceNavItemByRouteName,
  isGroupWorkspaceModule,
  isGroupWorkspaceNavItemVisible,
} from '../features/groups/config/group-workspace-nav'
import { useAuthStore } from '../features/auth/stores/auth.store'
import { groupQueryKeys } from '../features/groups/composables/useGroups'

export function installRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore(pinia)

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const guestOnly = to.matched.some((record) => record.meta.guestOnly)
    const requiresResolvedAuthState = requiresAuth || guestOnly

    if (requiresResolvedAuthState && !authStore.hasInitialized) {
      await authStore.initialize()
    }

    if (requiresAuth && !authStore.isAuthenticated) {
      return {
        name: 'login',
        query: to.fullPath === '/groups' ? {} : { redirect: to.fullPath },
      }
    }

    if (guestOnly && authStore.hasInitialized && authStore.isAuthenticated) {
      return {
        name: 'groups',
      }
    }

    const requiresGroupMembership = to.matched.some((record) => record.meta.requiresGroupMembership)

    if (requiresGroupMembership) {
      const groupId = resolveGroupId(to.params.groupId)

      if (!groupId) {
        return {
          name: 'groups',
        }
      }

      try {
        const group = await queryClient.ensureQueryData({
          queryKey: groupQueryKeys.detail(groupId),
          queryFn: () => getGroup(groupId),
        })

        if (!group.viewerMembershipRole) {
          return {
            name: 'group-preview',
            params: {
              groupId,
            },
          }
        }

        const routeName = typeof to.name === 'string' ? to.name : ''
        const workspaceModule = [...to.matched]
          .reverse()
          .find((record) => typeof record.meta.workspaceModule === 'string')?.meta.workspaceModule
        const workspaceNavItem =
          (typeof workspaceModule === 'string' && isGroupWorkspaceModule(workspaceModule)
            ? getGroupWorkspaceNavItemByModule(workspaceModule)
            : null) ??
          (routeName ? getGroupWorkspaceNavItemByRouteName(routeName) : null)

        if (
          workspaceNavItem &&
          !isGroupWorkspaceNavItemVisible(
            workspaceNavItem,
            group,
            group.settings,
            group.viewerMembershipRole,
          )
        ) {
          return {
            name: 'group-overview',
            params: {
              groupId,
            },
          }
        }
      } catch (error) {
        if (error instanceof GroupsApiError && (error.statusCode === 403 || error.statusCode === 404)) {
          return {
            name: 'groups',
          }
        }

        throw error
      }
    }

    return true
  })

  router.afterEach((to) => {
    const rawTitle = typeof to.meta.title === 'string' ? to.meta.title : appName

    document.title = rawTitle.includes(appName) ? rawTitle : `${rawTitle} | ${appName}`
  })
}

function resolveGroupId(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : ''
  }

  return ''
}
