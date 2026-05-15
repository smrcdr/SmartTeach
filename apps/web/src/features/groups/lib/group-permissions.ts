import type { Group } from '../api/groups.api'

const groupManageRoles = new Set<Group['viewerMembershipRole']>(['OWNER', 'ADMIN'])

export function canManageGroup(group: Pick<Group, 'viewerMembershipRole'> | null | undefined) {
  return groupManageRoles.has(group?.viewerMembershipRole ?? null)
}

export function isGroupMember(group: Pick<Group, 'viewerMembershipRole'> | null | undefined) {
  return Boolean(group?.viewerMembershipRole)
}
