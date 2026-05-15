import { z } from 'zod'

export const chatTypeValues = ['GROUP', 'DIRECT'] as const

export const chatTypeSchema = z.enum(chatTypeValues)

export const subscribeToChatSchema = z.object({
  chatId: z.string().uuid(),
})
