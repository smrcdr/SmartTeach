import { z } from 'zod'

export const lessonStatusValues = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const

export const lessonStatusSchema = z.enum(lessonStatusValues)
