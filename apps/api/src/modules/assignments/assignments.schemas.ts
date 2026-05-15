import { z } from 'zod'

export const assignmentStatusValues = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const
export const submissionCreateStatusValues = ['DRAFT', 'SUBMITTED'] as const
export const submissionStatusValues = ['DRAFT', 'SUBMITTED', 'REVIEWED'] as const

export const assignmentStatusSchema = z.enum(assignmentStatusValues)
export const submissionCreateStatusSchema = z.enum(submissionCreateStatusValues)
export const submissionStatusSchema = z.enum(submissionStatusValues)
