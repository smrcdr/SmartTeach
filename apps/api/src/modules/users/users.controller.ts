import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ErrorResponseDto } from '../../common/dto/error-response.dto'
import { CurrentAuth } from '../../security/current-auth.decorator'
import type { AuthContext } from '../../security/auth.types'
import { AccessTokenAuthGuard } from '../../security/access-token-auth.guard'
import { UpdateMyProfileRequestDto } from './dto/update-my-profile-request.dto'
import { PublicUserDto } from './dto/public-user.dto'
import { UserDto } from './dto/user.dto'
import { mapPublicUserToDto, mapUserToDto } from './users.mapper'
import { UsersService } from './users.service'

@ApiTags('Users')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обновить собственный профиль',
    description: 'Позволяет изменить display name, bio и avatar пользователя.',
  })
  @ApiOkResponse({
    type: UserDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  async updateMe(
    @CurrentAuth() auth: AuthContext,
    @Body() payload: UpdateMyProfileRequestDto,
  ) {
    const user = await this.usersService.updateCurrentUser(auth.userId, payload)

    return mapUserToDto(user)
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить публичный профиль пользователя',
  })
  @ApiOkResponse({
    type: PublicUserDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  async getPublicUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    const user = await this.usersService.getPublicUserOrThrow(userId)

    return mapPublicUserToDto(user)
  }
}
