import type { CookieOptions } from 'express'
import { AppConfigService } from '../../config/app-config.service'

export const AUTH_REFRESH_COOKIE_NAME = 'refreshToken'
const AUTH_REFRESH_COOKIE_PATH = '/api/v1/auth'

function buildBaseRefreshCookieOptions(
  config: AppConfigService,
): Pick<CookieOptions, 'httpOnly' | 'path' | 'sameSite' | 'secure'> {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: AUTH_REFRESH_COOKIE_PATH,
  }
}

export function buildRefreshTokenCookieOptions(
  config: AppConfigService,
): CookieOptions {
  return {
    ...buildBaseRefreshCookieOptions(config),
    maxAge: config.jwtRefreshTtlSeconds * 1000,
  }
}

export function buildRefreshTokenClearCookieOptions(
  config: AppConfigService,
): CookieOptions {
  return buildBaseRefreshCookieOptions(config)
}
