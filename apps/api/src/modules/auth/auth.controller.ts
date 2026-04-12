import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ErrorResponseDto } from '../../common/dto/error-response.dto'
import type { AuthContext } from '../../security/auth.types'
import { AccessTokenAuthGuard } from '../../security/access-token-auth.guard'
import { CurrentAuth } from '../../security/current-auth.decorator'
import { AuthService, type SessionMetadata } from './auth.service'
import { AuthSessionDto } from './dto/auth-session.dto'
import { LoginRequestDto } from './dto/login-request.dto'
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto'
import { RegisterRequestDto } from './dto/register-request.dto'
import { TokenPairDto } from './dto/token-pair.dto'
import { UserDto } from '../users/dto/user.dto'

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Зарегистрировать нового пользователя',
    description: 'Создает пользователя, стартовую сессию и возвращает пару токенов.',
  })
  @ApiCreatedResponse({
    type: AuthSessionDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
  })
  register(
    @Body() payload: RegisterRequestDto,
    @Req() request: Request,
  ) {
    return this.authService.register(payload, this.buildSessionMetadata(request))
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Войти в систему',
    description: 'Проверяет email и пароль и создает новую пользовательскую сессию.',
  })
  @ApiOkResponse({
    type: AuthSessionDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  login(
    @Body() payload: LoginRequestDto,
    @Req() request: Request,
  ) {
    return this.authService.login(payload, this.buildSessionMetadata(request))
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обновить токены',
    description: 'Принимает refresh token, проверяет сессию и выдает новую пару токенов.',
  })
  @ApiOkResponse({
    type: TokenPairDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  refresh(@Body() payload: RefreshTokenRequestDto) {
    return this.authService.refresh(payload)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Завершить текущую сессию',
    description: 'Отзывает текущую сессию пользователя по refresh token.',
  })
  @ApiNoContentResponse({
    description: 'Сессия успешно завершена.',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  async logout(
    @CurrentAuth() auth: AuthContext,
    @Body() payload: RefreshTokenRequestDto,
  ) {
    await this.authService.logout(auth, payload)
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Получить текущего пользователя',
  })
  @ApiOkResponse({
    type: UserDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  me(@CurrentAuth() auth: AuthContext) {
    return this.authService.getCurrentUser(auth.userId)
  }

  private buildSessionMetadata(request: Request): SessionMetadata {
    return {
      userAgent: request.get('user-agent') ?? null,
      ipAddress: request.ip ?? null,
    }
  }
}
