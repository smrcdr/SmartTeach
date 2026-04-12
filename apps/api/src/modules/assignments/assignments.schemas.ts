import { z } from 'zod'

export const assignmentStatusValues = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const
export const submissionStatusValues = ['DRAFT', 'SUBMITTED', 'REVIEWED'] as const

export const assignmentStatusSchema = z.enum(assignmentStatusValues)
export const submissionStatusSchema = z.enum(submissionStatusValues)
