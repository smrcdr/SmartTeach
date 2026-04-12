import { ApiProperty } from '@nestjs/swagger'
import { UserDto } from '../../users/dto/user.dto'

export class AuthSessionDto {
  @ApiProperty({
    type: UserDto,
  })
  user!: UserDto

  @ApiProperty()
  accessToken!: string

  @ApiProperty()
  refreshToken!: string

  @ApiProperty({
    format: 'uuid',
    example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  })
  sessionId!: string
}
