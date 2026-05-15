import { ApiProperty } from '@nestjs/swagger'

export class FileObjectDto {
  @ApiProperty({
    format: 'uuid',
    example: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  })
  id!: string

  @ApiProperty({
    example: 'avatar.png',
  })
  originalName!: string

  @ApiProperty({
    example: 'image/png',
  })
  mimeType!: string

  @ApiProperty({
    example: 204800,
  })
  sizeBytes!: number

  @ApiProperty({
    format: 'uuid',
    example: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  })
  uploadedByUserId!: string

  @ApiProperty({
    format: 'uri',
    example:
      'http://localhost:9000/smarteach-files/avatars/2026/04/12/aBcD1234xYz9.png?X-Amz-Algorithm=AWS4-HMAC-SHA256',
  })
  url!: string

  @ApiProperty({
    format: 'date-time',
    example: '2026-04-12T00:00:00.000Z',
  })
  createdAt!: string
}
