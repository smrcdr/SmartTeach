import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { GroupRole, PrismaClient } from '@prisma/client'
import { createApp } from '../main'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for group members and join requests e2e tests.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
})

const createdUserIds = new Set<string>()
const createdGroupIds = new Set<string>()
let app: INestApplication
let baseUrl: string

before(async () => {
  app = await createApp({
    enableSwagger: false,
  })
  await app.listen(0, '127.0.0.1')
  baseUrl = await app.getUrl()
})

after(async () => {
  if (createdGroupIds.size > 0) {
    await prisma.group.deleteMany({
      where: {
        id: {
          in: [...createdGroupIds],
        },
      },
    })
  }

  if (createdUserIds.size > 0) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [...createdUserIds],
        },
      },
    })
  }

  if (app) {
    await app.close()
  }

  await prisma.$disconnect()
})

type JsonRecord = Record<string, unknown>

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: JsonRecord
  token?: string
  headers?: Record<string, string>
}

type AuthSessionResponse = {
  user: {
    id: string
  }
  accessToken: string
}

type PublicUserResponse = {
  id: string
  displayName: string
  bio: string | null
  avatarFileId: string | null
}

type GroupResponse = {
  id: string
  ownerId: string
  accessMode: 'OPEN' | 'BY_REQUEST' | 'CLOSED'
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  archivedAt: string | null
}

type GroupMemberResponse = {
  groupId: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'USER'
  joinedAt: string
  updatedAt: string
  user: PublicUserResponse
}

type GroupJoinRequestResponse = {
  id: string
  groupId: string
  userId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedByUserId: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  user: PublicUserResponse
  reviewer: PublicUserResponse | null
}

async function request<T = JsonRecord>(path: string, init: RequestOptions = {}) {
  const headers = new Headers(init.headers)

  if (init.body !== undefined) {
    headers.set('content-type', 'application/json')
  }

  if (init.token) {
    headers.set('authorization', `Bearer ${init.token}`)
  }

  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  const rawBody = await response.text()

  return {
    response,
    body: rawBody.length > 0 ? (JSON.parse(rawBody) as T) : null,
  }
}

async function registerUser(label: string) {
  const email = `members-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@smarteach.local`
  const result = await request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
      displayName: `Members ${label}`,
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdUserIds.add(String(result.body.user.id))

  return result.body
}

async function createGroup(
  token: string,
  accessMode: 'OPEN' | 'BY_REQUEST' | 'CLOSED',
  name: string,
) {
  const result = await request<GroupResponse>('/groups', {
    method: 'POST',
    token,
    body: {
      name,
      accessMode,
      settings: {
        chatEnabled: true,
        lessonsEnabled: true,
        assignmentsEnabled: true,
        scheduleEnabled: true,
      },
    },
  })

  assert.equal(result.response.status, 201)
  assert.ok(result.body)
  createdGroupIds.add(result.body.id)

  return result.body
}

async function archiveGroup(token: string, groupId: string) {
  const result = await request<GroupResponse>(`/groups/${groupId}`, {
    method: 'PATCH',
    token,
    body: {
      status: 'ARCHIVED',
    },
  })

  assert.equal(result.response.status, 200)
  assert.ok(result.body)
  assert.equal(result.body.status, 'ARCHIVED')
  assert.ok(result.body.archivedAt)

  return result.body
}

test('group members endpoints support join, management and ownership transfer', async () => {
  const owner = await registerUser('owner')
  const joiner = await registerUser('joiner')
  const admin = await registerUser('admin')
  const candidateOwner = await registerUser('candidate-owner')
  const outsider = await registerUser('outsider')

  const group = await createGroup(owner.accessToken, 'OPEN', 'Membership Operations')

  const outsiderListResult = await request(`/groups/${group.id}/members`, {
    method: 'GET',
    token: outsider.accessToken,
  })

  assert.equal(outsiderListResult.response.status, 403)

  const joinResult = await request<GroupMemberResponse>(`/groups/${group.id}/join`, {
    method: 'POST',
    token: joiner.accessToken,
  })

  assert.equal(joinResult.response.status, 200)
  assert.ok(joinResult.body)
  assert.equal(joinResult.body.userId, joiner.user.id)
  assert.equal(joinResult.body.role, 'USER')

  const duplicateJoinResult = await request(`/groups/${group.id}/join`, {
    method: 'POST',
    token: joiner.accessToken,
  })

  assert.equal(duplicateJoinResult.response.status, 409)

  const addAdminResult = await request<GroupMemberResponse>(`/groups/${group.id}/members`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      userId: admin.user.id,
      role: 'ADMIN',
    },
  })

  assert.equal(addAdminResult.response.status, 201)
  assert.ok(addAdminResult.body)
  assert.equal(addAdminResult.body.role, 'ADMIN')

  const addCandidateOwnerResult = await request<GroupMemberResponse>(`/groups/${group.id}/members`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      userId: candidateOwner.user.id,
    },
  })

  assert.equal(addCandidateOwnerResult.response.status, 201)
  assert.ok(addCandidateOwnerResult.body)
  assert.equal(addCandidateOwnerResult.body.role, 'USER')

  const memberListResult = await request<GroupMemberResponse[]>(`/groups/${group.id}/members`, {
    method: 'GET',
    token: joiner.accessToken,
  })

  assert.equal(memberListResult.response.status, 200)
  assert.ok(memberListResult.body)
  assert.equal(memberListResult.body.length, 4)

  const promoteJoinerResult = await request<GroupMemberResponse>(
    `/groups/${group.id}/members/${joiner.user.id}`,
    {
      method: 'PATCH',
      token: admin.accessToken,
      body: {
        role: 'ADMIN',
      },
    },
  )

  assert.equal(promoteJoinerResult.response.status, 200)
  assert.ok(promoteJoinerResult.body)
  assert.equal(promoteJoinerResult.body.role, 'ADMIN')

  const ownerLeaveBlockedResult = await request(`/groups/${group.id}/leave`, {
    method: 'POST',
    token: owner.accessToken,
  })

  assert.equal(ownerLeaveBlockedResult.response.status, 403)

  const transferOwnershipResult = await request<GroupMemberResponse>(
    `/groups/${group.id}/members/${candidateOwner.user.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        role: 'OWNER',
      },
    },
  )

  assert.equal(transferOwnershipResult.response.status, 200)
  assert.ok(transferOwnershipResult.body)
  assert.equal(transferOwnershipResult.body.role, 'OWNER')

  const formerOwnerLeaveResult = await request(`/groups/${group.id}/leave`, {
    method: 'POST',
    token: owner.accessToken,
  })

  assert.equal(formerOwnerLeaveResult.response.status, 204)
  assert.equal(formerOwnerLeaveResult.body, null)

  const removeAdminResult = await request(`/groups/${group.id}/members/${admin.user.id}`, {
    method: 'DELETE',
    token: candidateOwner.accessToken,
  })

  assert.equal(removeAdminResult.response.status, 204)
  assert.equal(removeAdminResult.body, null)

  const finalMembersResult = await request<GroupMemberResponse[]>(`/groups/${group.id}/members`, {
    method: 'GET',
    token: candidateOwner.accessToken,
  })

  assert.equal(finalMembersResult.response.status, 200)
  assert.ok(finalMembersResult.body)
  assert.deepEqual(
    finalMembersResult.body.map((member) => ({
      userId: member.userId,
      role: member.role,
    })),
    [
      {
        userId: candidateOwner.user.id,
        role: 'OWNER',
      },
      {
        userId: joiner.user.id,
        role: 'ADMIN',
      },
    ],
  )

  const storedGroup = await prisma.group.findUnique({
    where: {
      id: group.id,
    },
    include: {
      members: true,
    },
  })

  assert.ok(storedGroup)
  assert.equal(storedGroup.ownerId, candidateOwner.user.id)
  assert.equal(storedGroup.members.length, 2)
  assert.equal(
    storedGroup.members.find((member) => member.userId === candidateOwner.user.id)?.role,
    GroupRole.OWNER,
  )
  assert.equal(
    storedGroup.members.find((member) => member.userId === joiner.user.id)?.role,
    GroupRole.ADMIN,
  )
})

test('join requests endpoints support submit, list, approve and reject flows', async () => {
  const owner = await registerUser('requests-owner')
  const requesterApproved = await registerUser('requests-approved')
  const requesterRejected = await registerUser('requests-rejected')
  const outsider = await registerUser('requests-outsider')

  const group = await createGroup(owner.accessToken, 'BY_REQUEST', 'Join Request Operations')

  const createApprovedRequestResult = await request<GroupJoinRequestResponse>(
    `/groups/${group.id}/join-requests`,
    {
      method: 'POST',
      token: requesterApproved.accessToken,
    },
  )

  assert.equal(createApprovedRequestResult.response.status, 201)
  assert.ok(createApprovedRequestResult.body)
  assert.equal(createApprovedRequestResult.body.status, 'PENDING')

  const duplicateRequestResult = await request(`/groups/${group.id}/join-requests`, {
    method: 'POST',
    token: requesterApproved.accessToken,
  })

  assert.equal(duplicateRequestResult.response.status, 409)

  const createRejectedRequestResult = await request<GroupJoinRequestResponse>(
    `/groups/${group.id}/join-requests`,
    {
      method: 'POST',
      token: requesterRejected.accessToken,
    },
  )

  assert.equal(createRejectedRequestResult.response.status, 201)
  assert.ok(createRejectedRequestResult.body)
  assert.equal(createRejectedRequestResult.body.status, 'PENDING')

  const outsiderListResult = await request(`/groups/${group.id}/join-requests`, {
    method: 'GET',
    token: outsider.accessToken,
  })

  assert.equal(outsiderListResult.response.status, 403)

  const pendingListResult = await request<GroupJoinRequestResponse[]>(
    `/groups/${group.id}/join-requests?status=PENDING`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(pendingListResult.response.status, 200)
  assert.ok(pendingListResult.body)
  assert.equal(pendingListResult.body.length, 2)

  const approveResult = await request<GroupJoinRequestResponse>(
    `/groups/${group.id}/join-requests/${createApprovedRequestResult.body.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        decision: 'APPROVED',
      },
    },
  )

  assert.equal(approveResult.response.status, 200)
  assert.ok(approveResult.body)
  assert.equal(approveResult.body.status, 'APPROVED')
  assert.equal(approveResult.body.reviewedByUserId, owner.user.id)
  assert.ok(approveResult.body.reviewer)

  const rejectResult = await request<GroupJoinRequestResponse>(
    `/groups/${group.id}/join-requests/${createRejectedRequestResult.body.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        decision: 'REJECTED',
      },
    },
  )

  assert.equal(rejectResult.response.status, 200)
  assert.ok(rejectResult.body)
  assert.equal(rejectResult.body.status, 'REJECTED')

  const reapproveResult = await request(
    `/groups/${group.id}/join-requests/${createRejectedRequestResult.body.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        decision: 'APPROVED',
      },
    },
  )

  assert.equal(reapproveResult.response.status, 400)

  const rejectedListResult = await request<GroupJoinRequestResponse[]>(
    `/groups/${group.id}/join-requests?status=REJECTED`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(rejectedListResult.response.status, 200)
  assert.ok(rejectedListResult.body)
  assert.equal(rejectedListResult.body.length, 1)
  assert.equal(rejectedListResult.body[0]?.id, createRejectedRequestResult.body.id)

  const approvedMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: requesterApproved.user.id,
      },
    },
    select: {
      role: true,
    },
  })

  const rejectedMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: requesterRejected.user.id,
      },
    },
    select: {
      role: true,
    },
  })

  assert.deepEqual(approvedMembership, {
    role: GroupRole.USER,
  })
  assert.equal(rejectedMembership, null)
})

test('manual member add settles an existing pending join request', async () => {
  const owner = await registerUser('requests-manual-owner')
  const requester = await registerUser('requests-manual-requester')

  const group = await createGroup(owner.accessToken, 'BY_REQUEST', 'Manual Membership Approval')

  const createRequestResult = await request<GroupJoinRequestResponse>(
    `/groups/${group.id}/join-requests`,
    {
      method: 'POST',
      token: requester.accessToken,
    },
  )

  assert.equal(createRequestResult.response.status, 201)
  assert.ok(createRequestResult.body)
  assert.equal(createRequestResult.body.status, 'PENDING')

  const manualAddResult = await request<GroupMemberResponse>(`/groups/${group.id}/members`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      userId: requester.user.id,
    },
  })

  assert.equal(manualAddResult.response.status, 201)
  assert.ok(manualAddResult.body)
  assert.equal(manualAddResult.body.userId, requester.user.id)

  const pendingListResult = await request<GroupJoinRequestResponse[]>(
    `/groups/${group.id}/join-requests?status=PENDING`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(pendingListResult.response.status, 200)
  assert.ok(pendingListResult.body)
  assert.deepEqual(pendingListResult.body, [])

  const approvedListResult = await request<GroupJoinRequestResponse[]>(
    `/groups/${group.id}/join-requests?status=APPROVED`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(approvedListResult.response.status, 200)
  assert.ok(approvedListResult.body)
  assert.equal(approvedListResult.body.length, 1)
  assert.equal(approvedListResult.body[0]?.id, createRequestResult.body.id)
  assert.equal(approvedListResult.body[0]?.reviewedByUserId, owner.user.id)
})

test('changing access mode away from BY_REQUEST rejects stale pending join requests', async () => {
  const owner = await registerUser('requests-mode-owner')
  const requester = await registerUser('requests-mode-requester')

  const group = await createGroup(owner.accessToken, 'BY_REQUEST', 'Join Request Access Mode Change')

  const createRequestResult = await request<GroupJoinRequestResponse>(
    `/groups/${group.id}/join-requests`,
    {
      method: 'POST',
      token: requester.accessToken,
    },
  )

  assert.equal(createRequestResult.response.status, 201)
  assert.ok(createRequestResult.body)
  assert.equal(createRequestResult.body.status, 'PENDING')

  const updateGroupResult = await request<GroupResponse>(`/groups/${group.id}`, {
    method: 'PATCH',
    token: owner.accessToken,
    body: {
      accessMode: 'OPEN',
    },
  })

  assert.equal(updateGroupResult.response.status, 200)
  assert.ok(updateGroupResult.body)
  assert.equal(updateGroupResult.body.accessMode, 'OPEN')

  const pendingListResult = await request<GroupJoinRequestResponse[]>(
    `/groups/${group.id}/join-requests?status=PENDING`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(pendingListResult.response.status, 200)
  assert.ok(pendingListResult.body)
  assert.deepEqual(pendingListResult.body, [])

  const rejectedListResult = await request<GroupJoinRequestResponse[]>(
    `/groups/${group.id}/join-requests?status=REJECTED`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(rejectedListResult.response.status, 200)
  assert.ok(rejectedListResult.body)
  assert.equal(rejectedListResult.body.length, 1)
  assert.equal(rejectedListResult.body[0]?.id, createRequestResult.body.id)
  assert.equal(rejectedListResult.body[0]?.reviewedByUserId, owner.user.id)

  const joinResult = await request<GroupMemberResponse>(`/groups/${group.id}/join`, {
    method: 'POST',
    token: requester.accessToken,
  })

  assert.equal(joinResult.response.status, 200)
  assert.ok(joinResult.body)
  assert.equal(joinResult.body.userId, requester.user.id)
})

test('join request creation preserves the single pending request invariant under concurrency', async () => {
  const owner = await registerUser('requests-race-owner')
  const requester = await registerUser('requests-race-requester')

  const group = await createGroup(
    owner.accessToken,
    'BY_REQUEST',
    'Concurrent Join Request Invariant',
  )

  const concurrentResults = await Promise.all([
    request<GroupJoinRequestResponse>(`/groups/${group.id}/join-requests`, {
      method: 'POST',
      token: requester.accessToken,
    }),
    request<GroupJoinRequestResponse>(`/groups/${group.id}/join-requests`, {
      method: 'POST',
      token: requester.accessToken,
    }),
  ])

  assert.deepEqual(
    concurrentResults
      .map((result) => result.response.status)
      .sort((left, right) => left - right),
    [201, 409],
  )

  const pendingRequests = await prisma.groupJoinRequest.findMany({
    where: {
      groupId: group.id,
      userId: requester.user.id,
      status: 'PENDING',
    },
    select: {
      id: true,
      status: true,
    },
  })

  assert.equal(pendingRequests.length, 1)
  assert.equal(pendingRequests[0]?.status, 'PENDING')
})

test('archived groups remain readable but reject member and join-request writes', async () => {
  const owner = await registerUser('archived-owner')
  const member = await registerUser('archived-member')
  const managedMember = await registerUser('archived-managed-member')
  const outsider = await registerUser('archived-outsider')
  const requester = await registerUser('archived-requester')

  const openGroup = await createGroup(owner.accessToken, 'OPEN', 'Archived Membership Controls')
  const byRequestGroup = await createGroup(
    owner.accessToken,
    'BY_REQUEST',
    'Archived Join Request Controls',
  )

  const joinMemberResult = await request<GroupMemberResponse>(`/groups/${openGroup.id}/join`, {
    method: 'POST',
    token: member.accessToken,
  })

  assert.equal(joinMemberResult.response.status, 200)
  assert.ok(joinMemberResult.body)

  const addManagedMemberResult = await request<GroupMemberResponse>(`/groups/${openGroup.id}/members`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      userId: managedMember.user.id,
    },
  })

  assert.equal(addManagedMemberResult.response.status, 201)
  assert.ok(addManagedMemberResult.body)

  const createPendingRequestResult = await request<GroupJoinRequestResponse>(
    `/groups/${byRequestGroup.id}/join-requests`,
    {
      method: 'POST',
      token: requester.accessToken,
    },
  )

  assert.equal(createPendingRequestResult.response.status, 201)
  assert.ok(createPendingRequestResult.body)
  assert.equal(createPendingRequestResult.body.status, 'PENDING')

  await archiveGroup(owner.accessToken, openGroup.id)
  await archiveGroup(owner.accessToken, byRequestGroup.id)

  const archivedMembersResult = await request<GroupMemberResponse[]>(`/groups/${openGroup.id}/members`, {
    method: 'GET',
    token: member.accessToken,
  })

  assert.equal(archivedMembersResult.response.status, 200)
  assert.ok(archivedMembersResult.body)
  assert.equal(archivedMembersResult.body.length, 3)

  const archivedJoinRequestsResult = await request<GroupJoinRequestResponse[]>(
    `/groups/${byRequestGroup.id}/join-requests?status=PENDING`,
    {
      method: 'GET',
      token: owner.accessToken,
    },
  )

  assert.equal(archivedJoinRequestsResult.response.status, 200)
  assert.ok(archivedJoinRequestsResult.body)
  assert.equal(archivedJoinRequestsResult.body.length, 1)
  assert.equal(archivedJoinRequestsResult.body[0]?.id, createPendingRequestResult.body.id)

  const archivedJoinResult = await request(`/groups/${openGroup.id}/join`, {
    method: 'POST',
    token: outsider.accessToken,
  })

  assert.equal(archivedJoinResult.response.status, 403)

  const archivedLeaveResult = await request(`/groups/${openGroup.id}/leave`, {
    method: 'POST',
    token: member.accessToken,
  })

  assert.equal(archivedLeaveResult.response.status, 403)

  const archivedCreateMemberResult = await request(`/groups/${openGroup.id}/members`, {
    method: 'POST',
    token: owner.accessToken,
    body: {
      userId: outsider.user.id,
    },
  })

  assert.equal(archivedCreateMemberResult.response.status, 403)

  const archivedUpdateMemberResult = await request(
    `/groups/${openGroup.id}/members/${managedMember.user.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        role: 'ADMIN',
      },
    },
  )

  assert.equal(archivedUpdateMemberResult.response.status, 403)

  const archivedDeleteMemberResult = await request(
    `/groups/${openGroup.id}/members/${managedMember.user.id}`,
    {
      method: 'DELETE',
      token: owner.accessToken,
    },
  )

  assert.equal(archivedDeleteMemberResult.response.status, 403)

  const archivedCreateJoinRequestResult = await request(`/groups/${byRequestGroup.id}/join-requests`, {
    method: 'POST',
    token: outsider.accessToken,
  })

  assert.equal(archivedCreateJoinRequestResult.response.status, 403)

  const archivedDecisionResult = await request(
    `/groups/${byRequestGroup.id}/join-requests/${createPendingRequestResult.body.id}`,
    {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        decision: 'APPROVED',
      },
    },
  )

  assert.equal(archivedDecisionResult.response.status, 403)

  const storedOpenGroupMembers = await prisma.groupMember.findMany({
    where: {
      groupId: openGroup.id,
    },
    orderBy: {
      userId: 'asc',
    },
    select: {
      userId: true,
      role: true,
    },
  })

  assert.deepEqual(storedOpenGroupMembers, [
    {
      userId: managedMember.user.id,
      role: GroupRole.USER,
    },
    {
      userId: member.user.id,
      role: GroupRole.USER,
    },
    {
      userId: owner.user.id,
      role: GroupRole.OWNER,
    },
  ].sort((left, right) => left.userId.localeCompare(right.userId)))

  const storedPendingRequest = await prisma.groupJoinRequest.findUnique({
    where: {
      id: createPendingRequestResult.body.id,
    },
    select: {
      status: true,
      reviewedByUserId: true,
      reviewedAt: true,
    },
  })

  assert.deepEqual(storedPendingRequest, {
    status: 'PENDING',
    reviewedByUserId: null,
    reviewedAt: null,
  })
})
