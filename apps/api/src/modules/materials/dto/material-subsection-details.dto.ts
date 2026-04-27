import { ApiProperty } from '@nestjs/swagger'
import { MaterialLessonDto } from './material-lesson.dto'
import { MaterialSubsectionDto } from './material-section.dto'

export class MaterialSectionSummaryDto {
  @ApiProperty({
    format: 'uuid',
    example: '88888888-8888-4888-8888-888888888888',
  })
  id!: string

  @ApiProperty({
    example: 'HTML и структура страницы',
  })
  title!: string

  @ApiProperty({
    minimum: 1,
    example: 1,
  })
  sortOrder!: number
}

export class MaterialSubsectionDetailsDto {
  @ApiProperty({
    type: () => MaterialSectionSummaryDto,
  })
  section!: MaterialSectionSummaryDto

  @ApiProperty({
    type: () => MaterialSubsectionDto,
  })
  subsection!: MaterialSubsectionDto

  @ApiProperty({
    type: () => MaterialLessonDto,
    isArray: true,
  })
  lessons!: MaterialLessonDto[]
}
