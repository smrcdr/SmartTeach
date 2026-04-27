import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { FileObjectDto } from '../../files/dto/file-object.dto'
import { assignmentStatusValues } from '../assignments.schemas'

export class AssignmentMaterialReferenceDto {
  @ApiProperty({
    format: 'uuid',
    example: '77777777-7777-4777-8777-777777777777',
  })
  id!: string

  @ApiProperty({
    example: 'Intro to API Contracts',
  })
  title!: string

  @ApiProperty({
    minimum: 1,
    example: 1,
  })
  sortOrder!: number
}

export class AssignmentTargetsDto {
  @ApiProperty({
    type: () => AssignmentMaterialReferenceDto,
    isArray: true,
  })
  lessons!: AssignmentMaterialReferenceDto[]

  @ApiProperty({
    type: () => AssignmentMaterialReferenceDto,
    isArray: true,
  })
  materialSections!: AssignmentMaterialReferenceDto[]

  @ApiProperty({
    type: () => AssignmentMaterialReferenceDto,
    isArray: true,
  })
  materialSubsections!: AssignmentMaterialReferenceDto[]
}

export class AssignmentDto {
  @ApiProperty({
    format: 'uuid',
    example: '88888888-8888-4888-8888-888888888888',
  })
  id!: string

  @ApiProperty({
    format: 'uuid',
    example: '66666666-6666-4666-8666-666666666666',
  })
  groupId!: string

  @ApiProperty({
    type: () => AssignmentTargetsDto,
  })
  targets!: AssignmentTargetsDto

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    example: 'Prepare contract review',
  })
  title!: string

  @ApiPropertyOptional({
    nullable: true,
    example: 'Подготовьте разбор API-контракта и зафиксируйте спорные поля.',
  })
  content!: string | null

  @ApiProperty({
    enum: assignmentStatusValues,
    example: 'PUBLISHED',
  })
  status!: (typeof assignmentStatusValues)[number]

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  dueAt!: string | null

  @ApiPropertyOptional({
    minimum: 0,
    nullable: true,
    example: 100,
  })
  maxScore!: number | null

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  publishedAt!: string | null

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  archivedAt!: string | null

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  createdByUserId!: string

  @ApiProperty({
    type: () => FileObjectDto,
    isArray: true,
  })
  files!: FileObjectDto[]

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: string
}
