import { z } from 'zod'

export const groupAccessModeValues = ['OPEN', 'BY_REQUEST', 'CLOSED'] as const
export const groupStatusValues = ['ACTIVE', 'ARCHIVED', 'DELETED'] as const
export const groupEditableStatusValues = ['ACTIVE', 'ARCHIVED'] as const
export const groupRoleValues = ['OWNER', 'ADMIN', 'USER'] as const
export const joinRequestStatusValues = ['PENDING', 'APPROVED', 'REJECTED'] as const
export const joinRequestDecisionValues = ['APPROVED', 'REJECTED'] as const

export const groupAccessModeSchema = z.enum(groupAccessModeValues)
export const groupStatusSchema = z.enum(groupStatusValues)
export const groupEditableStatusSchema = z.enum(groupEditableStatusValues)
export const groupRoleSchema = z.enum(groupRoleValues)
export const joinRequestStatusSchema = z.enum(joinRequestStatusValues)
export const joinRequestDecisionSchema = z.enum(joinRequestDecisionValues)

export const groupSettingsSchema = z
  .object({
    chatEnabled: z.boolean(),
    lessonsEnabled: z.boolean(),
    assignmentsEnabled: z.boolean(),
    scheduleEnabled: z.boolean(),
  })
  .strict()

export const groupSettingsUpdateSchema = groupSettingsSchema.partial()
