import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

function normalizeOptionalDateTime(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class CreateScheduleEventRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(200),
      description: z.string().optional(),
      startsAt: z.preprocess(
        normalizeOptionalDateTime,
        z.string().datetime({
          offset: true,
        }),
      ),
      endsAt: z.preprocess(
        normalizeOptionalDateTime,
        z.string().datetime({
          offset: true,
        }),
      ),
      location: z.string().max(255).optional(),
    })
    .strict()

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    example: 'Demo day rehearsal',
  })
  title!: string

  @ApiPropertyOptional({
    example: 'Репетиция финальной презентации перед защитой.',
  })
  description?: string

  @ApiProperty({
    format: 'date-time',
    example: '2026-04-16T12:00:00.000Z',
  })
  startsAt!: string

  @ApiProperty({
    format: 'date-time',
    example: '2026-04-16T13:30:00.000Z',
  })
  endsAt!: string

  @ApiPropertyOptional({
    example: 'Zoom / Room 204',
  })
  location?: string
}
