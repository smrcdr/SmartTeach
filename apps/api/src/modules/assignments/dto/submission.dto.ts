import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { FileObjectDto } from '../../files/dto/file-object.dto'
import { PublicUserDto } from '../../users/dto/public-user.dto'
import { submissionStatusValues } from '../assignments.schemas'

export class SubmissionDto {
  @ApiProperty({
    format: 'uuid',
    example: '99999999-9999-4999-8999-999999999999',
  })
  id!: string

  @ApiProperty({
    format: 'uuid',
    example: '88888888-8888-4888-8888-888888888888',
  })
  assignmentId!: string

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  authorId!: string

  @ApiProperty({
    minimum: 1,
    example: 2,
  })
  attemptNumber!: number

  @ApiPropertyOptional({
    nullable: true,
    example: 'Финальная версия работы.',
  })
  text!: string | null

  @ApiProperty({
    enum: submissionStatusValues,
    example: 'SUBMITTED',
  })
  status!: (typeof submissionStatusValues)[number]

  @ApiProperty({
    type: () => FileObjectDto,
    isArray: true,
  })
  files!: FileObjectDto[]

  @ApiPropertyOptional({
    minimum: 0,
    nullable: true,
    example: 90,
  })
  score!: number | null

  @ApiPropertyOptional({
    nullable: true,
    example: 'Хорошая работа, но нужно закрыть edge case с правами доступа.',
  })
  feedback!: string | null

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  submittedAt!: string | null

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: '22222222-2222-4222-8222-222222222222',
  })
  reviewedByUserId!: string | null

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  reviewedAt!: string | null

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: string

  @ApiProperty({
    type: () => PublicUserDto,
  })
  author!: PublicUserDto

  @ApiPropertyOptional({
    type: () => PublicUserDto,
    nullable: true,
  })
  reviewer!: PublicUserDto | null
}
