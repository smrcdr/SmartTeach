import { z } from 'zod'

export const groupAccessModeValues = ['OPEN', 'BY_REQUEST', 'CLOSED'] as const
export const groupStatusValues = ['ACTIVE', 'ARCHIVED', 'DELETED'] as const
export const groupEditableStatusValues = ['ACTIVE', 'ARCHIVED'] as const

export const groupAccessModeSchema = z.enum(groupAccessModeValues)
export const groupStatusSchema = z.enum(groupStatusValues)
export const groupEditableStatusSchema = z.enum(groupEditableStatusValues)

export const groupSettingsSchema = z
  .object({
    chatEnabled: z.boolean(),
    lessonsEnabled: z.boolean(),
    assignmentsEnabled: z.boolean(),
    scheduleEnabled: z.boolean(),
  })
  .strict()

export const groupSettingsUpdateSchema = groupSettingsSchema.partial()
