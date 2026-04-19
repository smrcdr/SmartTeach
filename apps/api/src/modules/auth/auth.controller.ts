import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import type { Request, Response } from 'express'
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
import { AppConfigService } from '../../config/app-config.service'
import type { AuthContext } from '../../security/auth.types'
import { AccessTokenAuthGuard } from '../../security/access-token-auth.guard'
import { CurrentAuth } from '../../security/current-auth.decorator'
import { AuthService, type SessionMetadata } from './auth.service'
import {
  AUTH_REFRESH_COOKIE_NAME,
  buildRefreshTokenClearCookieOptions,
  buildRefreshTokenCookieOptions,
} from './auth-refresh-cookie'
import { AuthSessionDto } from './dto/auth-session.dto'
import { LoginRequestDto } from './dto/login-request.dto'
import { RegisterRequestDto } from './dto/register-request.dto'
import { TokenPairDto } from './dto/token-pair.dto'
import { UserDto } from '../users/dto/user.dto'

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(AppConfigService) private readonly appConfigService: AppConfigService,
  ) {}

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
  async register(
    @Body() payload: RegisterRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authSession = await this.authService.register(
      payload,
      this.buildSessionMetadata(request),
    )

    this.setRefreshTokenCookie(response, authSession.refreshToken)

    return this.toAuthSessionResponse(authSession)
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
  async login(
    @Body() payload: LoginRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authSession = await this.authService.login(
      payload,
      this.buildSessionMetadata(request),
    )

    this.setRefreshTokenCookie(response, authSession.refreshToken)

    return this.toAuthSessionResponse(authSession)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Обновить токены',
    description:
      'Читает refresh token из cookie, проверяет сессию и выдает новый access token.',
  })
  @ApiOkResponse({
    type: TokenPairDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokenPair = await this.authService.refresh(
      this.getRefreshTokenFromRequest(request),
    )

    this.setRefreshTokenCookie(response, tokenPair.refreshToken)

    return this.toTokenPairResponse(tokenPair)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Завершить текущую сессию',
    description: 'Отзывает текущую сессию пользователя по refresh token из cookie.',
  })
  @ApiNoContentResponse({
    description: 'Сессия успешно завершена.',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(this.getRefreshTokenFromRequest(request))
    this.clearRefreshTokenCookie(response)
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

  private getRefreshTokenFromRequest(request: Request) {
    const refreshToken = request.cookies?.[AUTH_REFRESH_COOKIE_NAME]

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing')
    }

    return refreshToken
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie(
      AUTH_REFRESH_COOKIE_NAME,
      refreshToken,
      buildRefreshTokenCookieOptions(this.appConfigService),
    )
  }

  private clearRefreshTokenCookie(response: Response) {
    response.clearCookie(
      AUTH_REFRESH_COOKIE_NAME,
      buildRefreshTokenClearCookieOptions(this.appConfigService),
    )
  }

  private toAuthSessionResponse(authSession: {
    user: UserDto
    accessToken: string
    refreshToken: string
    sessionId: string
  }): AuthSessionDto {
    return {
      user: authSession.user,
      accessToken: authSession.accessToken,
      sessionId: authSession.sessionId,
    }
  }

  private toTokenPairResponse(tokenPair: {
    accessToken: string
    refreshToken: string
    sessionId: string
  }): TokenPairDto {
    return {
      accessToken: tokenPair.accessToken,
      sessionId: tokenPair.sessionId,
    }
  }
}
