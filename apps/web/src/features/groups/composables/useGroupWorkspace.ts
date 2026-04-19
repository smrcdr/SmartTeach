import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import type { Group, GroupSettings, ListGroupScheduleQuery } from '../api/groups.api'
import {
  groupWorkspaceNav,
  isGroupWorkspaceNavItemVisible,
  type GroupWorkspaceNavItem,
} from '../config/group-workspace-nav'
import { useGroup, useGroupSchedule, useGroupSettings } from './useGroups'

type VisibleGroupWorkspaceNavItem = GroupWorkspaceNavItem & {
  to: {
    name: string
    params: {
      groupId: string
    }
  }
}

const UPCOMING_WINDOW_DAYS = 30

export function useGroupWorkspace(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const groupQuery = useGroup(resolvedGroupId)
  const group = computed(() => groupQuery.data.value ?? null)
  const membershipRole = computed(() => group.value?.viewerMembershipRole ?? null)
  const isMember = computed(() => Boolean(membershipRole.value))
  const isOwner = computed(() => membershipRole.value === 'OWNER')
  const isAdmin = computed(() => membershipRole.value === 'ADMIN')
  const canManageGroup = computed(() => isOwner.value || isAdmin.value)

  const settingsQuery = useGroupSettings(resolvedGroupId, {
    enabled: isMember,
  })
  const settings = computed(() => settingsQuery.data.value ?? group.value?.settings ?? null)
  const isScheduleModuleEnabled = computed(() => Boolean(settings.value?.scheduleEnabled))

  const scheduleRange = computed<Partial<ListGroupScheduleQuery>>(() => createUpcomingScheduleRange())
  const scheduleQuery = useGroupSchedule(resolvedGroupId, scheduleRange, {
    enabled: computed(() => isMember.value && Boolean(settings.value) && isScheduleModuleEnabled.value),
  })
  const upcomingEntries = computed(() =>
    [...(scheduleQuery.data.value ?? [])]
      .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
      .slice(0, 5),
  )

  const visibleNavItems = computed<VisibleGroupWorkspaceNavItem[]>(() => {
    if (!group.value || !settings.value) {
      return []
    }

    return groupWorkspaceNav
      .filter((item) =>
        isGroupWorkspaceNavItemVisible(
          item,
          group.value as Group,
          settings.value as GroupSettings,
          membershipRole.value,
        ),
      )
      .map((item) => ({
        ...item,
        to: {
          name: item.routeName,
          params: {
            groupId: resolvedGroupId.value,
          },
        },
      }))
  })

  return {
    groupQuery,
    settingsQuery,
    scheduleQuery,
    group,
    settings,
    membershipRole,
    isMember,
    isOwner,
    isAdmin,
    canManageGroup,
    isReadOnly: computed(() => group.value?.status === 'ARCHIVED'),
    isScheduleModuleEnabled,
    isWorkspacePending: computed(
      () => groupQuery.isPending.value || (isMember.value && !settings.value && settingsQuery.isPending.value),
    ),
    workspaceError: computed(() => groupQuery.error.value),
    upcomingEntries,
    visibleNavItems,
    primaryNavItems: computed(() => visibleNavItems.value.filter((item) => item.key !== 'overview')),
  }
}

function createUpcomingScheduleRange() {
  const from = new Date()
  const to = new Date(from)

  to.setDate(to.getDate() + UPCOMING_WINDOW_DAYS)

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}
