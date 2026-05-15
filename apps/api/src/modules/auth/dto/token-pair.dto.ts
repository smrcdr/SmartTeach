import { ApiProperty } from '@nestjs/swagger'

export class TokenPairDto {
  @ApiProperty()
  accessToken!: string

  @ApiProperty({
    format: 'uuid',
    example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  })
  sessionId!: string
}
