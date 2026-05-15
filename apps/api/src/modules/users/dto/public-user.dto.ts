import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PublicUserDto {
  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  id!: string

  @ApiProperty({
    example: 'Alex Teacher',
  })
  displayName!: string

  @ApiPropertyOptional({
    nullable: true,
    example: 'Преподает веб-разработку и ведет открытые учебные группы.',
  })
  bio!: string | null

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  })
  avatarFileId!: string | null

  @ApiPropertyOptional({
    format: 'uri',
    nullable: true,
    example:
      'http://localhost:9000/smarteach-files/avatars/2026/04/12/aBcD1234xYz9.png?X-Amz-Algorithm=AWS4-HMAC-SHA256',
  })
  avatarUrl!: string | null
}
