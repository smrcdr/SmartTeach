import { z } from 'zod'

export const scheduleEventStatusValues = ['PLANNED', 'CANCELLED'] as const
export const scheduleEventTypeValues = ['SPECIAL', 'WEEKLY'] as const

export const scheduleEventStatusSchema = z.enum(scheduleEventStatusValues)
export const scheduleEventTypeSchema = z.enum(scheduleEventTypeValues)

export const scheduleEntryTypeValues = ['ASSIGNMENT_DEADLINE', 'CUSTOM_EVENT'] as const

export const scheduleEntryTypeSchema = z.enum(scheduleEntryTypeValues)
