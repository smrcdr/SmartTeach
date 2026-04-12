import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ErrorResponseDto {
  @ApiProperty({
    example: 400,
  })
  statusCode!: number

  @ApiProperty({
    example: 'Validation failed',
  })
  message!: string

  @ApiPropertyOptional({
    type: [String],
    example: ['email: Invalid email address'],
  })
  errors?: string[]
}
